import type { Points, ShaderMaterial } from 'three'

import { Trans } from '@lingui/react/macro'
import { Canvas, useFrame } from '@react-three/fiber'
import { useEffect, useRef, useState } from 'react'
import { AdditiveBlending, Color } from 'three'

import {
	isSettingsModalOpen,
	onSettingsModalStateChange,
} from '../../../shared/lib/settings-modal-state'
import {
	type SeasonalEvent,
	type SeasonalEventContext,
	SeasonalEventId,
} from '../core/types'
import { getCanvasDpr, randomInRange } from '../core/utils'

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
const HOLI_RADIUS_RANGE = { max: 1.95, min: 0.2 }
const HOLI_JITTER_RANGE = { max: 0.08, min: 0.02 }
const HOLI_SCALE_RANGE = { max: 0.85, min: 0.35 }
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
const HOLI_MORPH_SPEED = 0.03
const HOLI_RING_CYCLE_SECONDS = 13.5
const HOLI_RING_WIDTH = 0.28
const HOLI_RING_MAX_RADIUS = 2.35
const HOLI_RING2_CYCLE_SECONDS = 20.0
const HOLI_RING2_WIDTH = 0.42
const HOLI_RING2_MAX_RADIUS = 2.35
const HOLI_COLOR_DRIFT_SPEED = 0.03
const HOLI_WARM_CORE = 'vec3(1.0, 0.96, 0.88)'
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
attribute vec3 aColor2;
attribute float aSeed;
attribute vec3 aLotus;
attribute vec3 aMandala;

uniform float uTime;
uniform float uSize;
uniform float uMorph;
uniform float uAttract;
uniform float uRingCycle;
uniform float uRingWidth;
uniform float uRingMaxRadius;
uniform float uRing2Cycle;
uniform float uRing2Width;
uniform float uRing2MaxRadius;

varying vec3 vColor;
varying float vAlpha;
varying float vRing;
varying float vRadialNorm;

void main() {
	float colorDrift = 0.5 + 0.5 * sin(uTime * ${HOLI_COLOR_DRIFT_SPEED} + aSeed * 6.2831);
	vColor = mix(aColor, aColor2, colorDrift);

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
	pos.x += sin(uTime * 0.14 + aSeed * 5.1) * 0.022
		+ sin(uTime * 0.09 + aSeed * 7.3) * 0.013;
	pos.y += cos(uTime * 0.16 + aSeed * 4.3) * 0.022
		+ cos(uTime * 0.07 + aSeed * 9.1) * 0.013;
	pos.z += sin(uTime * 0.12 + aSeed * 3.7) * 0.012
		+ sin(uTime * 0.06 + aSeed * 11.7) * 0.007;
	float radialDist = length(pos.xy);

	float ringPhase = fract(uTime / uRingCycle);
	float ringStartOffset = uRingWidth * 1.8;
	float ringTravel = uRingMaxRadius + ringStartOffset;
	float ringFront = -ringStartOffset + ringPhase * ringTravel;
	float ringCore = exp(-pow((radialDist - ringFront) / uRingWidth, 2.0));
	float ringTrail = exp(
		-pow((radialDist - ringFront) / (uRingWidth * 1.6), 2.0)
	);
	float ringBody = ringCore + ringTrail * 0.2;
	float ringEnv = smoothstep(0.0, 0.06, ringPhase)
		* (1.0 - smoothstep(0.90, 1.0, ringPhase));
	float ring1 = clamp(ringBody * ringEnv, 0.0, 1.0);

	float ring2Phase = fract(uTime / uRing2Cycle);
	float ring2StartOffset = uRing2Width * 1.8;
	float ring2Travel = uRing2MaxRadius + ring2StartOffset;
	float ring2Front = -ring2StartOffset + ring2Phase * ring2Travel;
	float ring2Core = exp(-pow((radialDist - ring2Front) / uRing2Width, 2.0));
	float ring2Trail = exp(
		-pow((radialDist - ring2Front) / (uRing2Width * 1.6), 2.0)
	);
	float ring2Body = ring2Core + ring2Trail * 0.2;
	float ring2Env = smoothstep(0.0, 0.06, ring2Phase)
		* (1.0 - smoothstep(0.90, 1.0, ring2Phase));
	float ring2 = clamp(ring2Body * ring2Env, 0.0, 1.0);

	vRing = clamp(ring1 + ring2 * 0.6, 0.0, 1.0);

	float radialNorm = clamp(
		radialDist / max(uRingMaxRadius, 0.001),
		0.0,
		1.0
	);
	vRadialNorm = radialNorm;
	float basePulse = 0.54 + 0.08 * sin(uTime * 0.24 + aSeed * 11.13);
	float pulse = clamp(basePulse + vRing * 0.28, 0.0, 1.0);

	vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
	gl_Position = projectionMatrix * mvPosition;
	gl_PointSize = uSize * aScale * pulse * (1.0 + vRing * 0.15) / -mvPosition.z;
	vAlpha = pulse * reveal;
}
`

const HOLI_FRAGMENT_SHADER = `
precision highp float;

