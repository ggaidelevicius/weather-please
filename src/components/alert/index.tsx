import { Alert as MantineAlert } from '@mantine/core'
import { IconAlertTriangle, IconInfoCircle } from '@tabler/icons-react'
import { AnimatePresence, motion } from 'framer-motion'
import type { ReactElement } from 'react'
import { useEffect, useState } from 'react'
import styles from './styles.module.css'
import type { AlertProps } from './types'

const Alert = (props: AlertProps) => {
  const { totalPrecipitation, hoursOfExtremeUv, hoursOfHighWind, useMetric } = props
  const [alerts, setAlerts] = useState<ReactElement[] | []>([])

  useEffect(() => {
    let precipitationAlert: ReactElement | null = null
    if ((useMetric && totalPrecipitation >= 15) || totalPrecipitation >= 0.590551) {
      precipitationAlert = (
        <MantineAlert
          className={styles.alert}
          radius="md"
          styles={{ message: { fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' } }}
          key='precipitationAlert'
        >
          <IconInfoCircle size="2rem" strokeWidth={1.5} />
          {totalPrecipitation}{useMetric ? 'mm' : 'in'} of precipitation expected over the next 6 hours
        </MantineAlert>
      )
      setAlerts((prev) => {
        const prevPrecipitationAlertIndex = prev.findIndex(
          (alert) => alert.key === 'precipitationAlert'
        )

        if (prevPrecipitationAlertIndex !== -1) {
          const newAlerts = [...prev]
          newAlerts[prevPrecipitationAlertIndex] = precipitationAlert as ReactElement
          return newAlerts
        } else {
          return [...prev, precipitationAlert as ReactElement]
        }
      })
    } else {
      setAlerts((prev) => prev.filter(alert => alert.key !== 'precipitationAlert'))
    }
  }, [useMetric, totalPrecipitation])

  useEffect(() => {
    let windAlert: ReactElement | null = null
    if (hoursOfHighWind.includes(true)) {
      const alertProps = {
        className: styles.alert,
        radius: 'md',
        styles: { message: { fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' } },
        key: 'windAlert',
      }
      const timeUntilHighWind = hoursOfHighWind.indexOf(true) + 1
      if (timeUntilHighWind > 1) {
        windAlert = (
          <MantineAlert {...alertProps} >
            <IconInfoCircle size="2rem" strokeWidth={1.5} />

            High wind starting in {timeUntilHighWind} hours
          </MantineAlert>
        )
      } else {
        const durationOfHighWind = hoursOfHighWind.indexOf(false)
        windAlert = (
          <MantineAlert {...alertProps}>
            <IconInfoCircle size="2rem" strokeWidth={1.5} />

            High wind for the next {durationOfHighWind > 0 ? `${durationOfHighWind} hours` : durationOfHighWind < 0 ? '12 hours' : 'hour'}
          </MantineAlert>
        )
      }
      setAlerts((prev) => {
        const prevWindAlertIndex = prev.findIndex(
          (alert) => alert.key === 'windAlert'
        )

        if (prevWindAlertIndex !== -1) {
          const newAlerts = [...prev]
          newAlerts[prevWindAlertIndex] = windAlert as ReactElement
          return newAlerts
        } else {
          return [...prev, windAlert as ReactElement]
        }
      })
    } else {
      setAlerts((prev) => prev.filter(alert => alert.key !== 'windAlert'))
    }
  }, [hoursOfHighWind])

  useEffect(() => {
    let uvAlert: ReactElement | null = null
    if (hoursOfExtremeUv.includes(true)) {
      const alertProps = {
        className: styles.alert,
        radius: 'md',
        color: 'yellow',
        styles: { message: { fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' } },
        key: 'uvAlert',
      }
      const timeUntilExtremeUv = hoursOfExtremeUv.indexOf(true) + 1
      if (timeUntilExtremeUv > 1) {
        uvAlert = (
          <MantineAlert {...alertProps} >
            <IconAlertTriangle size="2rem" strokeWidth={1.5} />
            Extreme UV starting in {timeUntilExtremeUv} hours
          </MantineAlert>
        )
      } else {
        const durationOfExtremeUv = hoursOfExtremeUv.indexOf(false)
        uvAlert = (
          <MantineAlert {...alertProps}>
            <IconAlertTriangle size="2rem" strokeWidth={1.5} />
            Extreme UV for the next {durationOfExtremeUv > 0 ? `${durationOfExtremeUv} hours` : durationOfExtremeUv < 0 ? '12 hours' : 'hour'}
          </MantineAlert>
        )
      }
      setAlerts((prev) => {
        const prevUvAlertIndex = prev.findIndex(
          (alert) => alert.key === 'uvAlert'
        )

        if (prevUvAlertIndex !== -1) {
          const newAlerts = [...prev]
          newAlerts[prevUvAlertIndex] = uvAlert as ReactElement
          return newAlerts
        } else {
          return [...prev, uvAlert as ReactElement]
        }
      })
    } else {
      setAlerts((prev) => prev.filter(alert => alert.key !== 'uvAlert'))
    }
  }, [hoursOfExtremeUv])

  const motionProps = {
    initial: { scale: 1, opacity: 0 },
    exit: { scale: 0.95, opacity: 0 },
    className: styles.wrapper,
  }

  const tiles = () => (
    <AnimatePresence>
      {(alerts.map((alert, i: number) => (
        <motion.div
          {...motionProps}
          animate={{ scale: 1, opacity: 1, transition: { type: 'spring', duration: 2, delay: (i * .075) + 0.9 } }}
          key={`alert-${i}`}
        >
          {alert}
        </motion.div>
      )))}
    </AnimatePresence>
  )

  return (
    <>
      {tiles()}
    </>
  )
}

export default Alert
