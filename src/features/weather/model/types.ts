import { z } from 'zod'

export const ALERT_HOURS_UV = 13 // 12 hours + current hour
export const ALERT_HOURS_GENERAL = 25 // 24 hours + current hour
export const NEXT_24_HOURS_FORECAST_HOURS = 25 // 24 hours + current hour
export const WEATHER_MAP_FORECAST_HOURS = 7 // 6 hours + current hour
export const WEATHER_MAP_GRID_SIZE = 7
export const WEATHER_FORECAST_DAYS = 9
export const AIR_QUALITY_FORECAST_DAYS = 7
export const CACHE_REFRESH_INTERVAL_MS = 60 * 1000
export const CACHE_REFRESH_DELAY_MINUTE = 1
export const CACHE_VALIDITY_MS = 60 * 60 * 1000

export const dataSchema = z
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
	.max(WEATHER_FORECAST_DAYS)

export type Data = z.infer<typeof dataSchema>

export const next24HoursDataSchema = z
	.array(
		z.object({
			apparentTemperature: z.number(),
			dewPoint: z.number().catch(0),
			humidity: z.number().catch(0),
			precipitation: z.number(),
			precipitationProbability: z.number(),
			shortwaveRadiation: z.number().catch(0),
			temperature: z.number(),
			time: z.number(),
			uv: z.number(),
			visibility: z.number(),
			weatherCode: z.number(),
			wind: z.number(),
			windGust: z.number(),
		}),
	)
	.max(NEXT_24_HOURS_FORECAST_HOURS)

export type Next24HoursData = z.infer<typeof next24HoursDataSchema>

export const weatherMapDataSchema = z.object({
	center: z.object({
		lat: z.number(),
		lon: z.number(),
	}),
	frames: z
		.array(
			z.object({
				points: z
					.array(
						z.object({
							lat: z.number(),
							lon: z.number(),
							precipitation: z.number(),
							precipitationProbability: z.number(),
							windDirection: z.number(),
							windSpeed: z.number(),
						}),
					)
					.max(WEATHER_MAP_GRID_SIZE * WEATHER_MAP_GRID_SIZE),
				time: z.number(),
			}),
		)
		.max(WEATHER_MAP_FORECAST_HOURS),
})

export type WeatherMapData = z.infer<typeof weatherMapDataSchema>

export const alertSchema = z.object({
	hoursOfExtremeUv: z.array(z.boolean()).length(ALERT_HOURS_UV),
	hoursOfLowVisibility: z.array(z.boolean()).length(ALERT_HOURS_GENERAL),
	hoursOfStrongWind: z.array(z.boolean()).length(ALERT_HOURS_GENERAL),
	hoursOfStrongWindGusts: z.array(z.boolean()).length(ALERT_HOURS_GENERAL),
	totalPrecipitation: z.object({
		duration: z.array(z.boolean()).length(ALERT_HOURS_GENERAL),
		precipitation: z.object({
			flag: z.boolean(),
			value: z.number(),
			zeroCount: z.number(),
		}),
	}),
})

export type Alerts = z.infer<typeof alertSchema>
