export const SETTINGS_MODAL_STATE_EVENT =
	'weather-please:settings-modal-state-change'
export const SETTINGS_MODAL_OPEN_ATTRIBUTE = 'data-weather-please-settings-open'

type SettingsModalStateDetail = {
	isOpen: boolean
}

export const isSettingsModalOpen = () => {
	if (typeof document === 'undefined') {
		return false
	}

	return document.documentElement.hasAttribute(SETTINGS_MODAL_OPEN_ATTRIBUTE)
}

export const setSettingsModalOpenState = (isOpen: boolean) => {
	if (typeof document !== 'undefined') {
		document.documentElement.toggleAttribute(
			SETTINGS_MODAL_OPEN_ATTRIBUTE,
			isOpen,
		)
	}

	if (typeof window !== 'undefined') {
		window.dispatchEvent(
			new CustomEvent<SettingsModalStateDetail>(SETTINGS_MODAL_STATE_EVENT, {
				detail: { isOpen },
			}),
		)
	}
}

export const onSettingsModalStateChange = (
	listener: (isOpen: boolean) => void,
) => {
	if (typeof window === 'undefined') {
		return () => {}
	}

	const handler = (event: Event) => {
		const detail = (event as CustomEvent<SettingsModalStateDetail>).detail
		listener(Boolean(detail?.isOpen))
	}

	window.addEventListener(SETTINGS_MODAL_STATE_EVENT, handler)

	return () => {
		window.removeEventListener(SETTINGS_MODAL_STATE_EVENT, handler)
	}
}
