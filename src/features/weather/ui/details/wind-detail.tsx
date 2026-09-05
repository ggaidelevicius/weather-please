import type { DetailViewProps } from './detail-data'
import { getDetailViewData } from './detail-data'
import { WIND_CHART_DEFAULT_MAX_KMH } from './constants'
import { Trans } from '@lingui/react/macro'
import { IconWind } from '@tabler/icons-react'
import {
	Metric,
	DetailViewShell,
	RelativeHourLabel,
} from '../details/detail-shell'
import { convertWind, formatDecimal, max } from '../../model/detail-formatting'
import {
	getChartScale,
	getScaleLabels,
	getPeakPoint,
} from '../../model/chart-geometry'
import { ChartFrame, LineChart } from '../charts/chart'

export const WindDetail = (props: Readonly<DetailViewProps>) => {
	const {
		data,
		isActive,
		activeSeriesId,
		setActiveSeriesId,
		usesMetricUnits,
		wind,
		windGust,
		times,
		windUnitLabel,
		startLabel,
		middleLabel,
		endLabel,
		referenceTime,
	} = getDetailViewData(props)

	const windDefaultMax = convertWind({
		usesMetricUnits,
		wind: WIND_CHART_DEFAULT_MAX_KMH,
	})
	const scale = getChartScale([...wind, ...windGust], {
		maxValue: Math.max(windDefaultMax, max([...wind, ...windGust])),
		minValue: 0,
	})
	const peakWind = getPeakPoint(wind)
	const peakGust = getPeakPoint(windGust)

	return (
		<DetailViewShell
			accentClassName="text-slate-200"
			icon={<IconWind aria-hidden size={22} />}
			isActive={isActive}
			kicker={<Trans>Next 24 hours</Trans>}
			metrics={
				<>
					<Metric
						accentClassName="text-orange-300"
						activeSeriesId={activeSeriesId}
						icon={<IconWind aria-hidden size={18} />}
						label={<Trans>Peak gust</Trans>}
						onSeriesFocus={setActiveSeriesId}
						seriesId="windGust"
						value={
							<Trans>
								{Math.round(peakGust.value)} {windUnitLabel} at{' '}
								<RelativeHourLabel
									referenceTime={referenceTime}
									time={data[peakGust.index]?.time}
								/>
							</Trans>
						}
					/>
					<Metric
						accentClassName="text-sky-300"
						activeSeriesId={activeSeriesId}
						icon={<IconWind aria-hidden size={18} />}
						label={<Trans>Peak wind</Trans>}
						onSeriesFocus={setActiveSeriesId}
						seriesId="wind"
						value={
							<Trans>
								{Math.round(peakWind.value)} {windUnitLabel} at{' '}
								<RelativeHourLabel
									referenceTime={referenceTime}
									time={data[peakWind.index]?.time}
								/>
							</Trans>
						}
					/>
				</>
			}
			title={<Trans>Wind</Trans>}
		>
			<ChartFrame
				endLabel={endLabel}
				leftLabels={getScaleLabels({ scale, unitLabel: windUnitLabel })}
				middleLabel={middleLabel}
				startLabel={startLabel}
			>
				<LineChart
					accentClassName="stroke-sky-300"
					activeSeriesId={activeSeriesId}
					onSeriesFocus={setActiveSeriesId}
					points={wind}
					primarySeriesId="wind"
					primarySeriesLabel={<Trans>Wind</Trans>}
					primaryValueFormatter={(value) =>
						`${formatDecimal(value)} ${windUnitLabel}`
					}
					scale={scale}
					secondaryAccentClassName="stroke-orange-300"
					secondaryPoints={windGust}
					secondarySeriesId="windGust"
					secondarySeriesLabel={<Trans>Gust</Trans>}
					secondaryValueFormatter={(value) =>
						`${formatDecimal(value)} ${windUnitLabel}`
					}
					times={times}
				/>
			</ChartFrame>
		</DetailViewShell>
	)
}
