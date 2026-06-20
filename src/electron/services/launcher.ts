import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import https from 'node:https'
import http from 'node:http'
import { Client, type ILauncherOptions, type IUser } from 'minecraft-launcher-core'
import { getMainWindow, hideWindow, restoreWindow } from './window'
import { IpcChannels } from '../types/ipc'
import type { CachedProfile } from '../types/ipc'
import { getConfig } from './store'
import { auth, decryptToken } from './auth'
import { getArcPath, getRegistry as getArcRegistry } from './arc'
import { ensureJava, getJavaExecutable } from './java'
import type {
  LaunchOptions,
  LaunchProgress,
  LogLevel,
  LogEntry,
  LogSource,
} from '../types/launcher'

let activeLauncher: Client | null = null

let logIdCounter = 0

function sendProgress(progress: LaunchProgress): void {
  const win = getMainWindow()
  if (win && !win.isDestroyed()) {
    win.webContents.send(IpcChannels.LAUNCH_ON_PROGRESS, progress)
  }
}

function sendLog(level: LogLevel, message: string, source: LogSource): void {
  const win = getMainWindow()
  if (win && !win.isDestroyed()) {
    const entry: LogEntry = {
      id: ++logIdCounter,
      timestamp: Date.now(),
      level,
      message,
      source,
    }
    win.webContents.send(IpcChannels.LAUNCH_ON_LOG, entry)
  }
}

function classifyLine(line: string): LogLevel {
  const upper = line.toUpperCase()
  if (/\b(ERROR|EXCEPTION|FATAL|FAILED|CRASH)\b/.test(upper)) return 'error'
  if (/\b(WARN|WARNING)\b/.test(upper)) return 'warn'
  return 'info'
}

function createOfflineToken(profile: CachedProfile): IUser {
  return {
    access_token: crypto.randomBytes(16).toString('hex'),
    client_token: crypto.randomUUID(),
    uuid: profile.id.replace(/-/g, ''),
    name: profile.name,
    user_properties: {},
    meta: {
      type: 'mojang',
      demo: false,
    },
  }
}

async function getOnlineToken(): Promise<IUser> {
  const encryptedToken = getConfig('encryptedRefreshToken')
  if (!encryptedToken) {
    throw new Error("Aucun token d'authentification trouvé. Veuillez vous connecter.")
  }

  sendLog('info', 'Décryptage du token...', 'launcher')
  const refreshToken = decryptToken(encryptedToken)
  if (!refreshToken) {
    throw new Error("Impossible de décrypter le token d'authentification.")
  }

  sendLog('info', 'Rafraîchissement du token Microsoft...', 'launcher')
  const xbox = await auth.refresh(refreshToken)

  sendLog('info', 'Récupération du profil Minecraft...', 'launcher')
  const minecraft = await xbox.getMinecraft()
  if (!minecraft.profile) {
    throw new Error('Profil Minecraft non trouvé. Veuillez vous reconnecter.')
  }

  sendLog('info', `Connecté en tant que ${minecraft.profile.name}`, 'launcher')
  return minecraft.mclc() as IUser
}

function getOfflineToken(): IUser {
  const cached = getConfig('cachedProfile')
  if (!cached) {
    throw new Error('Aucun profil en cache. Veuillez vous connecter au moins une fois.')
  }
  sendLog('info', `Connecté hors ligne en tant que ${cached.name}`, 'launcher')
  return createOfflineToken(cached)
}

function downloadFile(url: string, destPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const dir = path.dirname(destPath)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }

    const doRequest = (requestUrl: string) => {
      const client = requestUrl.startsWith('https') ? https : http
      client
        .get(requestUrl, (res) => {
          if (
            res.statusCode &&
            res.statusCode >= 300 &&
            res.statusCode < 400 &&
            res.headers.location
          ) {
            doRequest(res.headers.location)
            return
          }
          if (res.statusCode && res.statusCode >= 400) {
            reject(new Error(`Download failed: HTTP ${res.statusCode}`))
            return
          }
          const file = fs.createWriteStream(destPath)
          res.pipe(file)
          file.on('finish', () => file.close(() => resolve()))
        })
        .on('error', (err) => {
          if (fs.existsSync(destPath)) fs.unlinkSync(destPath)
          reject(err)
        })
    }

    doRequest(url)
  })
}

async function ensureModLoaderInstaller(
  arcPath: string,
  modLoader: { type: string; version: string; installerUrl: string }
): Promise<string> {
  const installerName = `${modLoader.type}-${modLoader.version}-installer.jar`
  const installerPath = path.join(arcPath, installerName)

  if (fs.existsSync(installerPath)) {
    return installerPath
  }

  await downloadFile(modLoader.installerUrl, installerPath)

  return installerPath
}

