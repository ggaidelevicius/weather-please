import type { ReactNode } from 'react'

import { render, screen } from '@testing-library/react'
import { expect, it, vi } from 'vitest'

import {
	TemperatureUnit,
	UnitSystem,
} from '../../../settings/model/unit-system'
import { mapWeatherResponseToNext24HoursData } from '../../api/weather-api'
import { createWeatherResponse } from '../../testing/weather-response'
import { AirQualityDetail } from '../details/air-quality-detail'

vi.mock('@lingui/react/macro', () => ({
	Trans: ({ children }: { children: ReactNode }) => children,
}))

it('marks missing current AQI unavailable while showing the measured future peak', () => {
	const data = mapWeatherResponseToNext24HoursData({
		currentTime: 0,
		data: createWeatherResponse(0),
	}).slice(0, 2)
	data[1].airQualityAqi = 85

	render(
		<AirQualityDetail
			activeSeriesId={null}
			data={data}
			isActive
			setActiveSeriesId={vi.fn()}
			temperatureUnit={TemperatureUnit.Celsius}
			unitSystem={UnitSystem.Metric}
			weatherMapData={null}
		/>,
	)

	expect(screen.getByText('Unavailable')).toBeInTheDocument()
	expect(screen.getByText(/85 at/)).toBeInTheDocument()
	expect(screen.queryByText('Good')).toBeNull()
})
