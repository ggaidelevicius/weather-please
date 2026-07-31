import type { ShaderMaterial } from 'three'

import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useReducedMotion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'

export const HeroAtmosphere = () => {
	const shouldReduceMotion = useReducedMotion()
	const [isWebGLAvailable, setIsWebGLAvailable] = useState(false)
	const [isSurfaceVisible, setIsSurfaceVisible] = useState(false)

	useEffect(() => {
		setIsWebGLAvailable('WebGLRenderingContext' in window)

		const frameId = window.requestAnimationFrame(() => {
			setIsSurfaceVisible(true)
		})

		return () => window.cancelAnimationFrame(frameId)
	}, [])

	return (
		<div
			aria-hidden
			className="pointer-events-none absolute -inset-y-40 left-1/2 z-0 w-screen -translate-x-1/2"
			data-hero-atmosphere
		>
			<div
				className={`absolute inset-0 [mask-image:linear-gradient(to_bottom,transparent_0%,black_18%,black_70%,transparent_100%)] transition-opacity duration-1000 ease-out motion-reduce:transition-none ${
					isSurfaceVisible ? 'opacity-100' : 'opacity-0'
				}`}
			>
				<div className="absolute inset-y-0 left-0 w-2/5 bg-[radial-gradient(ellipse_at_left,rgba(167,139,250,0.12),transparent_72%)]" />
				<div className="absolute inset-y-0 right-0 w-2/5 bg-[radial-gradient(ellipse_at_right,rgba(103,232,249,0.1),transparent_72%)]" />
				<div className="absolute right-0 bottom-0 h-2/5 w-1/3 bg-[radial-gradient(ellipse_at_bottom_right,rgba(251,146,182,0.08),transparent_70%)]" />
				{isWebGLAvailable ? (
					<Canvas
						camera={{ fov: 42, position: [0, 0, 5.4] }}
						dpr={[1, 1.5]}
						frameloop={shouldReduceMotion ? 'demand' : 'always'}
						gl={{
							alpha: true,
							antialias: true,
							powerPreference: 'low-power',
						}}
						style={{ inset: 0, position: 'absolute' }}
					>
						<HeroGradientSurface isAnimated={!shouldReduceMotion} />
					</Canvas>
				) : null}
			</div>
		</div>
	)
}

type HeroGradientSurfaceProps = Readonly<{
	isAnimated: boolean
}>

const HeroGradientSurface = ({ isAnimated }: HeroGradientSurfaceProps) => {
	const materialRef = useRef<null | ShaderMaterial>(null)
	const viewport = useThree(({ viewport }) => viewport)
	const [uniforms] = useState(() => ({
		uTime: { value: STATIC_SURFACE_TIME },
	}))

	useFrame(({ clock }) => {
		const material = materialRef.current
		if (!isAnimated || !material) return

		material.uniforms.uTime.value = clock.getElapsedTime()
	})

	return (
		<mesh rotation={[-0.18, 0.04, -0.035]}>
			<planeGeometry
				args={[viewport.width * 1.16, viewport.height * 1.28, 128, 64]}
			/>
			<shaderMaterial
				depthWrite={false}
				fragmentShader={HERO_SURFACE_FRAGMENT_SHADER}
				ref={materialRef}
				transparent
				uniforms={uniforms}
				vertexShader={HERO_SURFACE_VERTEX_SHADER}
			/>
		</mesh>
	)
}

const STATIC_SURFACE_TIME = 4.2

