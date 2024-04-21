import { useState, useEffect } from 'react'
import CountUp from 'react-countup';

interface props {
    value: number
}

const delay = (ms: number | undefined) => new Promise(res => setTimeout(res, ms));

export const Score = ( { value }: props ) => {
    const [newValue, setNewValue] = useState<number>(value)
    const [oldValue, setOldValue] = useState<number>(value)

     useEffect(() => {
        async function setRows(){
            // If there has been a change in dollarVolume
            if(oldValue && (oldValue !== newValue)){
                setNewValue(value)
                await delay(2100)
                setOldValue(value)
            }
            // If this is the first render
            else{
                setNewValue(value)
                setOldValue(value)
            }
        }
        setRows()
    }, [value])

    return (
        <CountUp
            duration={2}
            start={oldValue}
            end={newValue}
        />
    )
}