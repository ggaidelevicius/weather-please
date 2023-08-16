import { Alert as MantineAlert } from '@mantine/core'
import { IconAlertTriangle, IconInfoCircle } from '@tabler/icons-react'
import { motion } from 'framer-motion'
import type { FC, ReactElement } from 'react'
import { useEffect, useState } from 'react'
import styles from './styles.module.css'
import type { AlertProps } from './types'

const Alert: FC<AlertProps> = (props: AlertProps) => {
  const {
    totalPrecipitation,
    hoursOfExtremeUv,
    hoursOfHighWind,
    hoursOfLowVisibility,
    useMetric,
    showUvAlerts,
    showWindAlerts,
    showVisibilityAlerts,
    showPrecipitationAlerts,
  } = props
  const [alerts, setAlerts] = useState<ReactElement[] | []>([])

  useEffect(() => {
    if (showPrecipitationAlerts) {
      let precipitationAlert: ReactElement | null = null
      if ((useMetric && totalPrecipitation >= 15) || (!useMetric && totalPrecipitation >= 0.590551)) {
        precipitationAlert = (
          <MantineAlert
            className={styles.alert}
            radius="md"
            styles={{ message: { fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' } }}
            key='precipitationAlert'
          >
            <IconInfoCircle size="2rem" strokeWidth={1.5} aria-hidden />
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
    } else {
      setAlerts((prev) => prev.filter(alert => alert.key !== 'precipitationAlert'))
    }

    return () => { }
  }, [useMetric, totalPrecipitation, showPrecipitationAlerts])

  useEffect(() => {
    if (showWindAlerts) {
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
              <IconInfoCircle size="2rem" strokeWidth={1.5} aria-hidden />
              High wind starting in {timeUntilHighWind} hours
            </MantineAlert>
          )
        } else {
          const durationOfHighWind = hoursOfHighWind.indexOf(false)
          windAlert = (
            <MantineAlert {...alertProps}>
              <IconInfoCircle size="2rem" strokeWidth={1.5} aria-hidden />
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
    } else {
      setAlerts((prev) => prev.filter(alert => alert.key !== 'windAlert'))
    }

    return () => { }
  }, [hoursOfHighWind, showWindAlerts])

  useEffect(() => {
    if (showUvAlerts) {
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
              <IconAlertTriangle size="2rem" strokeWidth={1.5} aria-hidden />
              Extreme UV starting in {timeUntilExtremeUv} hours
            </MantineAlert>
          )
        } else {
          const durationOfExtremeUv = hoursOfExtremeUv.indexOf(false)
          uvAlert = (
            <MantineAlert {...alertProps}>
              <IconAlertTriangle size="2rem" strokeWidth={1.5} aria-hidden />
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
    } else {
      setAlerts((prev) => prev.filter(alert => alert.key !== 'uvAlert'))
    }

    return () => { }
  }, [hoursOfExtremeUv, showUvAlerts])

  useEffect(() => {
    if (showVisibilityAlerts) {
      let visibilityAlert: ReactElement | null = null
      if (hoursOfLowVisibility.includes(true)) {
        const alertProps = {
          className: styles.alert,
          radius: 'md',
          styles: { message: { fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' } },
          key: 'visibilityAlert',
        }
        const timeUntilLowVisibility = hoursOfLowVisibility.indexOf(true) + 1
        if (timeUntilLowVisibility > 1) {
          visibilityAlert = (
            <MantineAlert {...alertProps} >
              <IconInfoCircle size="2rem" strokeWidth={1.5} aria-hidden />
              Low visibility starting in {timeUntilLowVisibility} hours
            </MantineAlert>
          )
        } else {
          const durationOfLowVisibility = hoursOfLowVisibility.indexOf(false)
          visibilityAlert = (
            <MantineAlert {...alertProps}>
              <IconInfoCircle size="2rem" strokeWidth={1.5} aria-hidden />
              Low visibility for the next {durationOfLowVisibility > 0 ? `${durationOfLowVisibility} hours` : durationOfLowVisibility < 0 ? '12 hours' : 'hour'}
            </MantineAlert>
          )
        }
        setAlerts((prev) => {
          const prevVisibilityAlertIndex = prev.findIndex(
            (alert) => alert.key === 'visibilityAlert'
          )

          if (prevVisibilityAlertIndex !== -1) {
            const newAlerts = [...prev]
            newAlerts[prevVisibilityAlertIndex] = visibilityAlert as ReactElement
            return newAlerts
          } else {
            return [...prev, visibilityAlert as ReactElement]
          }
        })
      } else {
        setAlerts((prev) => prev.filter(alert => alert.key !== 'visibilityAlert'))
      }
    } else {
      setAlerts((prev) => prev.filter(alert => alert.key !== 'visibilityAlert'))
    }

    return () => { }
  }, [hoursOfLowVisibility, showVisibilityAlerts])

  const tiles = () => (alerts.map((alert, i: number) => (
    <motion.div
      initial={{ scale: 1, opacity: 0 }}
      animate={{ scale: 1, opacity: 1, transition: { type: 'spring', duration: 2, delay: (i * .075) + 1.9 } }}
      exit={{ scale: 0.95, opacity: 0 }}
      className={styles.wrapper}
      key={`alert-${i}`}
      layout
    >
      {alert}
    </motion.div>
  ))
  )

  return (
    <>
      {tiles()}
    </>
  )
}

export default Alert
