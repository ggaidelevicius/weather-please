export type WinterCrystal = {
	color: string
	size: number
	glow: number
}

type WinterCrystalArtwork = {
	glow: HTMLCanvasElement
	crystal: HTMLCanvasElement
	displaySize: number
}

export function createWinterCrystalArtwork({
	dpr,
	crystals,
}: {
	dpr: number
	crystals: readonly WinterCrystal[]
}): WinterCrystalArtwork[] {
	const pixelRatio = Math.min(2, dpr)
	return crystals.map(({ color, size, glow }) => {
		const glowRadius = size * 2.3
		const radius = Math.max(glowRadius, size + (glow / pixelRatio) * 3) + 2
		const displaySize = (Math.ceil(radius * pixelRatio) * 2) / pixelRatio
		const halo = createSpriteCanvas({ displaySize, pixelRatio })
		const cross = createSpriteCanvas({ displaySize, pixelRatio })
		const gradient = halo.context.createRadialGradient(
			0,
			0,
			0,
			0,
			0,
			glowRadius,
		)
		gradient.addColorStop(0, color)
		gradient.addColorStop(1, 'rgba(15, 23, 42, 0)')
		halo.context.fillStyle = gradient
		halo.context.beginPath()
		halo.context.arc(0, 0, glowRadius, 0, Math.PI * 2)
		halo.context.fill()

		cross.context.strokeStyle = color
		cross.context.lineWidth = Math.max(0.8, size * 0.12)
		cross.context.shadowColor = color
		// Canvas shadows use device pixels, matching the original scene renderer.
		cross.context.shadowBlur = glow
		cross.context.beginPath()
		cross.context.moveTo(-size, 0)
		cross.context.lineTo(size, 0)
		cross.context.moveTo(0, -size)
		cross.context.lineTo(0, size)
		cross.context.stroke()

		return {
			glow: halo.canvas,
			crystal: cross.canvas,
			displaySize,
		}
	})
}

function createSpriteCanvas({
	displaySize,
	pixelRatio,
}: {
	displaySize: number
	pixelRatio: number
}) {
	const canvas = document.createElement('canvas')
	canvas.width = Math.round(displaySize * pixelRatio)
	canvas.height = canvas.width
	const context = canvas.getContext('2d')
	if (!context) {
		throw new Error('Unable to create the winter crystal artwork canvas')
	}
	context.setTransform(
		pixelRatio,
		0,
		0,
		pixelRatio,
		canvas.width / 2,
		canvas.height / 2,
	)
	return { canvas, context }
}
