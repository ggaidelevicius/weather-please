import type { DetailViewProps } from './detail-data'
import { getDetailViewData } from './detail-data'
import { PRECIPITATION_CHART_DEFAULT_MAX_MM } from './constants'
import { Trans } from '@lingui/react/macro'
import { IconCloudRain } from '@tabler/icons-react'
import {
	Metric,
	DetailViewShell,
	RelativeHourLabel,
	HourIntervalLabel,
} from '../details/detail-shell'
import {
	convertPrecipitation,
	formatPrecipitationValue,
	sum,
} from '../../model/detail-formatting'
import {
	getChartScale,
	getScaleLabels,
	getPeakPoint,
} from '../../model/chart-geometry'
import { ChartFrame, PrecipitationChart } from '../charts/chart'

export const PrecipitationDetail = (props: Readonly<DetailViewProps>) => {
	const {
		data,
		isActive,
		activeSeriesId,
		setActiveSeriesId,
		usesMetricUnits,
		precipitation,
		precipitationProbability,
		times,
		precipitationUnitLabel,
		startLabel,
		middleLabel,
		endLabel,
		referenceTime,
	} = getDetailViewData(props)

	const probabilityScale = { maxValue: 100, minValue: 0 }
	const peakProbability = getPeakPoint(precipitationProbability)
	const peakAmount = getPeakPoint(precipitation)
	const hasPrecipitationChance = peakProbability.value > 0
	const hasMeasurablePrecipitation = peakAmount.value > 0
	const precipitationDefaultMax = convertPrecipitation({
		precipitation: PRECIPITATION_CHART_DEFAULT_MAX_MM,
		usesMetricUnits,
	})
	const amountScale = getChartScale(precipitation, {
		maxValue: Math.max(precipitationDefaultMax, peakAmount.value),
		minValue: 0,
	})

	return (
		<DetailViewShell
			accentClassName="text-cyan-200"
			footer={<Trans>Precipitation includes rain and snow.</Trans>}
			icon={<IconCloudRain aria-hidden size={22} />}
			isActive={isActive}
			kicker={<Trans>Next 24 hours</Trans>}
			metrics={
				<>
					<Metric
						accentClassName="text-cyan-300"
						activeSeriesId={activeSeriesId}
						icon={<IconCloudRain aria-hidden size={18} />}
						label={<Trans>Total precipitation</Trans>}
						onSeriesFocus={setActiveSeriesId}
						seriesId="precipitationAmount"
						value={
							<Trans>
								{formatPrecipitationValue({
									precipitation: sum(precipitation),
									usesMetricUnits,
								})}
							</Trans>
						}
					/>
					<Metric
						accentClassName="text-sky-300"
						activeSeriesId={activeSeriesId}
						icon={<IconCloudRain aria-hidden size={18} />}
						label={
							hasPrecipitationChance ? (
								<Trans>Peak chance</Trans>
							) : (
								<Trans>Precipitation chance</Trans>
							)
						}
						onSeriesFocus={setActiveSeriesId}
						seriesId="precipitationProbability"
						value={
							hasPrecipitationChance ? (
								<Trans>
									{Math.round(peakProbability.value)}% at{' '}
									<RelativeHourLabel
										referenceTime={referenceTime}
										time={data[peakProbability.index]?.time}
									/>
								</Trans>
							) : (
								<Trans>No precipitation expected</Trans>
							)
						}
					/>
					<Metric
						accentClassName="text-cyan-300"
						activeSeriesId={activeSeriesId}
						icon={<IconCloudRain aria-hidden size={18} />}
						label={
							hasMeasurablePrecipitation ? (
								<Trans>Heaviest hour</Trans>
							) : (
								<Trans>Precipitation</Trans>
							)
						}
						onSeriesFocus={setActiveSeriesId}
						seriesId="precipitationAmount"
						value={
							hasMeasurablePrecipitation ? (
								<Trans>
									{formatPrecipitationValue({
										precipitation: peakAmount.value,
										usesMetricUnits,
									})}{' '}
									between{' '}
									<HourIntervalLabel
										index={peakAmount.index}
										referenceTime={referenceTime}
										times={times}
									/>
								</Trans>
							) : (
								<Trans>No measurable precipitation expected</Trans>
							)
						}
					/>
				</>
			}
			title={<Trans>Precipitation</Trans>}
		>
			<ChartFrame
				endLabel={endLabel}
				leftLabels={getScaleLabels({
					scale: amountScale,
					unitLabel: precipitationUnitLabel,
				})}
				middleLabel={middleLabel}
				rightLabels={getScaleLabels({
					scale: probabilityScale,
					unitLabel: '%',
				})}
				startLabel={startLabel}
			>
				<PrecipitationChart
					activeSeriesId={activeSeriesId}
					amountPoints={precipitation}
					amountScale={amountScale}
					amountValueFormatter={(value) =>
						formatPrecipitationValue({
							precipitation: value,
							usesMetricUnits,
						})
					}
					onSeriesFocus={setActiveSeriesId}
					probabilityPoints={precipitationProbability}
					times={times}
				/>
			</ChartFrame>
		</DetailViewShell>
	)
}
