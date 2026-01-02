import { useEffect, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { AdditiveBlending, Color } from 'three'
import type { Points, ShaderMaterial } from 'three'
import { randomInRange } from './utils'
import type { SeasonalEvent, SeasonalEventContext } from './types'
import { Trans } from '@lingui/react/macro'

const HOLI_DATES = new Set([
	'2026-03-04',
	'2027-03-22',
	'2028-03-11',
	'2029-03-01',
	'2030-03-20',
	'2031-03-09',
	'2032-03-27',
	'2033-03-16',
	'2034-03-05',
	'2035-03-24',
	'2036-03-12',
])
const HOLI_MOUNT_DELAY_MS = 900
const HOLI_CANVAS_OPACITY = '0.9'
const HOLI_CANVAS_FILTER = 'saturate(175%)'
const HOLI_CANVAS_MAX_DPR = 1.6
const HOLI_PARTICLE_COUNT = 11000
const HOLI_POINT_SIZE = 46
const HOLI_RADIUS_RANGE = { min: 0.2, max: 1.95 }
const HOLI_JITTER_RANGE = { min: 0.02, max: 0.08 }
const HOLI_SCALE_RANGE = { min: 0.35, max: 0.85 }
const HOLI_SHAPE_ATTRACT = 0.86
const HOLI_SHAPE_DEPTH = 0.22
const HOLI_LOTUS_SCALE = 1.35
const HOLI_MANDALA_SCALE = 1.85
const HOLI_LOTUS_PETALS = 7
const HOLI_MANDALA_SPOKES = 16
const HOLI_REVEAL_SPREAD = 3.6
const HOLI_REVEAL_MIN_DURATION = 0.55
const HOLI_REVEAL_MAX_DURATION = 1.35
const HOLI_REVEAL_END_TIME = HOLI_REVEAL_SPREAD + HOLI_REVEAL_MAX_DURATION + 0.6
const HOLI_MORPH_SPEED = 0.06
const HOLI_PALETTE = [
	'#ff5a1f',
	'#ff3b30',
	'#ffd60a',
	'#0a84ff',
	'#ff2d55',
	'#af52de',
	'#8b5a2b',
	'#1c1c1e',
]

const HOLI_VERTEX_SHADER = `
attribute float aScale;
attribute vec3 aColor;
attribute float aSeed;
attribute vec3 aLotus;
attribute vec3 aMandala;

uniform float uTime;
uniform float uSize;
uniform float uMorph;
uniform float uAttract;

varying vec3 vColor;
varying float vAlpha;

void main() {
	vColor = aColor;

	float pulse = 0.75 + 0.25 * sin(uTime * 0.6 + aSeed * 6.2831);
	float revealSeed = fract(
		sin(aSeed * 91.345 + aScale * 47.113) * 43758.5453
	);
	float durationSeed = fract(
		sin(aSeed * 17.873 + aScale * 97.31) * 15731.743
	);
	float revealStart = revealSeed * ${HOLI_REVEAL_SPREAD};
	float revealDuration = mix(
		${HOLI_REVEAL_MIN_DURATION},
		${HOLI_REVEAL_MAX_DURATION},
		durationSeed
	);
	float reveal = smoothstep(
		revealStart,
		revealStart + revealDuration,
		uTime
	);
	vec3 target = mix(aLotus, aMandala, uMorph);
	vec3 pos = mix(position, target, uAttract);
	pos.x += sin(uTime * 0.22 + aSeed * 5.1) * 0.04;
	pos.y += cos(uTime * 0.26 + aSeed * 4.3) * 0.04;
	pos.z += sin(uTime * 0.18 + aSeed * 3.7) * 0.02;

	vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
	gl_Position = projectionMatrix * mvPosition;
	gl_PointSize = uSize * aScale * pulse / -mvPosition.z;
	vAlpha = pulse * reveal;
}
`

const HOLI_FRAGMENT_SHADER = `
precision highp float;

varying vec3 vColor;
varying float vAlpha;

void main() {
	vec2 uv = gl_PointCoord - vec2(0.5);
	float dist = length(uv);
	float glow = exp(-dist * dist * 12.0);
	float core = exp(-dist * dist * 42.0);
	float alpha = glow;
	vec3 color = min(vColor * 1.25, 1.0);
	vec3 luma = vec3(dot(color, vec3(0.2126, 0.7152, 0.0722)));
	color = clamp(mix(luma, color, 1.35), 0.0, 1.0);
	color = mix(color, vec3(1.0), core * 0.08);
	gl_FragColor = vec4(color, alpha * vAlpha * 0.75);

	if (gl_FragColor.a < 0.003) discard;
}
`

const EventDetails = () => (
	<>
		<h2>
			<Trans>Overview</Trans>
		</h2>
		<p>
			<Trans>
				Holi is a joyful festival of colour, celebrated with laughter, music,
				and shared community.
			</Trans>
		</p>
		<p>
			<Trans>
				It is closely associated with the arrival of spring in much of the world
				where the tradition first formed.
			</Trans>
		</p>

		<h2>
			<Trans>History and meaning</Trans>
		</h2>
		<p>
			<Trans>
				Stories surrounding Holi vary by region, including the tale of Prahlad
				and Holika, which speaks to the triumph of devotion and good over harm.
			</Trans>
		</p>
		<p>
			<Trans>
				Another widely told story celebrates Krishna, whose playful exchanges of
				colour are said to have inspired the festival’s most famous custom.
			</Trans>
		</p>

		<h2>
			<Trans>Symbols and rituals</Trans>
		</h2>
		<p>
			<Trans>
				The night before Holi features Holika Dahan, a ceremonial bonfire that
				symbolises the passing of winter and the renewal of life.
			</Trans>
		</p>
		<p>
			<Trans>
				On the following day, coloured powders fill the air as people cross
				social boundaries in a shared expression of joy.
			</Trans>
		</p>

		<h2>
			<Trans>Little wonder</Trans>
		</h2>
		<p>
			<Trans>
				The colours draw everyone into the same bright moment, dissolving
				distance and difference.
			</Trans>
		</p>
		<p>
			<Trans>
				For a time, streets become living paintings and the air itself seems to
				celebrate.
			</Trans>
		</p>
	</>
)

export const holiEvent: SeasonalEvent = {
	id: 'holi',
	isActive: isHoli,
	run: launchHoliColors,
	details: EventDetails,
	tileAccent: {
		colors: ['#fbcfe8', '#bfdbfe', '#fde68a', '#bbf7d0', '#fbcfe8'],
	},
}

function isHoli({ date }: SeasonalEventContext) {
	const year = date.getFullYear()
	const month = String(date.getMonth() + 1).padStart(2, '0')
	const day = String(date.getDate()).padStart(2, '0')
	return HOLI_DATES.has(`${year}-${month}-${day}`)
}

type HoliAttributes = {
	positions: Float32Array
	colors: Float32Array
	scales: Float32Array
	seeds: Float32Array
	lotusTargets: Float32Array
	mandalaTargets: Float32Array
}

type HoliParticlesProps = Readonly<{
	isAnimated: boolean
}>

const HoliParticles = ({ isAnimated }: HoliParticlesProps) => {
	const pointsRef = useRef<Points | null>(null)
	const materialRef = useRef<ShaderMaterial | null>(null)
	const attributes = useRef<HoliAttributes | null>(null)

	if (!attributes.current) {
		const positions = new Float32Array(HOLI_PARTICLE_COUNT * 3)
		const colors = new Float32Array(HOLI_PARTICLE_COUNT * 3)
		const scales = new Float32Array(HOLI_PARTICLE_COUNT)
		const seeds = new Float32Array(HOLI_PARTICLE_COUNT)
		const lotusTargets = new Float32Array(HOLI_PARTICLE_COUNT * 3)
		const mandalaTargets = new Float32Array(HOLI_PARTICLE_COUNT * 3)
		const palette = HOLI_PALETTE.map((shade) => new Color(shade))

		for (let i = 0; i < HOLI_PARTICLE_COUNT; i += 1) {
			const i3 = i * 3
			const seed = Math.random()
			const theta = seed * Math.PI * 2
			const radial = Math.pow(Math.random(), 0.55)
			const depth = (Math.random() - 0.5) * HOLI_SHAPE_DEPTH
			const radiusRange = HOLI_RADIUS_RANGE.max - HOLI_RADIUS_RANGE.min
			const radius =
				Math.pow(Math.random(), 1.15) * radiusRange + HOLI_RADIUS_RANGE.min
			const phi = Math.acos(2 * Math.random() - 1)
			const jitter = randomInRange(HOLI_JITTER_RANGE)

			positions[i3] =
				radius * Math.sin(phi) * Math.cos(theta) +
				(Math.random() - 0.5) * jitter
			positions[i3 + 1] =
				radius * Math.sin(phi) * Math.sin(theta) +
				(Math.random() - 0.5) * jitter
			positions[i3 + 2] =
				radius * Math.cos(phi) + (Math.random() - 0.5) * jitter

			const lotusWave = Math.sin(theta * HOLI_LOTUS_PETALS) * 0.5 + 0.5
			const lotusRadius = HOLI_LOTUS_SCALE * radial * (0.55 + lotusWave * 0.5)
			lotusTargets[i3] = lotusRadius * Math.cos(theta)
			lotusTargets[i3 + 1] = lotusRadius * Math.sin(theta)
			lotusTargets[i3 + 2] = depth * 0.55

			const mandalaWave = Math.pow(
				Math.abs(Math.cos(theta * HOLI_MANDALA_SPOKES)),
				2.1,
			)
			const mandalaRadius =
				HOLI_MANDALA_SCALE * radial * (0.35 + mandalaWave * 0.95)
			mandalaTargets[i3] = mandalaRadius * Math.cos(theta)
			mandalaTargets[i3 + 1] = mandalaRadius * Math.sin(theta)
			mandalaTargets[i3 + 2] = depth * 1.1

			const shade = palette[Math.floor(Math.random() * palette.length)]
			colors[i3] = shade.r
			colors[i3 + 1] = shade.g
			colors[i3 + 2] = shade.b
			seeds[i] = seed
			scales[i] = randomInRange(HOLI_SCALE_RANGE)
		}

		attributes.current = {
			positions,
			colors,
			scales,
			seeds,
			lotusTargets,
			mandalaTargets,
		}
	}

	useFrame(({ clock }) => {
		if (!isAnimated) return
		const material = materialRef.current
		const points = pointsRef.current
		if (!material || !points) return

		material.uniforms.uTime.value = clock.getElapsedTime()
		material.uniforms.uMorph.value =
			Math.sin(clock.getElapsedTime() * HOLI_MORPH_SPEED) * 0.5 + 0.5
		points.rotation.y = clock.getElapsedTime() * 0.002
		points.rotation.x = clock.getElapsedTime() * 0.0015
	})

	const uniforms = useRef({
		uTime: { value: 0 },
		uSize: { value: HOLI_POINT_SIZE },
		uMorph: { value: 0 },
		uAttract: { value: HOLI_SHAPE_ATTRACT },
	})

	useEffect(() => {
		if (isAnimated) return
		if (materialRef.current) {
			materialRef.current.uniforms.uTime.value = HOLI_REVEAL_END_TIME
			materialRef.current.uniforms.uMorph.value = 0
		}
	}, [isAnimated])

	if (!attributes.current) {
		return null
	}

	return (
		<points ref={pointsRef}>
			<bufferGeometry>
				<bufferAttribute
					attach="attributes-position"
					args={[attributes.current.positions, 3]}
				/>
				<bufferAttribute
					attach="attributes-aColor"
					args={[attributes.current.colors, 3]}
				/>
				<bufferAttribute
					attach="attributes-aScale"
					args={[attributes.current.scales, 1]}
				/>
				<bufferAttribute
					attach="attributes-aSeed"
					args={[attributes.current.seeds, 1]}
				/>
				<bufferAttribute
					attach="attributes-aLotus"
					args={[attributes.current.lotusTargets, 3]}
				/>
				<bufferAttribute
					attach="attributes-aMandala"
					args={[attributes.current.mandalaTargets, 3]}
				/>
			</bufferGeometry>
			<shaderMaterial
				ref={materialRef}
				transparent
				depthWrite={false}
				blending={AdditiveBlending}
				uniforms={uniforms.current}
				vertexShader={HOLI_VERTEX_SHADER}
				fragmentShader={HOLI_FRAGMENT_SHADER}
			/>
		</points>
	)
}

async function launchHoliColors() {
	try {
		if (typeof window === 'undefined') {
			return () => {}
		}

		const shouldAnimate = !window.matchMedia('(prefers-reduced-motion: reduce)')
			.matches
		const container = document.createElement('div')
		container.style.position = 'fixed'
		container.style.inset = '0'
		container.style.pointerEvents = 'none'
		container.style.zIndex = '0'
		container.style.opacity = HOLI_CANVAS_OPACITY
		container.style.filter = HOLI_CANVAS_FILTER
		container.style.mixBlendMode = 'screen'

		let timeoutId: number | null = null
		let isMounted = false

		const { createRoot } = await import('react-dom/client')
		const root = createRoot(container)
		const dpr = Math.min(window.devicePixelRatio || 1, HOLI_CANVAS_MAX_DPR)

		const mountScene = () => {
			if (isMounted) return
			isMounted = true
			document.body.appendChild(container)
			root.render(
				<Canvas
					camera={{ position: [0, 0, 2.5], fov: 60 }}
					dpr={dpr}
					gl={{ antialias: true, alpha: true, powerPreference: 'low-power' }}
					frameloop={shouldAnimate ? 'always' : 'demand'}
					style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
				>
					<HoliParticles isAnimated={shouldAnimate} />
				</Canvas>,
			)
		}

		timeoutId = window.setTimeout(mountScene, HOLI_MOUNT_DELAY_MS)

		return () => {
			if (timeoutId !== null) {
				window.clearTimeout(timeoutId)
			}
			root.unmount()
			if (container.parentElement) {
				container.parentElement.removeChild(container)
			}
		}
	} catch (error) {
		console.error('Failed to launch Holi colors', error)
		return () => {}
	}
}
