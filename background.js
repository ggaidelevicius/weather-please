chrome.runtime.onInstalled.addListener(async () => {
	try {
		const res = await chrome.storage.local.get(['installed'])
		if (!res.installed) {
			await chrome.storage.local.set({ installed: Date.now() })
		}
	} catch (error) {
		// eslint-disable-next-line no-console
		console.error('Error during onInstalled listener:', error)
	}
})

const setUninstallURL = async () => {
	try {
		const res = await chrome.storage.local.get(['installed'])
		const installed = res.installed ?? 0
		await chrome.runtime.setUninstallURL(
			`https://weather-please.app/feedback?type=uninstall&installed=${installed}`,
		)
		// eslint-disable-next-line no-console
		console.log('Uninstall URL set successfully')
	} catch (error) {
		// eslint-disable-next-line no-console
		console.error('Error setting uninstall URL:', error)
	}
}

setUninstallURL()
