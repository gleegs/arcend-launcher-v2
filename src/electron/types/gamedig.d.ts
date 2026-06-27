// gamedig v5 ne fournit pas de types TypeScript natifs.
// Déclaration minimale pour les champs que l'on utilise.
declare module 'gamedig' {
  export interface QueryOptions {
    type: string
    host: string
    port?: number
    maxRetries?: number
    socketTimeout?: number
    attemptTimeout?: number
  }

  export interface QueryResult {
    name: string
    map: string
    password: boolean
    version: string
    maxplayers: number
    numplayers: number
    players: { name: string; raw?: unknown }[]
    bots: { name: string; raw?: unknown }[]
    queryPort: number
    ping: number
    connect: string
    raw: unknown
  }

  export class GameDig {
    static query(options: QueryOptions): Promise<QueryResult>
  }
}
