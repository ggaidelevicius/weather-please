import type { Alerts } from '@/pages'

/**
 * Properties required for generating weather alerts.
 *
 * Extends `Alerts` to include preferences and conditions under which
 * alerts should be displayed to the user, as well as utility properties like UI width.
 *
 * @property {boolean} useMetric - Indicates if metric system should be used.
 * @property {boolean} showUvAlerts - Flag to indicate if UV alerts should be displayed.
 * @property {boolean} showWindAlerts - Flag to indicate if wind alerts should be displayed.
 * @property {boolean} showVisibilityAlerts - Flag to indicate if visibility alerts should be displayed.
 * @property {boolean} showPrecipitationAlerts - Flag to indicate if precipitation alerts should be displayed.
 * @property {number} width - Width of the alert UI component.
 */
export interface AlertProps extends Alerts {
	readonly useMetric: boolean
	readonly showUvAlerts: boolean
	readonly showWindAlerts: boolean
	readonly showVisibilityAlerts: boolean
	readonly showPrecipitationAlerts: boolean
	readonly width: number
}
