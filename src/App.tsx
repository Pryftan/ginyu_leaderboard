import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { Database } from './database.types'
import { Flex, Center, Select } from '@chakra-ui/react'
import './App.css'

const supabaseUrl = 'https://bnptqkapdobymqdnlowf.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJucHRxa2FwZG9ieW1xZG5sb3dmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTM1ODE1ODYsImV4cCI6MjAyOTE1NzU4Nn0.00HoKGwNxSdzJjFHSoxbJSt0BqrtTMyNJQSRBqxcre8'
const supabase = createClient<Database>(supabaseUrl, supabaseKey)

interface Event {
  id: number;
  name: string;
  date: Date;
  participants: [number];
}

function App() {
  const [events, setEvents] = useState<Array<Event>>([]);
  const [errorMessage, setErrorMessage] = useState("");

  const getEvents = async () => {
    let { data, error } = await supabase
    .from('events')
    .select('*');
    setEvents(data || []);
    setErrorMessage(error?.message || "");
  }

  useEffect(() => {
    getEvents()
  }, [])

  return (
    <>
      <h2>Leaderboard</h2>
      {events && 
        <Flex>
          <Center>
            <Select>
              {events.map((event) =>
                <option key={event.id} value={event.id}>{event.name}</option>
              )}
            </Select>
          </Center>
        </Flex>
      }
      {errorMessage && <p>{errorMessage}</p>}
    </>
  )
}

export default App