varying vec3 vColor;
varying float vAlpha;
varying float vRing;
varying float vRadialNorm;

void main() {
	vec2 uv = gl_PointCoord - vec2(0.5);
	float dist = length(uv);
	float glow = exp(-dist * dist * 12.0);
	float core = exp(-dist * dist * 42.0);
	float ringBoost = smoothstep(0.0, 1.0, vRing);
	float alpha = glow * (0.74 + ringBoost * 0.18);
	vec3 color = min(vColor * 1.25, 1.0);
	vec3 luma = vec3(dot(color, vec3(0.2126, 0.7152, 0.0722)));
	float edgeDesat = smoothstep(0.4, 1.0, vRadialNorm);
	color = clamp(mix(luma, color, 1.35 - edgeDesat * 0.45), 0.0, 1.0);
	color = min(color * (1.0 + ringBoost * 0.14), 1.0);
	color = mix(color, ${HOLI_WARM_CORE}, core * (0.06 + ringBoost * 0.04));
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
			<Trans>Good to know</Trans>
		</h2>
		<p>
			<Trans>
				Within minutes of stepping outside, everyone looks the same — drenched
				head to toe in colour, impossible to tell apart.
			</Trans>
		</p>
		<p>
			<Trans>
				By midday, the streets, the walls, and every surface in sight are
				stained in layers of pink, green, yellow, and blue. It takes days to
				wash out.
			</Trans>
		</p>
	</>
)

export const holiEvent: SeasonalEvent = {
	details: EventDetails,
	id: SeasonalEventId.Holi,
	isActive: isHoli,
	run: launchHoliColors,
	tileAccent: {
		colors: ['#fbcfe8', '#bfdbfe', '#fde68a', '#bbf7d0', '#fbcfe8'],
	},
}

type HoliAttributes = {
	colors: Float32Array
	colors2: Float32Array
	lotusTargets: Float32Array
	mandalaTargets: Float32Array
	positions: Float32Array
	scales: Float32Array
	seeds: Float32Array
}

type HoliParticlesProps = Readonly<{
	isAnimated: boolean
}>

const createHoliAttributes = (): HoliAttributes => {
	const positions = new Float32Array(HOLI_PARTICLE_COUNT * 3)
	const colors = new Float32Array(HOLI_PARTICLE_COUNT * 3)
	const colors2 = new Float32Array(HOLI_PARTICLE_COUNT * 3)
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
			radius * Math.sin(phi) * Math.cos(theta) + (Math.random() - 0.5) * jitter
		positions[i3 + 1] =
			radius * Math.sin(phi) * Math.sin(theta) + (Math.random() - 0.5) * jitter
		positions[i3 + 2] = radius * Math.cos(phi) + (Math.random() - 0.5) * jitter

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
		const shade2 = palette[Math.floor(Math.random() * palette.length)]
		colors2[i3] = shade2.r
		colors2[i3 + 1] = shade2.g
		colors2[i3 + 2] = shade2.b
		seeds[i] = seed
		scales[i] = randomInRange(HOLI_SCALE_RANGE)
	}

	return {
		colors,
		colors2,
		lotusTargets,
		mandalaTargets,
		positions,
		scales,
		seeds,
	}
}

function isHoli({ date }: SeasonalEventContext) {
	const year = date.getFullYear()
	const month = String(date.getMonth() + 1).padStart(2, '0')
	const day = String(date.getDate()).padStart(2, '0')
	return HOLI_DATES.has(`${year}-${month}-${day}`)
}

