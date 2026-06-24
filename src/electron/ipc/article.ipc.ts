import { IpcChannels } from '../types/ipc'
import { fetchLatestArticle } from '../services/sanity'
import { safeHandle } from './utils'

export function registerArticleIpc(): void {
  safeHandle(IpcChannels.ARTICLE_FETCH_LATEST, () => fetchLatestArticle())
}
