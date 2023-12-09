chrome.runtime.onInstalled.addListener(() => {
	chrome.storage.local.get(['installed']).then((res) => {
		if (!res?.installed) {
			chrome.storage.local.set({ installed: new Date().getTime() })
		}
	})
})

const setUninstallURL = async () => {
	const installed = await chrome.storage.local
		.get(['installed'])
		.then((res) => res?.installed ?? 0)
	await chrome.runtime.setUninstallURL(
		`https://weather-please.app/feedback?type=uninstall&installed=${installed}`,
		() => {
			if (chrome.runtime.lastError) {
				// eslint-disable-next-line no-console
				console.error('Error setting uninstall URL: ', chrome.runtime.lastError)
			} else {
				// eslint-disable-next-line no-console
				console.log('Uninstall URL set successfully')
			}
		},
	)
}

setUninstallURL()
