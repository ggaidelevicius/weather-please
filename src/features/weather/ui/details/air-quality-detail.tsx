import { getAqiCategory } from './detail-labels'
import type { DetailViewProps } from './detail-data'
import { getDetailViewData } from './detail-data'
import { AIR_QUALITY_AQI_DEFAULT_MAX } from './constants'
import { Trans } from '@lingui/react/macro'
import { IconLungs, IconHaze } from '@tabler/icons-react'
import {
	Metric,
	DetailViewShell,
	RelativeHourLabel,
} from '../details/detail-shell'
import {
	getChartScale,
	getScaleLabels,
	getPeakPoint,
} from '../../model/chart-geometry'
import { ChartFrame, LineChart, EmptyChartState } from '../charts/chart'
import {
	max,
	isNumber,
	formatPollutantValue,
} from '../../model/detail-formatting'

export const AirQualityDetail = (props: Readonly<DetailViewProps>) => {
	const {
		data,
		isActive,
		activeSeriesId,
		setActiveSeriesId,
		times,
		airQualityAqi,
		airQualityPm25,
		airQualityPm10,
		airQualityOzone,
		airQualityNitrogenDioxide,
		startLabel,
		middleLabel,
		endLabel,
		referenceTime,
	} = getDetailViewData(props)

	const hasAirQualityData = airQualityAqi.some(isNumber)
	const airQualityAqiValues = airQualityAqi.map((value) => value ?? 0)
	const airQualityScale = getChartScale(airQualityAqiValues, {
		maxValue: Math.max(AIR_QUALITY_AQI_DEFAULT_MAX, max(airQualityAqiValues)),
		minValue: 0,
	})
	const currentAqi = airQualityAqi[0] ?? null
	const currentPm25 = airQualityPm25[0] ?? null
	const currentPm10 = airQualityPm10[0] ?? null
	const currentOzone = airQualityOzone[0] ?? null
	const currentNitrogenDioxide = airQualityNitrogenDioxide[0] ?? null
	const peakAqi = getPeakPoint(airQualityAqiValues)

	return (
		<DetailViewShell
			accentClassName="text-teal-200"
			footer={
				<Trans>
					AQI is measured on a scale of 0-500. Lower numbers mean cleaner air.
				</Trans>
			}
			icon={<IconLungs aria-hidden size={22} />}
			isActive={isActive}
			kicker={<Trans>Next 24 hours</Trans>}
			metrics={
				hasAirQualityData ? (
					<>
						<Metric
							accentClassName="text-teal-200"
							activeSeriesId={activeSeriesId}
							icon={<IconLungs aria-hidden size={18} />}
							label={<Trans>Current AQI</Trans>}
							onSeriesFocus={setActiveSeriesId}
							seriesId="airQualityAqi"
							value={
								<Trans>
									{Math.round(currentAqi ?? 0)} ·{' '}
									{getAqiCategory(currentAqi ?? 0)}
								</Trans>
							}
						/>
						<Metric
							accentClassName="text-teal-200"
							activeSeriesId={activeSeriesId}
							icon={<IconHaze aria-hidden size={18} />}
							label={<Trans>Peak AQI</Trans>}
							onSeriesFocus={setActiveSeriesId}
							seriesId="airQualityAqi"
							value={
								<Trans>
									{Math.round(peakAqi.value)} at{' '}
									<RelativeHourLabel
										referenceTime={referenceTime}
										time={data[peakAqi.index]?.time}
									/>
								</Trans>
							}
						/>
						<Metric
							activeSeriesId={activeSeriesId}
							icon={<IconHaze aria-hidden size={18} />}
							label={<Trans>PM2.5 now</Trans>}
							value={formatPollutantValue(currentPm25)}
						/>
						<Metric
							activeSeriesId={activeSeriesId}
							icon={<IconHaze aria-hidden size={18} />}
							label={<Trans>PM10 / ozone / NO₂</Trans>}
							value={`${formatPollutantValue(currentPm10)} · ${formatPollutantValue(currentOzone)} · ${formatPollutantValue(currentNitrogenDioxide)}`}
						/>
					</>
				) : (
					<Metric
						icon={<IconLungs aria-hidden size={18} />}
						label={<Trans>Air quality</Trans>}
						value={<Trans>Waiting for air quality data</Trans>}
					/>
				)
			}
			title={<Trans>Air quality</Trans>}
		>
			<ChartFrame
				endLabel={endLabel}
				leftLabels={getScaleLabels({
					scale: airQualityScale,
					unitLabel: '',
				})}
				middleLabel={middleLabel}
				startLabel={startLabel}
			>
				{hasAirQualityData ? (
					<LineChart
						accentClassName="stroke-teal-200"
						activeSeriesId={activeSeriesId}
						onSeriesFocus={setActiveSeriesId}
						points={airQualityAqiValues}
						primarySeriesId="airQualityAqi"
						primarySeriesLabel={<Trans>AQI</Trans>}
						primaryValueFormatter={(value) => (
							<Trans>
								{Math.round(value)} · {getAqiCategory(value)}
							</Trans>
						)}
						scale={airQualityScale}
						times={times}
					/>
				) : (
					<EmptyChartState label={<Trans>Air quality unavailable</Trans>} />
				)}
			</ChartFrame>
		</DetailViewShell>
	)
}
