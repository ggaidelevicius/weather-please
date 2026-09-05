import type { DetailViewProps } from './detail-data'
import { getDetailViewData } from './detail-data'
import { getTemperatureAccentColor } from '../../model/temperature-colour'
import { IconTemperature } from '@tabler/icons-react'
import { Trans } from '@lingui/react/macro'
import {
	Metric,
	getFeelsLikeExplanation,
	DetailViewShell,
} from '../details/detail-shell'
import { getChartScale, getScaleLabels } from '../../model/chart-geometry'
import { ChartFrame, LineChart } from '../charts/chart'
import { formatDecimal } from '../../model/detail-formatting'

export const TemperatureDetail = (props: Readonly<DetailViewProps>) => {
	const {
		data,
		isActive,
		temperatures,
		apparentTemperatures,
		times,
		temperatureUnitLabel,
		startLabel,
		middleLabel,
		endLabel,
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