const HoliParticles = ({ isAnimated }: HoliParticlesProps) => {
	const pointsRef = useRef<null | Points>(null)
	const materialRef = useRef<null | ShaderMaterial>(null)
	const [attributes] = useState(createHoliAttributes)

	useFrame(({ clock }) => {
		if (!isAnimated) return
		const material = materialRef.current
		const points = pointsRef.current
		if (!material || !points) return

		material.uniforms.uTime.value = clock.getElapsedTime()
		material.uniforms.uMorph.value =
			Math.sin(clock.getElapsedTime() * HOLI_MORPH_SPEED) * 0.5 + 0.5
		points.rotation.y = clock.getElapsedTime() * 0.00075
		points.rotation.x = clock.getElapsedTime() * 0.00055
	})

	const [uniforms] = useState(() => ({
		uAttract: { value: HOLI_SHAPE_ATTRACT },
		uMorph: { value: 0 },
		uRing2Cycle: { value: HOLI_RING2_CYCLE_SECONDS },
		uRing2MaxRadius: { value: HOLI_RING2_MAX_RADIUS },
		uRing2Width: { value: HOLI_RING2_WIDTH },
		uRingCycle: { value: HOLI_RING_CYCLE_SECONDS },
		uRingMaxRadius: { value: HOLI_RING_MAX_RADIUS },
		uRingWidth: { value: HOLI_RING_WIDTH },
		uSize: { value: HOLI_POINT_SIZE },
		uTime: { value: 0 },
	}))

	useEffect(() => {
		if (isAnimated) return
		if (materialRef.current) {
			materialRef.current.uniforms.uTime.value = HOLI_REVEAL_END_TIME
			materialRef.current.uniforms.uMorph.value = 0
		}
	}, [isAnimated])

	return (
		<points ref={pointsRef}>
			<bufferGeometry>
				<bufferAttribute
					args={[attributes.positions, 3]}
					attach="attributes-position"
				/>
				<bufferAttribute
					args={[attributes.colors, 3]}
					attach="attributes-aColor"
				/>
				<bufferAttribute
					args={[attributes.colors2, 3]}
					attach="attributes-aColor2"
				/>
				<bufferAttribute
					args={[attributes.scales, 1]}
					attach="attributes-aScale"
				/>
				<bufferAttribute
					args={[attributes.seeds, 1]}
					attach="attributes-aSeed"
				/>
				<bufferAttribute
					args={[attributes.lotusTargets, 3]}
					attach="attributes-aLotus"
				/>
				<bufferAttribute
					args={[attributes.mandalaTargets, 3]}
					attach="attributes-aMandala"
				/>
			</bufferGeometry>
			<shaderMaterial
				blending={AdditiveBlending}
				depthWrite={false}
				fragmentShader={HOLI_FRAGMENT_SHADER}
				ref={materialRef}
				transparent
				uniforms={uniforms}
				vertexShader={HOLI_VERTEX_SHADER}
			/>
		</points>
	)
}

type HoliCanvasSceneProps = Readonly<{
	dpr: number
	shouldAnimate: boolean
}>

const HoliCanvasScene = ({ dpr, shouldAnimate }: HoliCanvasSceneProps) => {
	const [isModalOpen, setIsModalOpen] = useState(
		() => shouldAnimate && isSettingsModalOpen(),
	)

	useEffect(() => {
		if (!shouldAnimate) {
			return
		}

		return onSettingsModalStateChange((isOpen) => {
			setIsModalOpen(isOpen)
		})
	}, [shouldAnimate])

	const isAnimated = shouldAnimate && !isModalOpen

	return (
		<Canvas
			camera={{ fov: 60, position: [0, 0, 2.5] }}
			dpr={dpr}
			frameloop={isAnimated ? 'always' : 'demand'}
			gl={{ alpha: true, antialias: true, powerPreference: 'low-power' }}
			style={{ inset: 0, pointerEvents: 'none', position: 'absolute' }}
		>
			<HoliParticles isAnimated={isAnimated} />
		</Canvas>
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

		let timeoutId: null | number = null
		let isMounted = false

		const { createRoot } = await import('react-dom/client')
		const root = createRoot(container)
		const dpr = getCanvasDpr({
			height: window.innerHeight,
			maxDpr: HOLI_CANVAS_MAX_DPR,
			width: window.innerWidth,
		})

		const mountScene = () => {
			if (isMounted) return
			isMounted = true
			document.body.appendChild(container)
			root.render(<HoliCanvasScene dpr={dpr} shouldAnimate={shouldAnimate} />)
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
