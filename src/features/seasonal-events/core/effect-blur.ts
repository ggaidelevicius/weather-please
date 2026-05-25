const SEASONAL_EVENT_DETAIL_BLUR_FILTER = 'blur(20px)'
const SEASONAL_EVENT_FILTER_TRANSITION_MS = 350
const SEASONAL_EVENT_FILTER_TRANSITION = 'filter 350ms ease'
const SEASONAL_EVENT_BASE_FILTER_ATTRIBUTE =
	'data-weather-please-seasonal-base-filter'
const SEASONAL_EVENT_BASE_TRANSITION_ATTRIBUTE =
	'data-weather-please-seasonal-base-transition'

const transitionRestoreTimeouts = new WeakMap<
	HTMLElement,
	ReturnType<typeof setTimeout>
>()

type ApplySeasonalEventEffectBlurParams = {
	shouldBlurEffects: boolean
}

export const applySeasonalEventEffectBlur = ({
	shouldBlurEffects,
}: Readonly<ApplySeasonalEventEffectBlurParams>) => {
	if (typeof document === 'undefined') {
		return
	}

	for (const element of getSeasonalEffectElements()) {
		const baseFilter = getBaseStyleValue({
			attributeName: SEASONAL_EVENT_BASE_FILTER_ATTRIBUTE,
			element,
			styleValue: element.style.filter,
		})
		const baseTransition = getBaseStyleValue({
			attributeName: SEASONAL_EVENT_BASE_TRANSITION_ATTRIBUTE,
			element,
			styleValue: element.style.transition,
		})

		clearTransitionRestore(element)
		element.style.transition = getBlurTransition(baseTransition)
		element.style.filter = shouldBlurEffects
			? getBlurredFilter(baseFilter)
			: baseFilter

		if (!shouldBlurEffects) {
			scheduleTransitionRestore({ baseTransition, element })
		}
	}
}

const getSeasonalEffectElements = () => {
	const elements = new Set<HTMLElement>()

	for (const element of Array.from(document.body.children)) {
		if (!(element instanceof HTMLElement)) {
			continue
		}
		if (!isSeasonalEffectRoot(element)) {
			continue
		}

		const canvases = getEffectCanvases(element)
		if (canvases.length > 0) {
			for (const canvas of canvases) {
				elements.add(canvas)
			}
			continue
		}

		elements.add(element)
	}

	return Array.from(elements)
}

const getEffectCanvases = (element: HTMLElement) => {
	const canvases: HTMLCanvasElement[] = []

	if (element instanceof HTMLCanvasElement) {
		canvases.push(element)
	}

	for (const canvas of Array.from(element.querySelectorAll('canvas'))) {
		if (canvas instanceof HTMLCanvasElement) {
			canvases.push(canvas)
		}
	}

	return canvases
}

const isSeasonalEffectRoot = (element: HTMLElement) => {
	const style = window.getComputedStyle(element)
	return style.position === 'fixed' && style.pointerEvents === 'none'
}

type GetBaseStyleValueParams = {
	attributeName: string
	element: HTMLElement
	styleValue: string
}

const getBaseStyleValue = ({
	attributeName,
	element,
	styleValue,
}: Readonly<GetBaseStyleValueParams>) => {
	const existingValue = element.getAttribute(attributeName)

	if (existingValue !== null) {
		return existingValue
	}

	element.setAttribute(attributeName, styleValue)
	return styleValue
}

const getBlurredFilter = (baseFilter: string) => {
	if (!baseFilter || baseFilter === 'none') {
		return SEASONAL_EVENT_DETAIL_BLUR_FILTER
	}

	return `${baseFilter} ${SEASONAL_EVENT_DETAIL_BLUR_FILTER}`
}

const getBlurTransition = (baseTransition: string) => {
	if (!baseTransition) {
		return SEASONAL_EVENT_FILTER_TRANSITION
	}
	if (baseTransition.includes('filter')) {
		return baseTransition
	}

	return `${baseTransition}, ${SEASONAL_EVENT_FILTER_TRANSITION}`
}

const clearTransitionRestore = (element: HTMLElement) => {
	const timeoutId = transitionRestoreTimeouts.get(element)

	if (!timeoutId) {
		return
	}

	clearTimeout(timeoutId)
	transitionRestoreTimeouts.delete(element)
}

type ScheduleTransitionRestoreParams = {
	baseTransition: string
	element: HTMLElement
}

const scheduleTransitionRestore = ({
	baseTransition,
	element,
}: Readonly<ScheduleTransitionRestoreParams>) => {
	const timeoutId = setTimeout(() => {
		element.style.transition = baseTransition
		transitionRestoreTimeouts.delete(element)
	}, SEASONAL_EVENT_FILTER_TRANSITION_MS)

	transitionRestoreTimeouts.set(element, timeoutId)
}
