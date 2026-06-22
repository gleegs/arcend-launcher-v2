// Transforme une URL d'image distante en URL du protocole de cache local
// (`arcend-img://`). Le main process télécharge l'image au premier accès puis
// la sert depuis le disque ensuite. Les URLs non http(s) sont laissées telles
// quelles (assets bundlés, data URLs…).
export function cachedImage(url: string): string {
  if (!/^https?:\/\//i.test(url)) return url
  return `arcend-img://img/?u=${encodeURIComponent(url)}`
}
