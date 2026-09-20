import {
	BufferAttribute,
	BufferGeometry,
	Color,
	NormalBlending,
	Points,
	ShaderMaterial,
} from 'three'

type HoliParticles = {
	points: Points<BufferGeometry, ShaderMaterial>
	geometry: BufferGeometry
	material: ShaderMaterial
}

export function createHoliParticles(): HoliParticles {
	const geometry = new BufferGeometry()
	const attributes = createAttributes()
	for (const [name, { values, size }] of Object.entries(attributes)) {
		geometry.setAttribute(name, new BufferAttribute(values, size))
	}
	geometry.setDrawRange(0, PARTICLE_COUNT)
	geometry.computeBoundingSphere()
	const material = new ShaderMaterial({
		blending: NormalBlending,
		depthTest: false,
		depthWrite: false,
		transparent: true,
		toneMapped: false,
		vertexShader: VERTEX_SHADER,
		fragmentShader: FRAGMENT_SHADER,
		uniforms: {
			uTime: { value: 0 },
			uMorph: { value: 0 },
			uReveal: { value: 0 },
			uDpr: { value: 1 },
			uCompact: { value: 0 },
		},
	})
	const points = new Points(geometry, material)
	points.frustumCulled = false
	return { points, geometry, material }
}

export function updateHoliParticles({
	particles,
	elapsed,
	hasRevealed,
	isCompact,
	dpr,
}: {
	particles: HoliParticles
	elapsed: number
	hasRevealed: boolean
	isCompact: boolean
	dpr: number
}): HoliParticles {
	const { uniforms } = particles.material
	uniforms.uTime.value = elapsed
	uniforms.uMorph.value = (1 - Math.cos(elapsed * 0.045)) / 2
	uniforms.uReveal.value = hasRevealed ? 1 : 0
	uniforms.uDpr.value = dpr
	uniforms.uCompact.value = isCompact ? 1 : 0
	particles.geometry.setDrawRange(0, isCompact ? 6500 : PARTICLE_COUNT)
	particles.points.rotation.z = Math.sin(elapsed * 0.018) * 0.065
	particles.points.rotation.x = Math.sin(elapsed * 0.023) * 0.035
	particles.points.rotation.y = Math.sin(elapsed * 0.019) * 0.045
	return particles
}

const PARTICLE_COUNT = 11000
const PALETTE = [
	'#ff3b93',
	'#ff7040',
	'#ffb52c',
	'#ffe34b',
	'#a9e53b',
	'#24d7bf',
	'#489dff',
	'#b968ff',
]

const VERTEX_SHADER = `
attribute vec3 aLotus;
attribute vec3 aMandala;
attribute vec3 aColor;
attribute vec3 aColor2;
attribute float aSeed;
attribute float aScale;
attribute float aPowder;

uniform float uTime;
uniform float uMorph;
uniform float uReveal;
uniform float uDpr;
uniform float uCompact;

varying vec3 vColor;
varying float vAlpha;
varying float vPowder;

void main() {
	float colorShift = 0.5 + 0.5 * sin(uTime * 0.027 + aSeed * 2.3);
	vColor = mix(aColor, aColor2, colorShift);
	vPowder = aPowder;
	float revealSeed = fract(sin(aSeed * 91.345 + aScale * 47.113) * 43758.5453);
	float durationSeed = fract(sin(aSeed * 17.873 + aScale * 97.31) * 15731.743);
	float revealStart = revealSeed * 2.9;
	float revealDuration = mix(0.7, 1.7, durationSeed);
	float reveal = max(uReveal, smoothstep(revealStart, revealStart + revealDuration, uTime));
	vec3 target = mix(aLotus, aMandala, uMorph);
	vec3 pos = mix(position, target, mix(0.92, 0.86, aPowder));
	float angle = atan(pos.y, pos.x);
	float drift = mix(0.011, 0.034, aPowder);
	pos.x += sin(uTime * 0.17 + angle * 1.7) * drift
		+ sin(uTime * 0.11 + aSeed * 7.1) * 0.008;
	pos.y += cos(uTime * 0.14 + angle * 1.9) * drift
		+ cos(uTime * 0.09 + aSeed * 5.3) * 0.008;
	pos.z += sin(uTime * 0.13 + angle) * 0.016;
	float radius = length(pos.xy);
	float ringPhase = fract(uTime / 16.0);
	float ringRadius = -0.4 + ringPhase * 2.5;
	float ring = exp(-pow((radius - ringRadius) / 0.25, 2.0))
		* smoothstep(0.0, 0.08, ringPhase)
		* (1.0 - smoothstep(0.88, 1.0, ringPhase));
	float quietCenter = mix(0.2, 1.0, smoothstep(0.18, 0.72, radius));
	float breathing = 0.9 + 0.06 * sin(uTime * 0.24 + angle * 2.0) + ring * 0.1;
	float grainSize = mix(2.8, 5.8, aScale);
	float coarseSize = mix(8.0, 16.0, aScale);
	float softSize = mix(19.0, 32.0, aScale);
	float powderSize = mix(38.0, 66.0, aScale);
	float size = mix(grainSize, coarseSize, clamp(aPowder * 3.0, 0.0, 1.0));
	size = mix(size, softSize, clamp(aPowder * 3.0 - 1.0, 0.0, 1.0));
	size = mix(size, powderSize, clamp(aPowder * 3.0 - 2.0, 0.0, 1.0));
	vec4 viewPosition = modelViewMatrix * vec4(pos, 1.0);
	gl_Position = projectionMatrix * viewPosition;
	gl_PointSize = size * uDpr * mix(1.0, 0.9, uCompact) * (2.5 / -viewPosition.z);
	vAlpha = reveal * quietCenter * breathing * mix(0.82, 0.22, aPowder)
		* mix(1.0, 1.16, uCompact);
}
`

