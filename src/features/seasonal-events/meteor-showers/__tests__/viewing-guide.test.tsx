import type { ReactNode } from 'react'

import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { getMeteorViewingGuide } from '../viewing'

import { SeasonalEventId } from '../../core/types'
import { MeteorViewingGuide } from '../viewing-guide'

const calculation = vi.hoisted(() => ({
	getGuide: vi.fn<typeof getMeteorViewingGuide>(),
	locale: 'en-AU',
}))

vi.mock('@lingui/react', () => ({
	useLingui: () => ({ i18n: { locale: calculation.locale } }),
}))

vi.mock('@lingui/react/macro', () => ({
	Trans: ({ children }: { children: ReactNode }) => children,
}))

vi.mock('../viewing', () => ({
	getMeteorViewingGuide: calculation.getGuide,
}))

const availableGuide = {
	status: 'available',
	timeZone: 'Australia/Perth',
	start: new Date('2026-12-14T15:00:00Z'),
	end: new Date('2026-12-14T17:00:00Z'),
	referenceTime: new Date('2026-12-14T16:00:00Z'),
	radiantAltitude: 42.3,
	radiantAzimuth: 72,
	moonIllumination: 0.42,
	moonVisibility: 'below',
	hasTwilight: false,
} satisfies ReturnType<typeof getMeteorViewingGuide>

const props = {
	eventId: SeasonalEventId.Geminids,
	date: new Date(2026, 11, 14),
	latitude: -31.95,
	longitude: 115.86,
}

beforeEach(() => {
	calculation.getGuide.mockReset()
	calculation.getGuide.mockReturnValue(availableGuide)
	calculation.locale = 'en-AU'
})

describe('MeteorViewingGuide', () => {
	it('shows the selected night and both local calendar dates across midnight', () => {
		const { container } = render(<MeteorViewingGuide {...props} />)

		expect(
			screen.getByRole('region', { name: 'Viewing from your location' }),
		).toBeInTheDocument()
		expect(calculation.getGuide).toHaveBeenCalledWith(props)
		expect(
			screen.getByText('Night of Monday, 14 December 2026'),
		).toBeInTheDocument()
		expect(
			screen.getByText('Times in Australian Western Standard Time'),
		).toBeInTheDocument()
		expect(container.querySelectorAll('time')).toHaveLength(2)
		expect(container.querySelector('time:first-of-type')).toHaveAttribute(
			'datetime',
			'2026-12-14T15:00:00.000Z',
		)
		expect(container.querySelector('time:first-of-type')).toHaveTextContent(
			'14 Dec 2026, 11:00 pm',
		)
		expect(container.querySelector('time:last-of-type')).toHaveAttribute(
			'datetime',
			'2026-12-14T17:00:00.000Z',
		)
		expect(container.querySelector('time:last-of-type')).toHaveTextContent(
			'15 Dec 2026, 1:00 am',
		)
		expect(screen.getByText('East')).toBeInTheDocument()
		expect(screen.getByText('42° above the horizon')).toBeInTheDocument()
		expect(screen.getByText('42% illuminated')).toBeInTheDocument()
		expect(
			screen.getByText(
				'Sky position and Moon illumination shown for 15 Dec 2026, 12:00 am.',
			),
		).toBeInTheDocument()
		expect(
			screen.getByText(/Meteors can cross any part of the sky/),
		).toHaveTextContent('look roughly halfway up, away from the Moon')
		expect(
			screen.getByText(/not a prediction of meteor activity/),
		).toHaveTextContent('or cloud cover')
	})

	it.each([
		['below', 'Below the horizon throughout this window.'],
		['above', 'Above the horizon throughout this window.'],
		['mixed', 'Above the horizon for part of this window.'],
	] as const)(
		'explains Moon visibility when it is %s',
		(moonVisibility, text) => {
			calculation.getGuide.mockReturnValue({
				...availableGuide,
				moonVisibility,
			})
			render(<MeteorViewingGuide {...props} />)

			expect(screen.getByText(text)).toBeInTheDocument()
		},
	)

	it('only mentions twilight when it overlaps the calculated window', () => {
		const { rerender } = render(<MeteorViewingGuide {...props} />)
		expect(screen.queryByText(/Twilight overlaps this window/)).toBeNull()

		calculation.getGuide.mockReturnValue({
			...availableGuide,
			hasTwilight: true,
		})
		rerender(<MeteorViewingGuide {...props} />)

		expect(
			screen.getByText(/Twilight overlaps this window/),
		).toBeInTheDocument()
	})

	it('keeps out-of-season previews honest without inventing a viewing night', () => {
		calculation.getGuide.mockReturnValue({ status: 'out-of-season' })
		render(<MeteorViewingGuide {...props} date={new Date(2026, 8, 21)} />)

		expect(
			screen.getByText(
				'Local viewing guidance appears near this shower’s usual peak.',
			),
		).toBeInTheDocument()
		expect(
			screen.getByText('Usual peak: around 14 December.'),
		).toBeInTheDocument()
		expect(screen.queryByText(/Night of/)).toBeNull()
		expect(screen.queryByText('Suggested viewing window')).toBeNull()
	})

	it.each([
		['unavailable', /Check that your selected weather location is correct/],
		['no-darkness', /The sky stays too bright/],
		['radiant-too-low', /radiant stays too low/],
		['no-window', /No useful local viewing window was found/],
	] as const)(
		'explains the %s state without showing a window',
		(status, text) => {
			calculation.getGuide.mockReturnValue({ status })
			render(<MeteorViewingGuide {...props} />)

			expect(screen.getByText(text)).toBeInTheDocument()
			expect(screen.queryByText('Suggested viewing window')).toBeNull()
		},
	)

	it('falls back gracefully if a calculation fails', () => {
		calculation.getGuide.mockImplementation(() => {
			throw new Error('Calculation failed')
		})
		render(<MeteorViewingGuide {...props} />)

		expect(
			screen.getByText(/Local viewing guidance isn’t available/),
		).toBeInTheDocument()
	})

	it('falls back gracefully if the returned time zone cannot be formatted', () => {
		calculation.getGuide.mockReturnValue({
			...availableGuide,
			timeZone: 'Invalid/Zone',
		})
		render(<MeteorViewingGuide {...props} />)

		expect(
			screen.getByText(/Local viewing guidance isn’t available/),
		).toBeInTheDocument()
	})

	it('formats dates, times and percentages using the active locale', () => {
		calculation.locale = 'de-DE'
		const { container } = render(<MeteorViewingGuide {...props} />)

		expect(
			screen.getByText('Night of Montag, 14. Dezember 2026'),
		).toBeInTheDocument()
		expect(container.querySelector('time:first-of-type')).toHaveTextContent(
			'14.12.2026, 23:00',
		)
		expect(screen.getByText(/42\s% illuminated/)).toBeInTheDocument()
	})

	it('does not calculate or render guidance for unrelated seasonal events', () => {
		const { container } = render(
			<MeteorViewingGuide {...props} eventId={SeasonalEventId.ChristmasDay} />,
		)

		expect(container).toBeEmptyDOMElement()
		expect(calculation.getGuide).not.toHaveBeenCalled()
	})
})
