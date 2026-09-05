export const WEATHER_MAP_BASE_HEIGHT = 260

export const WEATHER_MAP_FRAME_DURATION_MS = 4200

export const WEATHER_MAP_PARTICLE_DENSITY = 0.00011

export const WEATHER_MAP_PARTICLE_FRAME_MS = 1000 / 60

export const WEATHER_MAP_PARTICLE_MAX_FRAME_MULTIPLIER = 2

export const WEATHER_MAP_PARTICLE_TRAIL_ALPHA = 0.9

export const WEATHER_MAP_PRECIPITATION_FRAME_INTERVAL_MS = 66

export const WEATHER_MAP_PRECIPITATION_MESH_CELL_SIZE = 8

export const WEATHER_MAP_PRECIPITATION_MIN_VISIBLE = 0.08

export const WEATHER_MAP_TOOLTIP_FRAME_INTERVAL_MS = 66

export const WEATHER_MAP_RENDER_SCALE = 2

export const WEATHER_MAP_TILE_SIZE = 256

export const WEATHER_MAP_ZOOM = 9

export const WEATHER_MAP_PRECIPITATION_BANDS = [
	{ blue: 0, green: 0, label: '', precipitation: 0, red: 0 },
	{ blue: 255, green: 247, label: '0.1', precipitation: 0.1, red: 224 },
	{ blue: 246, green: 223, label: '0.5', precipitation: 0.5, red: 137 },
	{ blue: 222, green: 183, label: '1', precipitation: 1, red: 68 },
	{ blue: 169, green: 111, label: '2', precipitation: 2, red: 17 },
	{ blue: 91, green: 48, label: '5', precipitation: 5, red: 5 },
	{ blue: 24, green: 9, label: '10+', precipitation: 10, red: 2 },
]
