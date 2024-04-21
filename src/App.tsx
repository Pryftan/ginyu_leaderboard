import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { Database } from './database.types'
import { Flex, Center, Select, Box, Button, Tag } from '@chakra-ui/react'
import { Reorder } from "framer-motion";
import { Score } from "./Score";
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

interface Score {
  id: number;
  name: string;
  totalScore: number;
  averageScore: number;
}

function App() {
  const [events, setEvents] = useState<Array<Event>>([])
  const [selectedEvent, setSelectedEvent] = useState<Event>()
  const [scores, setScores] = useState<Array<Score>>([])
  const [sortedScores, setSortedScores] = useState<Array<Score>>([])
  const [errorMessage, setErrorMessage] = useState<string>('')
  const [sortProperty, setSortProperty] = useState<string>('totalScore')

  const sortArrayByProperty = (prop: string) => {
    if (prop == 'averageScore' || prop == 'totalScore') {
      return [...scores].sort((a,b) => b[`${prop}`] - a[`${prop}`])
    } else {
      return scores
    }
  }
  
  const getEvents = async () => {
    let { data, error } = await supabase
      .from('events')
      .select('*')
      .order('date', { ascending: false })
    setEvents(data || [])
    setErrorMessage(error?.message || '')
    if (data) {
      await selectEvent(data[0])
    }
  }

  const selectEvent = async (currEvent: Event) => {
    setSelectedEvent(currEvent)
    refreshScores(currEvent)
  }

  const refreshScores = async (currEvent: Event) => {
    let { data: players, error} = await supabase
      .from('players')
      .select('id, name')
      .in('id', currEvent.participants)
    if (error) {
      setErrorMessage(error?.message)
      return
    }
    let { data, error: error2 } = await supabase
      .from('scores')
      .select('*')
      .eq('event', currEvent.id)
    if (error2) {
      setErrorMessage(error2?.message)
      return
    }
    if (players) {
      if (data) {
        setScores(players.map(player=>{
          const total = data?.filter((score)=>score.player == player.id).reduce((acc, cur)=>acc+cur.score,0)
          const count = data?.filter((score)=>score.player == player.id).length || 0
          return {
            id: player.id, 
            name: player.name,
            totalScore: total,
            averageScore: total / count,
          }
        }))
      }
    }
  }

  useEffect(() => {
    getEvents()
  }, [])

  useEffect(() => {
    const refreshScoresIf = async (eventID: number) => {
      if (selectedEvent) {
        if (eventID == selectedEvent.id) {
          refreshScores(selectedEvent)
        }
      }
    }

    const subscription = supabase.channel('custom-insert-channel')
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'scores' },
      (payload) => {
        //console.log('Change received!', payload)
        refreshScoresIf(payload.new.event)
      }
    )
    .subscribe()
    return () => {
      supabase.removeChannel(subscription)
    };
  }, [selectedEvent])

  useEffect(() => {
    const sortData = () => {
      setSortedScores(sortArrayByProperty(sortProperty))
    }
    sortData()
  }, [scores, sortProperty])

  return (
    <>
      <Flex p={3} flexDir={'column'} w='300px'>
      {events && 
        <>
        <Center>
          <Select 
            onChange={(e: React.ChangeEvent<HTMLSelectElement>)=>{
              selectEvent(events.filter((event)=>event.id==parseInt(e.currentTarget.value))[0])
          }}>
            {events.map((event) =>
              <option 
                key={event.id} 
                value={event.id}
              >
                {event.name} ({event.date.toString()})
              </option>
            )}
          </Select>
        </Center>
        <Flex flexDir={'column'}>
          <Reorder.Group as='div' draggable={false} dragControls={undefined} onReorder={()=>{}} dragListener={false} axis='y' values={sortedScores}>
            {sortedScores && sortedScores.map((score) =>
              <Reorder.Item 
                as='div' 
                key={score.id} 
                dragListener={false}
                draggable={false} 
                value={score}
              >
                {score.totalScore > 0 &&
                <Flex key={score.id} mb={2} justify={'space-between'} flexDir='row'>
                  <Box key={`${score.id}_name`} p={2}>
                    {score.name}
                  </Box>
                  <Box key={`${score.id}_score`} p={2}>
                    {sortProperty == 'totalScore' && score.totalScore}
                    {sortProperty == 'averageScore' && score.averageScore.toPrecision(2)}
                  </Box>
                </Flex>}
              </Reorder.Item>
            )}
          </Reorder.Group>
        </Flex>
        {scores.map(({totalScore})=>totalScore).reduce((a,c)=>a+c,0) > 0 && <Flex mb={2} justify={'space-between'} flexDir='row'>
          <Button p={0} variant={'ghost'} size='xs' onClick={() => setSortProperty('totalScore')}>
              <Tag 
                  borderRadius={'3xl'} 
                  m={2}
                  fontSize='xs'
                  fontWeight={sortProperty == 'totalScore' ? 'bold' : 'normal'} 
                  variant={sortProperty == 'totalScore' ? 'solid' : 'subtle'}
                  >
                      Total
                  {//property == 'dollarVolume' && <TagRightIcon as={FiChevronDown}/> 
                  }
              </Tag>
          </Button>
            <Button p={0} variant={'ghost'} size='xs' onClick={() => setSortProperty('averageScore')}>
              <Tag 
                  borderRadius={'3xl'} 
                  m={2}
                  fontSize='xs'
                  fontWeight={sortProperty == 'averageScore' ? 'bold' : 'normal'} 
                  variant={sortProperty == 'averageScore' ? 'solid' : 'subtle'}
                  >
                      Average
                  {//property == 'Funded' && <TagRightIcon as={FiChevronDown}/> 
                  }
              </Tag>
          </Button>
        </Flex>}
        </>
      }
      </Flex>
      {errorMessage && <p>{errorMessage}</p>}
    </>
  )
}

export default App
