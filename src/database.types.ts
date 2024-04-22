export interface Event {
    id: number
    name: string
    date: Date
    participants: [number]
}

export interface RawScore {
    id: number
    event: number
    match: number
    name: string
    character?: string
    score: number
}

export interface Database {
    public: {
      Tables: {
        events: {
            Row: Event
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
        scores: {
            Row: RawScore
            Insert: {
                id?: never
                event: number
                match: number
                name: string
                character?: string
                score: number
            }
            Update: {
                id?: never
                event?: number
                match?: number
                name?: string
                character?: string
                score?: number
            }
        }
      }
    }
  }