const HERO_SURFACE_VERTEX_SHADER = `
uniform float uTime;

varying float vElevation;
varying vec2 vUv;

float hash(vec2 point) {
	return fract(sin(dot(point, vec2(127.1, 311.7))) * 43758.5453123);
}

float noise(vec2 point) {
	vec2 cell = floor(point);
	vec2 local = fract(point);
	vec2 eased = local * local * (3.0 - 2.0 * local);

	float bottomLeft = hash(cell);
	float bottomRight = hash(cell + vec2(1.0, 0.0));
	float topLeft = hash(cell + vec2(0.0, 1.0));
	float topRight = hash(cell + vec2(1.0, 1.0));

	return mix(
		mix(bottomLeft, bottomRight, eased.x),
		mix(topLeft, topRight, eased.x),
		eased.y
	);
}

void main() {
	vUv = uv;

	float topologyTime = uTime * 0.45;
	vec2 drift = vec2(topologyTime * 0.055, -topologyTime * 0.038);
	float broadField = noise(position.xy * 0.72 + drift);
	float detailField = noise(position.xy * 1.55 - drift * 0.7);
	float crossWave =
		sin(position.x * 1.55 + position.y * 0.72 + topologyTime * 0.22);
	float diagonalWave =
		cos(position.y * 2.05 - position.x * 0.38 - topologyTime * 0.17);

	float elevation =
		(broadField - 0.5) * 0.68 +
		(detailField - 0.5) * 0.16 +
		crossWave * 0.105 +
		diagonalWave * 0.075;

	vec3 transformed = position;
	transformed.z = elevation;

	vElevation = elevation;

	gl_Position = projectionMatrix * modelViewMatrix * vec4(transformed, 1.0);
}
`

const HERO_SURFACE_FRAGMENT_SHADER = `
uniform float uTime;

varying float vElevation;
varying vec2 vUv;

float softBlob(vec2 point, vec2 center, float radius) {
	return 1.0 - smoothstep(0.0, radius, distance(point, center));
}

void main() {
	vec3 charcoal = vec3(0.075, 0.079, 0.09);
	vec3 lavender = vec3(0.54, 0.42, 0.86);
	vec3 blush = vec3(0.95, 0.48, 0.68);
	vec3 peach = vec3(0.98, 0.7, 0.46);
	vec3 mint = vec3(0.4, 0.8, 0.68);
	vec3 cyan = vec3(0.3, 0.7, 0.84);

	vec2 lavenderCenter = vec2(
		0.34 + sin(uTime * 0.11) * 0.08,
		0.58 + cos(uTime * 0.09) * 0.07
	);
	vec2 peachCenter = vec2(
		0.72 + cos(uTime * 0.075) * 0.06,
		0.34 + sin(uTime * 0.085) * 0.08
	);
	vec2 cyanCenter = vec2(
		0.73 + sin(uTime * 0.065) * 0.07,
		0.75 + cos(uTime * 0.055) * 0.06
	);

	float lavenderField = softBlob(vUv, lavenderCenter, 0.74);
	float peachField = softBlob(vUv, peachCenter, 0.46);
	float cyanField = softBlob(vUv, cyanCenter, 0.52);
	float raised = smoothstep(-0.28, 0.34, vElevation);

	vec3 color = mix(charcoal, lavender, lavenderField * 0.48);
	color = mix(color, blush, raised * 0.23 + lavenderField * 0.045);
	color = mix(color, peach, peachField * 0.14);
	color = mix(color, mint, cyanField * 0.055);
	color = mix(
		color,
		cyan,
		cyanField * 0.13 * (1.0 - lavenderField)
	);

	float contourCoordinate = (vElevation + 0.52) * 11.0;
	float contourDistance = abs(fract(contourCoordinate) - 0.5);
	float contour = 1.0 - smoothstep(0.035, 0.09, contourDistance);
	color += contour * vec3(0.88, 0.82, 1.0) * 0.075;

	float distanceFromCenter = abs(vUv.x - 0.5) * 2.0;
	float peripheralFade = smoothstep(0.3, 0.9, distanceFromCenter);
	float verticalFade =
		1.0 - smoothstep(0.28, 0.48, abs(vUv.y - 0.5));
	float atmosphere = 0.055 + lavenderField * 0.18 + raised * 0.03;

	gl_FragColor = vec4(color, verticalFade * peripheralFade * atmosphere);
}
`
