import { Trans } from '@lingui/react/macro'
import { IconEye } from '@tabler/icons-react'

import type { DetailViewProps } from './detail-data'

import {
	getChartScale,
	getLowPoint,
	getPeakPoint,
	getScaleLabels,
} from '../../model/chart-geometry'
import {
	convertVisibility,
	formatDecimal,
	max,
} from '../../model/detail-formatting'
import { ChartFrame, LineChart } from '../charts/chart'
import {
	DetailViewShell,
	Metric,
	RelativeHourLabel,
} from '../details/detail-shell'
import { VISIBILITY_CHART_DEFAULT_MAX_METERS } from './constants'
import { getDetailViewData } from './detail-data'

export const ConditionsDetail = (props: Readonly<DetailViewProps>) => {
	const {
		data,
		endLabel,
		isActive,
		middleLabel,
		referenceTime,
		startLabel,
		times,
		usesMetricUnits,
		visibility,
		visibilityUnitLabel,
	} = getDetailViewData(props)
	const visibilityDefaultMax = convertVisibility({
		usesMetricUnits,
		visibility: VISIBILITY_CHART_DEFAULT_MAX_METERS,
	})
	const visibilityScale = getChartScale(visibility, {
		maxValue: Math.max(visibilityDefaultMax, max(visibility)),
		minValue: 0,
	})
	const lowestVisibility = getLowPoint(visibility)
	const bestVisibility = getPeakPoint(visibility)

	return (
		<DetailViewShell
			accentClassName="text-emerald-200"
			icon={<IconEye aria-hidden size={22} />}
			isActive={isActive}
			kicker={<Trans>Next 24 hours</Trans>}
			metrics={
				<>
					<Metric
						accentClassName="text-emerald-300"
						icon={<IconEye aria-hidden size={18} />}
						label={<Trans>Lowest visibility</Trans>}
						value={
							<Trans>
								{formatDecimal(lowestVisibility.value)} {visibilityUnitLabel} at{' '}
								<RelativeHourLabel
									referenceTime={referenceTime}
									time={data[lowestVisibility.index]?.time}
								/>
							</Trans>
						}
					/>
					<Metric
						accentClassName="text-emerald-300"
						icon={<IconEye aria-hidden size={18} />}
						label={<Trans>Clearest hour</Trans>}
						value={
							<Trans>
								{formatDecimal(bestVisibility.value)} {visibilityUnitLabel} at{' '}
								<RelativeHourLabel
									referenceTime={referenceTime}
									time={data[bestVisibility.index]?.time}
								/>
							</Trans>
						}
					/>
				</>
			}
			title={<Trans>Conditions</Trans>}
		>
			<ChartFrame
				endLabel={endLabel}
				leftLabels={getScaleLabels({
					scale: visibilityScale,
					unitLabel: visibilityUnitLabel,
				})}
				middleLabel={middleLabel}
				startLabel={startLabel}
			>
				<LineChart
					accentClassName="stroke-emerald-300"
					points={visibility}
					primarySeriesId="visibility"
					primarySeriesLabel={<Trans>Visibility</Trans>}
					primaryValueFormatter={(value) =>
						`${formatDecimal(value)} ${visibilityUnitLabel}`
					}
					scale={visibilityScale}
					times={times}
				/>
			</ChartFrame>
		</DetailViewShell>
	)
}
