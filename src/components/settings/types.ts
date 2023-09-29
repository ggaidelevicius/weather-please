import type { ConfigProps, HandleChange, HandleClick } from '@/util/types'
import type { Dispatch, SetStateAction } from 'react'

/**
 * Represents geographical location details.
 *
 * The interface is designed to capture various levels of granularity in a location's description, from
 * smaller divisions like suburb and village up to broader ones like state and continent. Not all properties
 * may be available for every location, so they are marked as optional.
 *
 * @property {string} [suburb] - The specific suburb within a town or city.
 * @property {string} [cityDistrict] - A division within a larger city, often for administrative purposes.
 * @property {string} [borough] - A division within some cities, especially in larger metropolitan areas.
 * @property {string} [village] - A smaller settlement or rural locality.
 * @property {string} [town] - The town or urban locality.
 * @property {string} [city] - A large and permanent human settlement.
 * @property {string} [municipality] - An administrative division in certain countries.
 * @property {string} [district] - An area of a town or country.
 * @property {string} [stateDistrict] - A division within a state, often for administrative purposes.
 * @property {string} [county] - A division within a country, smaller than a state but larger than a city.
 * @property {string} [state] - The state, province, or similar sub-national division.
 * @property {string} [territory] - An area of land under the jurisdiction of a ruler or state.
 * @property {string} [subdivision] - A division of a larger area.
 * @property {string} [region] - A large area of land, possibly comprising several countries or states.
 * @property {string} [country] - The nation or sovereign state.
 * @property {string} [continent] - The world's main continuous expanses of land.
 */
export interface Location {
	suburb?: string
	cityDistrict?: string
	borough?: string
	village?: string
	town?: string
	city?: string
	municipality?: string
	district?: string
	stateDistrict?: string
	county?: string
	state?: string
	territory?: string
	subdivision?: string
	region?: string
	country?: string
	continent?: string
}

/**
 * Represents the properties required for the settings component.
 *
 * This interface defines the necessary properties to manage the configuration settings
 * and handle changes and actions related to those settings.
 *
 * @property {ConfigProps} input - The current input values for configuration settings.
 * @property {HandleChange} handleChange - Function to handle changes to the configuration settings.
 * @property {HandleClick} handleClick - Function to handle actions or button clicks related to the settings.
 * @property {ConfigProps} config - The current configuration settings.
 */
export interface SettingsProps {
	readonly input: ConfigProps
	readonly handleChange: HandleChange
	readonly handleClick: HandleClick
	readonly config: ConfigProps
	readonly setInput: Dispatch<SetStateAction<ConfigProps>>
	readonly usingSafari: boolean
	readonly reviewLink: string
}

/**
 * Handles the outside click events by comparing the `config` and `input` objects.
 *
 * The function compares the JSON string representations of `config` and `input`
 * to decide whether to open a modal or trigger a close function. The comparison
 * is done using JSON.stringify because JavaScript compares objects by reference,
 * not by structure.
 */
export type HandleOutsideClick = () => void
