import 'dotenv/config'
import type { ForgeConfig } from '@electron-forge/shared-types'
import { MakerSquirrel } from '@electron-forge/maker-squirrel'
import { MakerZIP } from '@electron-forge/maker-zip'
import { MakerDeb } from '@electron-forge/maker-deb'
import { MakerRpm } from '@electron-forge/maker-rpm'
import { VitePlugin } from '@electron-forge/plugin-vite'
import { PublisherGithub } from '@electron-forge/publisher-github'

const config: ForgeConfig = {
  packagerConfig: {
    asar: true,
    executableName: 'arcend-launcher',
    icon: 'build/icon',
  },
  rebuildConfig: {},
  makers: [
    new MakerSquirrel({ setupIcon: 'build/icon_setup.ico', setupExe: 'Arcend Launcher Setup.exe' }),
    new MakerZIP({}, ['darwin']),
    new MakerDeb({
      options: {
        icon: 'build/icon.png',
        name: 'arcend-launcher',
        productName: 'Arcend Launcher',
        categories: ['Game'],
      },
    }),
    new MakerRpm({
      options: {
        icon: 'build/icon.png',
        name: 'arcend-launcher',
        productName: 'Arcend Launcher',
        categories: ['Game'],
      },
    }),
  ],
  publishers: [
    new PublisherGithub({
      repository: {
        owner: 'gleegs',
        name: 'arcend-launcher-v2',
      },
      authToken: process.env.GITHUB_TOKEN,
      prerelease: true,
      generateReleaseNotes: true,
    }),
  ],
  plugins: [
    new VitePlugin({
      build: [
        {
          entry: 'src/main.ts',
          config: 'vite.main.config.ts',
          target: 'main',
        },
        {
          entry: 'src/preload.ts',
          config: 'vite.preload.config.ts',
          target: 'preload',
        },
      ],
      renderer: [
        {
          name: 'main_window',
          config: 'vite.renderer.config.ts',
        },
      ],
    }),
  ],
}

export default config
