import type { ConfigProps, HandleChange, HandleClick } from '@/util/types'
import type { Dispatch, SetStateAction } from 'react'

/**
 * Represents geographical location details.
 *
 * The interface is designed to capture various levels of granularity in a location's description, from
 * smaller divisions like suburb and village up to broader ones like state and country. Not all properties
 * may be available for every location, so they are marked as optional.
 *
 * @property {string} [suburb] - The specific suburb within a town or city.
 * @property {string} [town] - The town or urban locality.
 * @property {string} [village] - A smaller settlement or rural locality.
 * @property {string} [country] - The nation or sovereign state.
 * @property {string} [state] - The state, province, or similar sub-national division.
 * @property {string} [county] - A division within a country, smaller than a state but larger than a city.
 */
export interface Location {
  suburb?: string;
  town?: string;
  village?: string;
  country?: string;
  state?: string;
  county?: string;
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
  readonly input: ConfigProps;
  readonly handleChange: HandleChange;
  readonly handleClick: HandleClick;
  readonly config: ConfigProps;
  readonly setInput: Dispatch<SetStateAction<ConfigProps>>;
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
