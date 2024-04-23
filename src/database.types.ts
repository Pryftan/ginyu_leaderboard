export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
    public: {
      Tables: {
        players: {
            Row: {
                id: number
                name: string
                characters: Array<number>
            }
        }
        events: {
            Row: {
                id: number
                name: string
                date: Date
                participants: [number]
            }            
            Insert: { 
                id?: never
                name: string
                date: Date
                participants: [number]
            }
            Update: {
                id?: never
                name?: string
                date?: Date
                participants?: [number]
            }
        }
        characters: {
            Row: {
                id: number
                name: string
            }
        }
        scores: {
            Row: {
                id: number
                event: number
                match: number
                player: number
                character?: number
                score: number
            }
            Insert: {
                id?: never
                event: number
                match: number
                name: number
                character?: number
                score: number
            }
            Update: {
                id?: never
                event?: number
                match?: number
                name?: number
                character?: number
                score?: number
            }
        }
        states: {
            Row: { 
                id: string
                enabled: boolean
                data: Json
            }
            Update: {
                id?: never
                enabled?: boolean
                data?: Json
            }
        }
      }
    }
  }