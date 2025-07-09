import { Initialisation } from '@/components/initialisation'
import { RingLoader } from '@/components/loader'
import { ReviewPrompt } from '@/components/review-prompt'
import { Settings } from '@/components/settings'
import { Tile } from '@/components/tile'
import { WeatherAlert } from '@/components/weather-alert'
import { useWeather } from '@/hooks/use-weather'
import { useConfig } from '@/hooks/use-config'
import { i18n } from '@lingui/core'
import { Trans } from '@lingui/react/macro'
import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { messages } from '../locales/en/messages'

i18n.load({
	en: messages,
})
i18n.activate('en')

const App = () => {
	const [changedLocation, setChangedLocation] = useState<boolean>(false)
	const currentDateRef = useRef(new Date().getDate())

	const { config, input, handleChange, updateConfig, setInput } = useConfig()
	const { weatherData, alertData, isLoading, error } = useWeather(
		config.lat,
		config.lon,
		changedLocation,
	)

	useEffect(() => {
		if (changedLocation) {
			setChangedLocation(false)
		}
	}, [changedLocation])

	useEffect(() => {
		if (error) {
			console.error('Weather fetch error:', error)
		}
	}, [error])

	/**
	 * Periodically (every minute) checks if the current date has changed.
	 * If it's a new day and the user has opted-in for periodic location updates,
	 * the user's geolocation is checked
	 *
	 * If the geolocation has changed from what's saved in "config", the "changedLocation" flag is set to true.
	 */
	useEffect(() => {
		const checkDate = setInterval(() => {
			if (new Date().getDate() !== currentDateRef.current) {
				currentDateRef.current = new Date().getDate()
			}
		}, 6e4)

		if (config.periodicLocationUpdate) {
			try {
				navigator.geolocation.getCurrentPosition((pos) => {
					if (
						config.lat !== pos.coords.latitude.toString() ||
						config.lon !== pos.coords.longitude.toString()
					) {
						setChangedLocation(true)
					}
					updateConfig({
						lat: pos.coords.latitude.toString(),
						lon: pos.coords.longitude.toString(),
					})
				})
			} catch (e) {
				console.error(e)
			}
		}
		return () => {
			clearInterval(checkDate)
		}
	}, [currentDateRef, config.periodicLocationUpdate])

	const tiles = weatherData
		.slice(0, parseInt(config.daysToRetrieve))
		.map((day, index) => {
			let delayBaseline = 0.75
			if (localStorage.data) {
				delayBaseline = 0
			}
			return (
				<Tile
					{...day}
					key={day.day}
					index={index}
					delayBaseline={delayBaseline}
					useMetric={config.useMetric}
					identifier={config.identifier}
				/>
			)
		})

	return (
		<>
			{config.showAlerts && (
				<AnimatePresence>
					<WeatherAlert
						{...alertData}
						useMetric={config.useMetric}
						showUvAlerts={config.showUvAlerts}
						showWindAlerts={config.showWindAlerts}
						showVisibilityAlerts={config.showVisibilityAlerts}
						showPrecipitationAlerts={config.showPrecipitationAlerts}
					/>
				</AnimatePresence>
			)}
			<ReviewPrompt config={config} setInput={setInput} />
			<AnimatePresence>
				<motion.main
					className={`relative grid min-h-[84px] min-w-[84px] grid-cols-1 gap-5 p-5 ${config.daysToRetrieve === '1' ? 'lg:grid-cols-1' : ''}${config.daysToRetrieve === '2' ? 'lg:grid-cols-2' : ''}${config.daysToRetrieve === '3' ? 'lg:grid-cols-3' : ''}${config.daysToRetrieve === '4' ? 'lg:grid-cols-4' : ''}${config.daysToRetrieve === '5' ? 'lg:grid-cols-5' : ''}${config.daysToRetrieve === '6' ? 'lg:grid-cols-3' : ''}${config.daysToRetrieve === '7' ? 'lg:grid-cols-3' : ''}${config.daysToRetrieve === '8' ? 'lg:grid-cols-4' : ''}${config.daysToRetrieve === '9' ? 'lg:grid-cols-3' : ''}`}
				>
					<Initialisation
						setInput={setInput}
						input={input}
						handleChange={handleChange}
						pending={!config?.lat || !config?.lon}
					/>
					{isLoading ? (
						<AnimatePresence>
							<RingLoader />
						</AnimatePresence>
					) : (
						<AnimatePresence>{tiles}</AnimatePresence>
					)}
				</motion.main>
			</AnimatePresence>

			<a
				href="https://open-meteo.com/"
				target="_blank"
				className="fixed bottom-4 left-4 text-xs text-dark-300 hover:underline focus:outline-2 focus:-outline-offset-2 focus:outline-blue-500"
			>
				<Trans>weather data provided by open-meteo</Trans>
			</a>

			<Settings handleChange={handleChange} input={input} />
		</>
	)
}

export default App
