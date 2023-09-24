import type { ConfigProps, HandleChange, HandleClick } from '@/util/types'
import type { Dispatch, SetStateAction } from 'react'

/**
 * Props for the initialization component or process.
 *
 * This interface details the properties necessary for managing the state and behavior
 * of the initial setup or configuration process of the application.
 *
 * @property {boolean} opened - Flag indicating if the initialization process is currently open or active.
 * @property {boolean} geolocationError - Indicates if there was an error while fetching geolocation data.
 * @property {HandleClick} handleClick - Callback function to handle user click interactions.
 * @property {Dispatch<SetStateAction<boolean>>} setLoading - Function to set the loading state.
 * @property {boolean} loading - Indicates if the initialization process is currently loading or processing data.
 * @property {ConfigProps} input - Contains configuration properties for the application's setup.
 * @property {HandleChange} handleChange - Callback function to handle changes to the configuration input.
 * @property {() => void} close - Function to close or end the initialization process.
 */
export interface InitialisationProps {
	readonly opened: boolean
	readonly geolocationError: boolean
	readonly handleClick: HandleClick
	readonly setLoading: Dispatch<SetStateAction<boolean>>
	readonly loading: boolean
	readonly input: ConfigProps
	readonly handleChange: HandleChange
	readonly close: () => void
}
