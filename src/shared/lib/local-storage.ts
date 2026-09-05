// Persistence is optional: blocked storage and full quotas must not prevent
// the current tab from using data it already has in memory.
export const readLocalStorage = (key: string): null | string => {
	try {
		return typeof window === 'undefined'
			? null
			: window.localStorage.getItem(key)
	} catch {
		return null
	}
}

export const writeLocalStorage = ({
	key,
	value,
}: {
	key: string
	value: string
}): boolean => {
	try {
		if (typeof window === 'undefined') return false
		window.localStorage.setItem(key, value)
		return true
	} catch {
		return false
	}
}

export const removeLocalStorage = (key: string): boolean => {
	try {
		if (typeof window === 'undefined') return false
		window.localStorage.removeItem(key)
		return true
	} catch {
		return false
	}
}
