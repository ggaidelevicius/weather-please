import { Trans } from '@lingui/react/macro'
import { IconTemperature } from '@tabler/icons-react'

import type { DetailViewProps } from './detail-data'

import { getChartScale, getScaleLabels } from '../../model/chart-geometry'
import { formatDecimal } from '../../model/detail-formatting'
import { getTemperatureAccentColor } from '../../model/temperature-colour'
import { ChartFrame, LineChart } from '../charts/chart'
import {
	DetailViewShell,
	getFeelsLikeExplanation,
	Metric,
} from '../details/detail-shell'
import { getDetailViewData } from './detail-data'

export const TemperatureDetail = (props: Readonly<DetailViewProps>) => {
	const {
		apparentTemperatures,
		data,
		endLabel,
		isActive,
		middleLabel,
		startLabel,
		temperatures,
		temperatureUnitLabel,
		times,
	} = getDetailViewData(props)

	const scale = getChartScale(temperatures)
	const currentTemperature = temperatures[0] ?? 0
	const currentTemperatureCelsius = data[0]?.temperature ?? 0
	const temperatureAccentColor = getTemperatureAccentColor(
		currentTemperatureCelsius,
	)
	const currentApparentTemperature = apparentTemperatures[0] ?? 0
	const feelsLikeExplanation = getFeelsLikeExplanation(data[0] ?? {})

	return (
		<DetailViewShell
			accentClassName=""
			accentStyle={{ color: temperatureAccentColor }}
			footer={feelsLikeExplanation}
			icon={<IconTemperature aria-hidden size={22} />}
			isActive={isActive}
			kicker={<Trans>Next 24 hours</Trans>}
			metrics={
				<>
					<Metric
						accentStyle={{ color: temperatureAccentColor }}
						icon={<IconTemperature aria-hidden size={18} />}
						label={<Trans>Temperature now</Trans>}
						value={`${Math.round(currentTemperature)}${temperatureUnitLabel}`}
					/>
					<Metric
						icon={<IconTemperature aria-hidden size={18} />}
						label={<Trans>Feels like now</Trans>}
						value={`${Math.round(currentApparentTemperature)}${temperatureUnitLabel}`}
					/>
				</>
			}
			title={<Trans>Temperature</Trans>}
		>
			<ChartFrame
				endLabel={endLabel}
				leftLabels={getScaleLabels({
					scale,
					unitLabel: temperatureUnitLabel,
				})}
				middleLabel={middleLabel}
				startLabel={startLabel}
			>
				<LineChart
					accentClassName=""
					accentStyle={{ stroke: temperatureAccentColor }}
					points={temperatures}
					primarySeriesId="temperature"
					primarySeriesLabel={<Trans>Temperature</Trans>}
					primaryValueFormatter={(value) =>
						`${formatDecimal(value)}${temperatureUnitLabel}`
					}
					scale={scale}
					times={times}
				/>
			</ChartFrame>
		</DetailViewShell>
	)
}