const FRAGMENT_SHADER = `
precision highp float;

varying vec3 vColor;
varying float vAlpha;
varying float vPowder;

void main() {
	vec2 uv = gl_PointCoord * 2.0 - 1.0;
	float distanceSquared = dot(uv, uv);
	if (distanceSquared > 1.0) discard;
	float edge = 1.0 - smoothstep(0.65, 1.0, distanceSquared);
	float grain = exp(-distanceSquared * 2.8) * edge;
	float powder = exp(-distanceSquared * 4.6) * edge;
	float alpha = mix(grain, powder, vPowder) * vAlpha;
	if (alpha < 0.0015) discard;
	gl_FragColor = vec4(vColor, alpha);
	#include <colorspace_fragment>
}
`

function createAttributes(): Record<
	string,
	{ values: Float32Array; size: number }
> {
	const positions = new Float32Array(PARTICLE_COUNT * 3)
	const lotus = new Float32Array(PARTICLE_COUNT * 3)
	const mandala = new Float32Array(PARTICLE_COUNT * 3)
	const colors = new Float32Array(PARTICLE_COUNT * 3)
	const colors2 = new Float32Array(PARTICLE_COUNT * 3)
	const seeds = new Float32Array(PARTICLE_COUNT)
	const scales = new Float32Array(PARTICLE_COUNT)
	const powder = new Float32Array(PARTICLE_COUNT)
	const palette = PALETTE.map((color) => new Color(color))
	const shade = new Color()
	for (let index = 0; index < PARTICLE_COUNT; index += 1) {
		const offset = index * 3
		const tier = index % 40
		const softness = tier === 0 ? 1 : tier < 4 ? 2 / 3 : tier < 12 ? 1 / 3 : 0
		const angle = ((index * 0.61803398875) % 1) * Math.PI * 2
		const radial = 0.14 + Math.random() ** (0.4 + softness * 0.16) * 0.86
		const cosine = Math.cos(angle)
		const sine = Math.sin(angle)
		const depth = (Math.random() - 0.5) * (0.19 + softness * 0.13)
		const jitter = 0.025 + softness * 0.115
		const jitterX = (Math.random() - 0.5) * jitter
		const jitterY = (Math.random() - 0.5) * jitter
		const lotusWave = (0.5 + Math.cos(angle * 7) * 0.5) ** 0.72
		const lotusRadius = 1.42 * radial * (0.56 + lotusWave * 0.44)
		const mandalaWave = Math.abs(Math.cos(angle * 8)) ** 2.1
		const mandalaRadius = 1.58 * radial * (0.5 + mandalaWave * 0.5)
		const cloudRadius = radial * (1.64 + Math.random() * 0.18)
		positions[offset] = cosine * cloudRadius + jitterX
		positions[offset + 1] = sine * cloudRadius + jitterY
		positions[offset + 2] = depth
		lotus[offset] = cosine * lotusRadius + jitterX
		lotus[offset + 1] = sine * lotusRadius + jitterY
		lotus[offset + 2] = depth * 0.55
		mandala[offset] = cosine * mandalaRadius + jitterX
		mandala[offset + 1] = sine * mandalaRadius + jitterY
		mandala[offset + 2] = depth * 0.85
		const colorPosition = (angle / (Math.PI * 2)) * palette.length
		for (const [target, shift] of [
			[colors, 0],
			[colors2, 0.27],
		] as const) {
			const position = (colorPosition + shift) % palette.length
			const base = Math.floor(position)
			const blend = position - base
			shade
				.copy(palette[base])
				.lerp(
					palette[(base + 1) % palette.length],
					blend * blend * (3 - 2 * blend),
				)
			shade.toArray(target, offset)
		}
		seeds[index] = Math.random()
		scales[index] = Math.random()
		powder[index] = softness
	}
	return {
		position: { values: positions, size: 3 },
		aLotus: { values: lotus, size: 3 },
		aMandala: { values: mandala, size: 3 },
		aColor: { values: colors, size: 3 },
		aColor2: { values: colors2, size: 3 },
		aSeed: { values: seeds, size: 1 },
		aScale: { values: scales, size: 1 },
		aPowder: { values: powder, size: 1 },
	}
}
