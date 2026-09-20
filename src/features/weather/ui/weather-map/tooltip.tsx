import type {
	WeatherMapDimensions,
	WeatherMapPointerPoint,
	WeatherMapViewport,
	WeatherMapPointerWeather,
} from '../../model/detail-types'
import type { WeatherMapData } from '../../model/types'
import { useState, useEffect, useEffectEvent } from 'react'
import { Trans } from '@lingui/react/macro'
import { WEATHER_MAP_TOOLTIP_FRAME_INTERVAL_MS } from '../../model/weather-map/constants'
import {
	getInterpolatedWeatherMapWindPoints,
	getWeatherMapWindSpeedAtPoint,
} from '../../model/weather-map/wind'
import {
	getWeatherMapPrecipitationAtPoint,
	getInterpolatedWeatherMapPrecipitationPoints,
	formatWeatherMapTooltipPrecipitationDepth,
} from '../../model/weather-map/precipitation'
import {
	convertPrecipitation,
	convertWind,
} from '../../model/detail-formatting'

export const WeatherMapTooltip = ({
	dimensions,
	frames,
	isActive,
	playbackPosition,
	point,
	usesMetricUnits,
	viewport,
	windUnitLabel,
}: Readonly<{
	dimensions: WeatherMapDimensions
	frames: WeatherMapData['frames']
	isActive: boolean
	playbackPosition: number
	point: null | WeatherMapPointerPoint
	usesMetricUnits: boolean
	viewport: WeatherMapViewport
	windUnitLabel: string
}>) => {
	const [weather, setWeather] = useState<null | WeatherMapPointerWeather>(null)
	const pointX = point?.x ?? 0
	const pointY = point?.y ?? 0

	const getWeatherPoints = useEffectEvent(
		(animationViewport: WeatherMapViewport) => ({
			windPoints: getInterpolatedWeatherMapWindPoints({
				framePosition: playbackPosition,
				frames,
				viewport: animationViewport,
			}),
			precipitationPoints: getInterpolatedWeatherMapPrecipitationPoints({
				framePosition: playbackPosition,
				frames,
				viewport: animationViewport,
			}),
		}),
	)

	useEffect(() => {
		if (!isActive || !point) {
			return
		}

		const animationViewport = {
			centerX: viewport.centerX,
			centerY: viewport.centerY,
			dimensions,
		}
		let animationFrame = 0
		let lastDrawTime = 0

		const updateTooltip = (time: number) => {
			if (time - lastDrawTime >= WEATHER_MAP_TOOLTIP_FRAME_INTERVAL_MS) {
				lastDrawTime = time
				const { windPoints, precipitationPoints } =
					getWeatherPoints(animationViewport)
				const speed = getWeatherMapWindSpeedAtPoint({
					point,
					projectedPoints: windPoints,
				})
				const precipitation = getWeatherMapPrecipitationAtPoint({
					point,
					projectedPoints: precipitationPoints,
				})

				if (typeof speed === 'number' && precipitation) {
					setWeather({
						precipitation: convertPrecipitation({
							precipitation: precipitation.precipitation,
							usesMetricUnits,
						}),
						probability: precipitation.probability,
						windSpeed: convertWind({ usesMetricUnits, wind: speed }),
					})
				}
			}

			animationFrame = window.requestAnimationFrame(updateTooltip)
		}

		animationFrame = window.requestAnimationFrame(updateTooltip)

		return () => {
			window.cancelAnimationFrame(animationFrame)
		}
	}, [
		dimensions,
		isActive,
		point,
		usesMetricUnits,
		viewport.centerX,
		viewport.centerY,
	])

	if (!point || !weather) {
		return null
	}

	return (
		<div
			className="pointer-events-none absolute z-10 rounded-md border border-white/10 bg-dark-950/85 px-2.5 py-1.5 text-xs whitespace-nowrap text-white shadow-lg backdrop-blur-md"
			style={{
				left: `${(pointX / dimensions.width) * 100}%`,
				top: `${(pointY / dimensions.height) * 100}%`,
				transform: 'translate(0.75rem, calc(-100% - 0.75rem))',
			}}
		>
			<dl className="grid grid-cols-[auto_auto] gap-x-3 gap-y-1">
				<dt className="text-white/55">
					<Trans>Wind</Trans>
				</dt>
				<dd className="text-right font-semibold text-white">
					{Math.round(weather.windSpeed)} {windUnitLabel}
				</dd>
				<dt className="text-white/55">
					<Trans>Chance</Trans>
				</dt>
				<dd className="text-right font-semibold text-white">
					{Math.round(weather.probability)}%
				</dd>
				<dt className="text-white/55">
					<Trans>Depth</Trans>
				</dt>
				<dd className="text-right font-semibold text-white">
					{formatWeatherMapTooltipPrecipitationDepth({
						precipitation: weather.precipitation,
						usesMetricUnits,
					})}
				</dd>
			</dl>
		</div>
	)
}
