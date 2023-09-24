import {
	BrokenClouds,
	ClearSky,
	FewClouds,
	LightDrizzle,
	LightRain,
	Mist,
	OvercastClouds,
	ShowerDrizzle,
	ShowerRain,
	Snow,
	Thunderstorm,
} from '@/assets/images'
import { Trans } from '@lingui/macro'
import { IconCloudRain, IconUvIndex, IconWind } from '@tabler/icons-react'
import type { StaticImageData } from 'next/image'
import Image from 'next/image'
import type { FC, ReactElement } from 'react'
import styles from './styles.module.css'
import type { BasicWeatherProps, WeatherDetailProps } from './types'

export const BasicWeather: FC<BasicWeatherProps> = (props) => {
	const { max, min, description, useMetric } = props

	return (
		<div className={styles.container}>
			<div className={styles.textContainer}>
				<div className={styles.temperatureContainer}>
					<div aria-hidden>
						{useMetric ? Math.round(max) : Math.round((max * 9) / 5 + 32)}
					</div>
					<span className="visuallyHidden">
						{useMetric && (
							<Trans>
								The maximum temperature will be {Math.round(max)} degrees
								celsius.
							</Trans>
						)}
						{!useMetric && (
							<Trans>
								The maximum temperature will be {Math.round((max * 9) / 5 + 32)}{' '}
								degrees fahrenheit.
							</Trans>
						)}
					</span>
					<div aria-hidden>
						{useMetric ? Math.round(min) : Math.round((min * 9) / 5 + 32)}
					</div>
					<span className="visuallyHidden">
						{useMetric && (
							<Trans>
								The minimum temperature will be {Math.round(min)} degrees
								celsius.
							</Trans>
						)}
						{!useMetric && (
							<Trans>
								The minimum temperature will be {Math.round((min * 9) / 5 + 32)}{' '}
								degrees fahrenheit.
							</Trans>
						)}
					</span>
				</div>
				<div aria-hidden>
					{descriptionMap[description as keyof typeof descriptionMap]}
				</div>
				<span className="visuallyHidden">
					<Trans>
						The expected type of weather is{' '}
						{descriptionMap[description as keyof typeof descriptionMap]}.
					</Trans>
				</span>
			</div>
			<Image
				quality={100}
				priority
				src={iconMap[description as keyof typeof iconMap]}
				alt=""
				className={styles.image}
				width={56}
				height={56}
			/>
		</div>
	)
}

export const WeatherDetail: FC<WeatherDetailProps> = (props) => {
	const { uv, wind, rain, useMetric } = props

	return (
		<div className={styles.detailContainer}>
			<div className={styles.detail}>
				<IconUvIndex size={18} aria-hidden />
				<span aria-hidden>{Math.round(uv)}</span>
				<span className="visuallyHidden">
					<Trans>The maximum UV index will be {Math.round(uv)}.</Trans>
				</span>
			</div>
			<div className={styles.detail}>
				<IconWind size={18} aria-hidden />
				<span aria-hidden>
					{useMetric && <Trans>{Math.round(wind)} km/h</Trans>}
					{!useMetric && <Trans>{Math.round(wind / 1.609344)} mph</Trans>}
				</span>
				<span className="visuallyHidden">
					{useMetric && (
						<Trans>
							The maximum wind speed will be {Math.round(wind)} kilometers per
							hour.
						</Trans>
					)}
					{!useMetric && (
						<Trans>
							The maximum wind speed will be {Math.round(wind / 1.609344)} miles
							per hour.
						</Trans>
					)}
				</span>
			</div>
			<div className={styles.detail}>
				<IconCloudRain size={18} aria-hidden />
				<span aria-hidden>{`${Math.round(rain)}%`}</span>
				<span className="visuallyHidden">
					<Trans>There is a {Math.round(rain)}% chance of precipitation.</Trans>
				</span>
			</div>
		</div>
	)
}

const descriptionMap: Record<string, ReactElement> = {
	'0': <Trans>clear sky</Trans>,
	'1': <Trans>mainly clear</Trans>,
	'2': <Trans>partly cloudy</Trans>,
	'3': <Trans>overcast</Trans>,
	'45': <Trans>mainly clear</Trans>, // though this should be fog, fog appears way too often and is not at all accurate
	'48': <Trans>depositing rime fog</Trans>,
	'51': <Trans>light drizzle</Trans>,
	'53': <Trans>moderate drizzle</Trans>,
	'55': <Trans>dense drizzle</Trans>,
	'56': <Trans>light freezing drizzle</Trans>,
	'57': <Trans>dense freezing drizzle</Trans>,
	'61': <Trans>slight rain</Trans>,
	'63': <Trans>moderate rain</Trans>,
	'65': <Trans>heavy rain</Trans>,
	'66': <Trans>light freezing rain</Trans>,
	'67': <Trans>heavy freezing rain</Trans>,
	'71': <Trans>slight snowfall</Trans>,
	'73': <Trans>moderate snowfall</Trans>,
	'75': <Trans>heavy snowfall</Trans>,
	'77': <Trans>snow grains</Trans>,
	'80': <Trans>slight rain showers</Trans>,
	'81': <Trans>moderate rain showers</Trans>,
	'82': <Trans>violent rain showers</Trans>,
	'85': <Trans>slight snow showers</Trans>,
	'86': <Trans>heavy snow showers</Trans>,
	'95': <Trans>thunderstorm</Trans>,
	'96': <Trans>thunderstorm with slight hail</Trans>,
	'99': <Trans>thunderstorm with heavy hail</Trans>,
}
const iconMap: Record<string, StaticImageData> = {
	'0': ClearSky,
	'1': FewClouds,
	'2': OvercastClouds,
	'3': BrokenClouds,
	'45': FewClouds, // though this should be fog/mist, fog appears way too often and is not at all accurate
	'48': Mist,
	'51': LightDrizzle,
	'53': ShowerDrizzle,
	'55': ShowerDrizzle,
	'56': ShowerDrizzle,
	'57': ShowerDrizzle,
	'61': LightRain,
	'63': ShowerRain,
	'65': ShowerRain,
	'66': LightRain,
	'67': ShowerRain,
	'71': Snow,
	'73': Snow,
	'75': Snow,
	'77': Snow,
	'80': ShowerRain,
	'81': ShowerRain,
	'82': ShowerRain,
	'85': Snow,
	'86': Snow,
	'95': Thunderstorm,
	'96': Thunderstorm,
	'99': Thunderstorm,
}
