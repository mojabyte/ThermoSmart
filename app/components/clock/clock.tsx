import React, { useState, useEffect } from "react"
import { ClockProps } from "./clock.props"
import moment from "moment-jalaali"
import BackgroundTimer from 'react-native-background-timer'
import { Text } from "../text/text"

export function Clock(props: ClockProps): JSX.Element {
  const {
    initialTime = +moment(),
    ...rest
  } = props

  const [time, setTime] = useState(initialTime)

  useEffect(() => {
    setTime(initialTime)
    let timer = null
    const diff = (60 - moment(initialTime).seconds()) * 1000
    const timeout = BackgroundTimer.setTimeout(() => {
      setTime(time => time + diff)
      timer = BackgroundTimer.setInterval(() => {
        setTime(time => time + 60000)
      }, 60000)
    }, diff)

    return () => {
      BackgroundTimer.clearTimeout(timeout)
      BackgroundTimer.clearInterval(timer)
    }
  }, [initialTime])

  return <Text text={moment(time).utc().format('HH:mm')} {...rest}/>
}
