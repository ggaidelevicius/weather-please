const SEASONAL_EVENT_CANVAS_DETAIL_BLUR_FILTER = 'blur(20px)'
const SEASONAL_EVENT_CANVAS_FILTER_TRANSITION_MS = 350
const SEASONAL_EVENT_CANVAS_FILTER_TRANSITION = 'filter 350ms ease'
const SEASONAL_EVENT_BASE_FILTER_ATTRIBUTE =
	'data-weather-please-seasonal-base-filter'
const SEASONAL_EVENT_BASE_TRANSITION_ATTRIBUTE =
	'data-weather-please-seasonal-base-transition'

const transitionRestoreTimeouts = new WeakMap<
	HTMLCanvasElement,
	ReturnType<typeof setTimeout>
>()

type ApplySeasonalEventCanvasBlurParams = {
	shouldBlurEffects: boolean
}

export const applySeasonalEventCanvasBlur = ({
	shouldBlurEffects,
}: Readonly<ApplySeasonalEventCanvasBlurParams>) => {
	if (typeof document === 'undefined') {
		return
	}

	for (const canvas of getSeasonalEffectCanvases()) {
		const baseFilter = getBaseStyleValue({
			attributeName: SEASONAL_EVENT_BASE_FILTER_ATTRIBUTE,
			element: canvas,
			styleValue: canvas.style.filter,
		})
		const baseTransition = getBaseStyleValue({
			attributeName: SEASONAL_EVENT_BASE_TRANSITION_ATTRIBUTE,
			element: canvas,
			styleValue: canvas.style.transition,
		})

		clearTransitionRestore(canvas)
		canvas.style.transition = getBlurTransition(baseTransition)
		canvas.style.filter = shouldBlurEffects
			? getBlurredFilter(baseFilter)
			: baseFilter

		if (!shouldBlurEffects) {
			scheduleTransitionRestore({ baseTransition, canvas })
		}
	}
}

const getSeasonalEffectCanvases = () => {
	const canvases = new Set<HTMLCanvasElement>()

	for (const element of Array.from(document.body.children)) {
		if (!(element instanceof HTMLElement)) {
			continue
		}
		if (!isSeasonalEffectRoot(element)) {
			continue
		}
		if (element instanceof HTMLCanvasElement) {
			canvases.add(element)
		}
		for (const canvas of Array.from(element.querySelectorAll('canvas'))) {
			if (canvas instanceof HTMLCanvasElement) {
				canvases.add(canvas)
			}
		}
	}

	return Array.from(canvases)
}

const isSeasonalEffectRoot = (element: HTMLElement) =>
	element.style.position === 'fixed' && element.style.pointerEvents === 'none'

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
		return SEASONAL_EVENT_CANVAS_DETAIL_BLUR_FILTER
	}

	return `${baseFilter} ${SEASONAL_EVENT_CANVAS_DETAIL_BLUR_FILTER}`
}

const getBlurTransition = (baseTransition: string) => {
	if (!baseTransition) {
		return SEASONAL_EVENT_CANVAS_FILTER_TRANSITION
	}
	if (baseTransition.includes('filter')) {
		return baseTransition
	}

	return `${baseTransition}, ${SEASONAL_EVENT_CANVAS_FILTER_TRANSITION}`
}

const clearTransitionRestore = (canvas: HTMLCanvasElement) => {
	const timeoutId = transitionRestoreTimeouts.get(canvas)

	if (!timeoutId) {
		return
	}

	clearTimeout(timeoutId)
	transitionRestoreTimeouts.delete(canvas)
}

type ScheduleTransitionRestoreParams = {
	baseTransition: string
	canvas: HTMLCanvasElement
}

const scheduleTransitionRestore = ({
	baseTransition,
	canvas,
}: Readonly<ScheduleTransitionRestoreParams>) => {
	const timeoutId = setTimeout(() => {
		canvas.style.transition = baseTransition
		transitionRestoreTimeouts.delete(canvas)
	}, SEASONAL_EVENT_CANVAS_FILTER_TRANSITION_MS)

	transitionRestoreTimeouts.set(canvas, timeoutId)
}
