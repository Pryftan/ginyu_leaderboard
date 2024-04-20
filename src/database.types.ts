export interface Database {
    public: {
      Tables: {
        events: {
          Row: { 
            id: number
            name: string
            date: Date
            participants: [string]
          }
          Insert: { 
            id?: never
            name: string
            date: Date
            participants: [string]
          }
          Update: {
            id?: never
            name?: string
            date?: Date
            participants?: [string]
          }
        }
      }
    }
  }