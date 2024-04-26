import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { Database } from './database.types'
import { Flex, Center, Select, Box, Button, Tag, Avatar, Image } from '@chakra-ui/react'
import { Reorder, motion } from "framer-motion";
import './App.css'

const supabaseUrl = 'https://bnptqkapdobymqdnlowf.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJucHRxa2FwZG9ieW1xZG5sb3dmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTM1ODE1ODYsImV4cCI6MjAyOTE1NzU4Nn0.00HoKGwNxSdzJjFHSoxbJSt0BqrtTMyNJQSRBqxcre8'
const supabase = createClient<Database>(supabaseUrl, supabaseKey)

const delay = (ms: number | undefined) => new Promise(res => setTimeout(res, ms));
const avgPrecision = (total: number, divisor: number)  => divisor == 1 ? total.toString() : divisor == 10 ? (total / 10).toFixed(1) : (total / divisor).toFixed(2)

type Event = Database['public']['Tables']['events']['Row']

interface Score {
  id: number
  name: string
  totalScore: number
  averageScore: number
  count: number
}

interface CoverData {
  image: string
  size?: number
  top?: number
  hides?: boolean
}

interface Cover {
  enabled: boolean
  data: CoverData
}

function App() {
  const [events, setEvents] = useState<Array<Event>>([])
  const [selectedEvent, setSelectedEvent] = useState<Event>()
  const [scores, setScores] = useState<Array<Score>>([])
  const [sortedScores, setSortedScores] = useState<Array<Score>>([])
  const [errorMessage, setErrorMessage] = useState<string>('')
  const [sortProperty, setSortProperty] = useState<string>('totalScore')
  const [playing, setPlaying] = useState<Array<string>>([])
  const [cover, setCover] = useState<Cover>({enabled: false, data: {image: '/covers/empty.png', hides: false}})
  const [hideAll, setHideAll] = useState(false)

  const sortArrayByProperty = (prop: string) => {
    if (prop == 'averageScore' || prop == 'totalScore') {
      return [...scores].sort((a,b) => b[`${prop}`] - a[`${prop}`])
    } else {
      return scores
    }
  }

  const getStates = async () => {
    let { data, error } = await supabase
      .from('states')
      .select('*')
    setErrorMessage(error?.message || '')
    if (data) {
      const coverState = data.filter((entry)=>entry.id=='cover')[0]
      setCover(coverState)
      if (coverState.hides || false) {
        setHideAll(coverState.enabled)
      }
      const playingState = data.filter((entry)=>entry.id=='playing')[0]
      if (playingState.enabled) {
        setPlaying(playingState.data.players)
      }
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
            count: count
          }
        }))
      }
    }
  }

  const triggerCover = async (cover: Cover) => {
    setCover(cover)
    if (cover.data.hides || false) {
      await delay(500)
      setHideAll(cover.enabled)
    }
  }

  useEffect(() => {
    getStates()
    getEvents()
    const subscription = supabase.channel('custom-update-channel')
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'states' },
      (payload) => {
        if (payload.new.id == 'cover') {
          triggerCover({enabled: payload.new.enabled, data: payload.new.data})
        } else if (payload.new.id == 'playing') {
          if (payload.new.enabled) {
            setPlaying(payload.new.data.players)
          } else {
            setPlaying([])
          }
        }
      }
    )
    .subscribe()
    return () => {
      supabase.removeChannel(subscription)
    };
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
      <Flex p={3} flexDir={'column'} w='335px'>
        <Center>
          <div style={{'position': 'absolute', 'top': `${cover.data.top || 0}px`}}>
          <motion.div
            initial={false}
            animate={{
              height: cover.enabled ? cover.data.size || 50 : 0,
              width: cover.enabled ? cover.data.size || 50 : 0,
            }}
          >
            <Box position={'relative'} zIndex={2}>
              <Image src={`/ginyu_leaderboard${cover.data.image}`} objectFit={'cover'} boxSize={'100%'}/>
            </Box>
            </motion.div>
          </div>
        </Center>
      {events && !hideAll &&
        <>
        <Center>
          <Select 
            defaultValue={selectedEvent?.id || 0}
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
                {score.totalScore > -1 &&
                <Flex key={score.id} mb={2} justify={'space-between'} flexDir='row'>
                  <Box key={`${score.id}_name`} p={2}>
                    <Avatar 
                        key={`${score.name}-avatar`} 
                        mr={2} 
                        src={`/ginyu_leaderboard/avatars/${score.name}.png`} 
                        size='sm'>
                    </Avatar>
                    {playing.includes(score.name) && <b>{score.name}</b>}
                    {!playing.includes(score.name) && score.name}
                  </Box>
                  <Box key={`${score.id}_score`} p={2}>
                    {sortProperty == 'totalScore' && score.totalScore}
                    {sortProperty == 'averageScore' && (isNaN(score.averageScore) ? '-' : avgPrecision(score.totalScore, score.count))}
                  </Box>
                </Flex>}
              </Reorder.Item>
            )}
            {scores.map(({totalScore})=>totalScore).reduce((a,c)=>a+c,0) > -1 && 
              <Reorder.Item 
                as='div' 
                key={'buttons'} 
                dragListener={false}
                draggable={false}
                value={'buttons'}
              >
              <Flex mb={2} justify={'space-between'} flexDir='row'>
              <Button p={0} variant={''} size='xs' onClick={() => setSortProperty('totalScore')}>
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
              <Button p={0} variant={''} size='xs' onClick={() => setSortProperty('averageScore')}>
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
            </Flex>
            </Reorder.Item>}
          </Reorder.Group>
        </Flex>
        </>
      }
      </Flex>
      {errorMessage && <p>{errorMessage}</p>}
    </>
  )
}

export default App
