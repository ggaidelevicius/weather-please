import { formatOptionalHour } from './detail-labels'
import type { DetailViewProps } from './detail-data'
import { getDetailViewData } from './detail-data'
import { UV_CHART_DEFAULT_MAX } from './constants'
import { Trans } from '@lingui/react/macro'
import {
	IconSun,
	IconUvIndex,
	IconSunrise,
	IconSunset,
} from '@tabler/icons-react'
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
import { ChartFrame, LineChart } from '../charts/chart'
import {
	formatDecimal,
	max,
	getNextSunEvent,
} from '../../model/detail-formatting'

export const SunDetail = (props: Readonly<DetailViewProps>) => {
	const {
		data,
		isActive,
		activeSeriesId,
		setActiveSeriesId,
		uv,
		times,
		startLabel,
		middleLabel,
		endLabel,
		referenceTime,
	} = getDetailViewData(props)

	const uvScale = getChartScale(uv, {
		maxValue: Math.max(UV_CHART_DEFAULT_MAX, max(uv)),
		minValue: 0,
	})
	const peakUv = getPeakPoint(uv)
	const nextSunrise = getNextSunEvent({
		data,
		referenceTime,
		type: 'sunrise',
	})
	const nextSunset = getNextSunEvent({
		data,
		referenceTime,
		type: 'sunset',
	})

	return (
		<DetailViewShell
			accentClassName="text-amber-200"
			icon={<IconSun aria-hidden size={22} />}
			isActive={isActive}
			kicker={<Trans>Next 24 hours</Trans>}
			metrics={
				<>
					<Metric
						accentClassName="text-amber-200"
						activeSeriesId={activeSeriesId}
						icon={<IconUvIndex aria-hidden size={18} />}
						label={<Trans>Peak UV</Trans>}
						onSeriesFocus={setActiveSeriesId}
						seriesId="uv"
						value={
							<Trans>
								{Math.round(peakUv.value)} at{' '}
								<RelativeHourLabel
									referenceTime={referenceTime}
									time={data[peakUv.index]?.time}
								/>
							</Trans>
						}
					/>
					<Metric
						activeSeriesId={activeSeriesId}
						icon={<IconSunrise aria-hidden size={18} />}
						label={<Trans>Next sunrise</Trans>}
						value={formatOptionalHour(nextSunrise)}
					/>
					<Metric
						activeSeriesId={activeSeriesId}
						icon={<IconSunset aria-hidden size={18} />}
						label={<Trans>Next sunset</Trans>}
						value={formatOptionalHour(nextSunset)}
					/>
				</>
			}
			title={<Trans>Sun</Trans>}
		>
			<ChartFrame
				endLabel={endLabel}
				leftLabels={getScaleLabels({ scale: uvScale, unitLabel: '' })}
				middleLabel={middleLabel}
				startLabel={startLabel}
			>
				<LineChart
					accentClassName="stroke-amber-200"
					activeSeriesId={activeSeriesId}
					onSeriesFocus={setActiveSeriesId}
					points={uv}
					primarySeriesId="uv"
					primarySeriesLabel={<Trans>UV</Trans>}
					primaryValueFormatter={formatDecimal}
					scale={uvScale}
					times={times}
				/>
			</ChartFrame>
		</DetailViewShell>
	)
}
