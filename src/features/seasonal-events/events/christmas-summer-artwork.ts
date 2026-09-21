export function createChristmasSummerSun(): HTMLCanvasElement {
	const canvas = document.createElement('canvas')
	canvas.width = 256
	canvas.height = 256
	const context = canvas.getContext('2d')
	if (!context) throw new Error('Unable to create Christmas sunshine')
	const glow = context.createRadialGradient(128, 128, 0, 128, 128, 128)
	glow.addColorStop(0, '#fffbd9')
	glow.addColorStop(0.13, '#fff4bdec')
	glow.addColorStop(0.19, '#ffdf8285')
	glow.addColorStop(0.45, '#ffc14d36')
	glow.addColorStop(1, '#ffb73900')
	context.fillStyle = glow
	context.fillRect(0, 0, 256, 256)
	return canvas
}
