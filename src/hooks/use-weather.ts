import { useQuery } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'
import { z } from 'zod'
import { queryClient } from '../pages/_app'
import {
	processSimpleAlert,
	processPrecipitationAlert,
	processPrecipitationDuration,
	ALERT_CONDITIONS,
} from '../lib/alert-processor'

const dataSchema = z
	.array(
		z.object({
			day: z.number(),
			description: z.number(),
			max: z.number(),
			min: z.number(),
			rain: z.number(),
			uv: z.number(),
			wind: z.number(),
		}),
	)
	.min(1)
	.max(9)

type Data = z.infer<typeof dataSchema>

const alertSchema = z.object({
	hoursOfExtremeUv: z.array(z.boolean()).length(13),
	hoursOfLowVisibility: z.array(z.boolean()).length(25),
	hoursOfStrongWind: z.array(z.boolean()).length(25),
	hoursOfStrongWindGusts: z.array(z.boolean()).length(25),
	totalPrecipitation: z.object({
		duration: z.array(z.boolean()).length(25),
		precipitation: z.object({
			flag: z.boolean(),
			value: z.number(),
			zeroCount: z.number(),
		}),
	}),
})

export type Alerts = z.infer<typeof alertSchema>

interface WeatherData {
	latitude: number
	longitude: number
	generationtime_ms: number
	utc_offset_seconds: number
	timezone: string
	timezone_abbreviation: string
	elevation: number
	hourly_units: HourlyUnits
	hourly: HourlyData
	daily_units: DailyUnits
	daily: DailyData
}

interface HourlyUnits {
	time: string
	precipitation: string
	uv_index: string
	windspeed_10m: string
	visibility: string
	windgusts_10m: string
}

interface HourlyData {
	time: number[]
	precipitation: number[]
	uv_index: number[]
	windspeed_10m: number[]
	visibility: number[]
	windgusts_10m: number[]
}

interface DailyUnits {
	time: string
	weathercode: string
	temperature_2m_max: string
	temperature_2m_min: string
	uv_index_max: string
	precipitation_probability_max: string
	windspeed_10m_max: string
}

interface DailyData {
	time: number[]
	weathercode: number[]
	temperature_2m_max: number[]
	temperature_2m_min: number[]
	uv_index_max: number[]
	precipitation_probability_max: number[]
	windspeed_10m_max: number[]
}

const isLocalStorageDataValid = () => {
	const { data, lastUpdated, alerts } = localStorage
	if (!data || !lastUpdated || !alerts) return false

	try {
		const [year, month, day, hour] = lastUpdated.split('-').map(Number)
		const currentDate = new Date()
		const isSameYear = currentDate.getFullYear() === year
		const isSameMonth = currentDate.getMonth() === month
		const isSameDay = currentDate.getDate() === day
		const isSameHour = currentDate.getHours() === hour

		const parsedAlerts = JSON.parse(alerts)
		const parsedData = JSON.parse(data)

		const storedAlertsAreValid = alertSchema.safeParse(parsedAlerts)
		const storedDataIsValid = dataSchema.safeParse(parsedData)

		return (
			isSameYear &&
			isSameMonth &&
			isSameDay &&
			isSameHour &&
			storedAlertsAreValid.success &&
			storedDataIsValid.success
		)
	} catch {
		return false
	}
}

export const useWeather = (
	lat: string,
	lon: string,
	changedLocation: boolean,
) => {
	const [alertData, setAlertData] = useState<Alerts>({
		totalPrecipitation: {
			precipitation: {
				value: 0,
				flag: false,
				zeroCount: 0,
			},
			duration: Array(25).fill(false),
		},
		hoursOfExtremeUv: Array(13).fill(false),
		hoursOfStrongWind: Array(25).fill(false),
		hoursOfLowVisibility: Array(25).fill(false),
		hoursOfStrongWindGusts: Array(25).fill(false),
	})
	const [weatherData, setWeatherData] = useState<[] | Data>([])
	const [usingCachedData, setUsingCachedData] = useState(true)

	const lastHourRef = useRef(new Date().getHours())

	const { error, data } = useQuery<WeatherData>({
		queryKey: ['weather', lat, lon, usingCachedData],
		queryFn: () =>
			fetch(
				`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=weathercode,temperature_2m_max,temperature_2m_min,uv_index_max,precipitation_probability_max,windspeed_10m_max&timeformat=unixtime&timezone=auto&hourly=precipitation,uv_index,windspeed_10m,visibility,windgusts_10m&forecast_days=9`,
			).then((res) => res.json()),
		enabled: Boolean(lat) && Boolean(lon) && !usingCachedData,
	})

	useEffect(() => {
		if (data) {
			const now = new Date()
			const currentHour = now.getHours()

			const futureData = data.daily.time.map((day, i: number) => ({
				day,
				max: data.daily.temperature_2m_max[i],
				min: data.daily.temperature_2m_min[i],
				description: data.daily.weathercode[i],
				uv: data.daily.uv_index_max[i],
				wind: data.daily.windspeed_10m_max[i],
				rain: data.daily.precipitation_probability_max[i],
			}))
			setWeatherData(futureData)
			localStorage.data = JSON.stringify(futureData)

			const alerts = {
				totalPrecipitation: {
					precipitation: processPrecipitationAlert(
						data.hourly.precipitation.slice(currentHour, currentHour + 25),
					),
					duration: processPrecipitationDuration(
						data.hourly.precipitation.slice(currentHour, currentHour + 25),
					),
				},
				hoursOfExtremeUv: processSimpleAlert(
					data.hourly.uv_index.slice(currentHour, currentHour + 13),
					ALERT_CONDITIONS.extremeUv,
				),
				hoursOfStrongWind: processSimpleAlert(
					data.hourly.windspeed_10m.slice(currentHour, currentHour + 25),
					ALERT_CONDITIONS.strongWind,
				),
				hoursOfStrongWindGusts: processSimpleAlert(
					data.hourly.windgusts_10m.slice(currentHour, currentHour + 25),
					ALERT_CONDITIONS.strongWindGusts,
				),
				hoursOfLowVisibility: processSimpleAlert(
					data.hourly.visibility.slice(currentHour, currentHour + 25),
					ALERT_CONDITIONS.lowVisibility,
				),
			}
			setAlertData(alerts)
			localStorage.alerts = JSON.stringify(alerts)

			localStorage.lastUpdated = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}-${now.getHours()}`
		} else if (error) {
			console.error(error)
		}
	}, [data, error])

	useEffect(() => {
		const interval = setInterval(() => {
			const currentHour = new Date().getHours()
			if (currentHour !== lastHourRef.current) {
				lastHourRef.current = currentHour
				setUsingCachedData(false)
				queryClient.invalidateQueries({ queryKey: ['weather'] })
			}
		}, 6e4)

		return () => clearInterval(interval)
	}, [])

	useEffect(() => {
		if (changedLocation) {
			setUsingCachedData(false)
		} else if (isLocalStorageDataValid()) {
			setWeatherData(JSON.parse(localStorage.data))
			setAlertData(JSON.parse(localStorage.alerts))
		} else {
			setUsingCachedData(false)
		}
	}, [lat, lon, changedLocation])

	return {
		weatherData,
		alertData,
		isLoading: !Boolean(lat) || !Boolean(lon) || (!data && !usingCachedData),
		error,
	}
}