export async function launchGame(options: LaunchOptions): Promise<void> {
  if (activeLauncher) {
    throw new Error("Un jeu est déjà en cours d'exécution.")
  }

  const { arcId, mode, maxMemory = '4G', minMemory = '2G' } = options

  sendProgress({ status: 'validating_arc', percent: 0 })
  sendLog('info', `Lancement de l'arc "${arcId}" (${mode})`, 'launcher')

  const arcRegistry = getArcRegistry()
  const installation = arcRegistry.installations[arcId]
  if (!installation) {
    sendLog('error', `Arc "${arcId}" non installé`, 'launcher')
    throw new Error(`Arc "${arcId}" n'est pas installé.`)
  }

  const arcPath = getArcPath(arcId)
  const mcPath = path.join(arcPath, 'minecraft')
  if (!fs.existsSync(mcPath)) {
    sendLog('error', `Dossier minecraft introuvable pour "${arcId}"`, 'launcher')
    throw new Error(`Dossier minecraft introuvable pour l'arc "${arcId}".`)
  }

  sendLog('info', 'Arc validé', 'launcher')

  sendProgress({ status: 'validating_auth', percent: 10 })
  sendLog(
    'info',
    mode === 'online' ? 'Authentification Microsoft...' : 'Mode hors ligne',
    'launcher'
  )

  if (!installation.metadata.mcVersion) {
    sendLog('error', `Version Minecraft manquante pour "${arcId}"`, 'launcher')
    throw new Error(
      `Arc "${arcId}" : version Minecraft non disponible. Veuillez réinstaller l'arc.`
    )
  }

  let userToken: IUser
  try {
    userToken = mode === 'online' ? await getOnlineToken() : getOfflineToken()
  } catch (error) {
    sendLog(
      'error',
      `Erreur d'authentification : ${error instanceof Error ? error.message : String(error)}`,
      'launcher'
    )
    throw new Error(
      `Erreur d'authentification : ${error instanceof Error ? error.message : String(error)}`
    )
  }

  sendProgress({ status: 'preparing_launch', percent: 30 })
  sendLog('info', 'Préparation du lancement...', 'launcher')

  const { mcVersion, modLoader, javaVersion } = installation.metadata

  let forgePath: string | undefined
  if (modLoader) {
    sendLog('info', `Mod loader ${modLoader.type} ${modLoader.version}`, 'launcher')
    forgePath = await ensureModLoaderInstaller(arcPath, modLoader)
    sendLog('info', 'Mod loader prêt', 'launcher')
  }

  const resolvedJavaVersion = javaVersion || '21'
  sendLog('info', `Vérification de Java ${resolvedJavaVersion}...`, 'launcher')
  await ensureJava(resolvedJavaVersion)
  const javaPath = getJavaExecutable(resolvedJavaVersion)
  sendLog('info', `Java : ${javaPath}`, 'launcher')

  const launcher = new Client()
  activeLauncher = launcher

  const launchOpts: ILauncherOptions = {
    authorization: userToken,
    root: mcPath,
    version: {
      number: mcVersion,
      type: 'release',
    },
    memory: {
      max: maxMemory,
      min: minMemory,
    },
    javaPath,
    forge: forgePath,
    overrides: {
      detached: false,
    },
  }

  return new Promise((resolve, reject) => {
    launcher.on('debug', (e: string) => {
      console.log(`[MCLC Debug] ${e}`)
      sendLog(classifyLine(e), e, 'game')
    })

    launcher.on('data', (e: string) => {
      console.log(`[MCLC] ${e}`)
      sendLog(classifyLine(e), e, 'game')
      if (e.includes('Setting user:')) {
        sendProgress({ status: 'running', percent: 100 })
        sendLog('info', 'Jeu lancé', 'launcher')
        hideWindow()
      }
    })

    launcher.on('close', (code: number | null) => {
      activeLauncher = null
      restoreWindow()

      sendLog(
        code === 0 || code === null ? 'info' : 'error',
        `Jeu fermé${code !== null ? ` (code ${code})` : ''}`,
        'launcher'
      )

      sendProgress({
        status: 'closed',
        percent: 100,
        exitCode: code,
      })

      resolve()
    })

    sendLog('info', `Lancement de Minecraft ${mcVersion}...`, 'launcher')
    sendLog('info', `Mémoire : ${minMemory} / ${maxMemory}`, 'launcher')
    sendProgress({ status: 'launching', percent: 60 })

    launcher.launch(launchOpts).catch((err: Error) => {
      activeLauncher = null
      restoreWindow()

      sendLog('error', `Erreur lors du lancement : ${err.message}`, 'launcher')

      sendProgress({
        status: 'error',
        percent: 0,
        error: err.message,
      })

      reject(new Error(`Erreur lors du lancement : ${err.message}`))
    })
  })
}

export function isGameRunning(): boolean {
  return activeLauncher !== null
}
