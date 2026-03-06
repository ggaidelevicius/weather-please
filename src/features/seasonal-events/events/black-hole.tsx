import { Trans } from '@lingui/react/macro'
import {
	Camera,
	ClampToEdgeWrapping,
	LinearFilter,
	Mesh,
	PlaneGeometry,
	RepeatWrapping,
	Scene,
	ShaderMaterial,
	TextureLoader,
	Vector2,
	Vector3,
	WebGLRenderer,
} from 'three'
import {
	SeasonalEventId,
	type SeasonalEvent,
	type SeasonalEventContext,
} from '../core/types'
import {
	isSettingsModalOpen,
	onSettingsModalStateChange,
} from '../../../shared/lib/settings-modal-state'
import milkywayData from '../assets/milkyway.jpg'
import accretionDiskData from '../assets/accretion_disk.png'
import starNoiseData from '../assets/star_noise.png'

const EVENT_HORIZON_DAY_DATES = new Set([
	'2026-04-10',
	'2027-04-10',
	'2028-04-10',
	'2029-04-10',
	'2030-04-10',
	'2031-04-10',
	'2032-04-10',
	'2033-04-10',
	'2034-04-10',
	'2035-04-10',
	'2036-04-10',
])
const BLACK_HOLE_MOUNT_DELAY_MS = 900
const BLACK_HOLE_CANVAS_MAX_DPR = 1.2
const BLACK_HOLE_CANVAS_OPACITY = '0.94'
const BLACK_HOLE_CANVAS_FILTER = 'saturate(115%) contrast(105%)'
// Accretion disk rotation speed multiplier (1.0 = shader default)
const DISK_ROTATION_SPEED = 0.05

const BLACK_HOLE_VERTEX_SHADER = `
void main() {
	gl_Position = vec4(position, 1.0);
}
`

// Schwarzschild geodesic ray tracer with flat accretion disk.
// Ported from https://github.com/vlwkaos/threejs-blackhole (MIT license).
const BLACK_HOLE_FRAGMENT_SHADER = `
#define STEP 0.05
#define NSTEPS 600

#define PI 3.141592653589793238462643383279
#define DEG_TO_RAD (PI/180.0)

uniform float time;
uniform vec2 resolution;

uniform vec3 cam_pos;
uniform vec3 cam_dir;
uniform vec3 cam_up;
uniform float fov;
uniform vec3 cam_vel;

const float MIN_TEMPERATURE = 1000.0;
const float TEMPERATURE_RANGE = 39000.0;

const float DISK_IN = 2.0;
const float DISK_WIDTH = 4.0;

uniform sampler2D bg_texture;
uniform sampler2D star_texture;
uniform sampler2D disk_texture;

vec2 square_frame(vec2 screen_size) {
	return 2.0 * (gl_FragCoord.xy / screen_size.xy) - 1.0;
}

vec2 to_spherical(vec3 cartesian_coord) {
	vec2 uv = vec2(atan(cartesian_coord.z, cartesian_coord.x), asin(cartesian_coord.y));
	uv *= vec2(1.0 / (2.0 * PI), 1.0 / PI);
	uv += 0.5;
	return uv;
}

vec3 temp_to_color(float temp_kelvin) {
	vec3 color;
	temp_kelvin = clamp(temp_kelvin, 1000.0, 40000.0) / 100.0;
	if (temp_kelvin <= 66.0) {
		color.r = 255.0;
		color.g = 99.4708025861 * log(temp_kelvin) - 161.1195681661;
		if (color.g < 0.0) color.g = 0.0;
		if (color.g > 255.0) color.g = 255.0;
	} else {
		color.r = 329.698727446 * pow(temp_kelvin - 60.0, -0.1332047592);
		if (color.r < 0.0) color.r = 0.0;
		if (color.r > 255.0) color.r = 255.0;
		color.g = 288.1221695283 * pow(temp_kelvin - 60.0, -0.0755148492);
		if (color.g > 255.0) color.g = 255.0;
	}
	if (temp_kelvin >= 66.0) {
		color.b = 255.0;
	} else if (temp_kelvin <= 19.0) {
		color.b = 0.0;
	} else {
		color.b = 138.5177312231 * log(temp_kelvin - 10.0) - 305.0447927307;
		if (color.b < 0.0) color.b = 0.0;
		if (color.b > 255.0) color.b = 255.0;
	}
	color /= 255.0;
	return color;
}

void main() {
	float uvfov = tan(fov / 2.0 * DEG_TO_RAD);
	vec2 uv = square_frame(resolution);
	uv *= vec2(resolution.x / resolution.y, 1.0);

	vec3 forward = normalize(cam_dir);
	vec3 up = normalize(cam_up);
	vec3 nright = normalize(cross(forward, up));
	up = cross(nright, forward);

	vec3 pixel_pos = cam_pos + forward + nright * uv.x * uvfov + up * uv.y * uvfov;
	vec3 ray_dir = normalize(pixel_pos - cam_pos);

	vec4 color = vec4(0.0, 0.0, 0.0, 1.0);

	vec3 point = cam_pos;
	vec3 velocity = ray_dir;
	vec3 c = cross(point, velocity);
	float h2 = dot(c, c);

	vec3 oldpoint;
	float distance = length(point);

	for (int i = 0; i < NSTEPS; i++) {
		oldpoint = point;
		point += velocity * STEP;
		vec3 accel = -1.5 * h2 * point / pow(dot(point, point), 2.5);
		velocity += accel * STEP;
		distance = length(point);

		bool horizon_mask = distance < 1.0 && length(oldpoint) > 1.0;
		if (horizon_mask) {
			color += vec4(0.0, 0.0, 0.0, 1.0);
			break;
		}

		if (oldpoint.y * point.y < 0.0) {
			float lambda = -oldpoint.y / velocity.y;
			vec3 intersection = oldpoint + lambda * velocity;
			float r = length(intersection);

			if (DISK_IN <= r && r <= DISK_IN + DISK_WIDTH) {
				float phi = atan(intersection.x, intersection.z);

				vec3 disk_velocity = vec3(-intersection.x, 0.0, intersection.z)
					/ sqrt(2.0 * max(r - 1.0, 0.001)) / (r * r);

				phi -= time;
				phi = mod(phi, PI * 2.0);

				float disk_gamma = 1.0 / sqrt(max(1.0 - dot(disk_velocity, disk_velocity), 0.001));
				float disk_doppler_factor = disk_gamma * (1.0 + dot(ray_dir / distance, disk_velocity));

				vec2 tex_coord = vec2(mod(phi, 2.0 * PI) / (2.0 * PI), 1.0 - (r - DISK_IN) / DISK_WIDTH);
				vec4 disk_color = texture2D(disk_texture, tex_coord) / disk_doppler_factor;
				float disk_alpha = clamp(dot(disk_color, disk_color) / 4.5, 0.0, 1.0);
				disk_alpha /= pow(max(disk_doppler_factor, 0.15), 3.0);
				// Soft fade at inner and outer radial edges to avoid hard borders.
				float t = (r - DISK_IN) / DISK_WIDTH;
				disk_alpha *= smoothstep(0.0, 0.08, t) * smoothstep(1.0, 0.75, t);
				color += vec4(disk_color) * disk_alpha;
			}
		}
	}

	if (distance > 1.0) {
		ray_dir = normalize(point - oldpoint);
		vec2 tex_coord = to_spherical(ray_dir);
		vec4 star_color = texture2D(star_texture, tex_coord * 2.0);
		if (star_color.g > 0.0) {
			float star_temperature = MIN_TEMPERATURE + TEMPERATURE_RANGE * star_color.r;
			color += vec4(temp_to_color(star_temperature), 1.0) * star_color.g * 0.033;
		}
		color += texture2D(bg_texture, tex_coord) * 0.004;
	}

	gl_FragColor = color;
}
`

const EventDetails = () => (
	<>
		<h2>
			<Trans>Overview</Trans>
		</h2>
		<p>
			<Trans>
				Event Horizon Day highlights the first direct image of a black hole,
				captured in 2019 by the Event Horizon Telescope collaboration.
			</Trans>
		</p>
		<p>
			<Trans>
				It represents a major milestone in astronomy, combining global
				cooperation, radio interferometry, and years of data processing.
			</Trans>
		</p>

		<h2>
			<Trans>What you are seeing</Trans>
		</h2>
		<p>
			<Trans>
				The dark center is the event horizon silhouette, while the bright ring
				is light from superheated material in the accretion flow around it.
			</Trans>
		</p>
		<p>
			<Trans>
				Because gravity bends light paths, parts of the disk appear warped and
				wrapped above and below the black hole.
			</Trans>
		</p>

		<h2>
			<Trans>Why it matters</Trans>
		</h2>
		<p>
			<Trans>
				This observation gave direct visual evidence of extreme spacetime
				curvature near a supermassive black hole and strongly matched the
				predictions of general relativity.
			</Trans>
		</p>
		<p>
			<Trans>
				It also opened a new era of black-hole imaging, with continued work on
				sharper reconstructions and time-varying dynamics.
			</Trans>
		</p>

		<h2>
			<Trans>Good to know</Trans>
		</h2>
		<p>
			<Trans>
				The original image was not a conventional photograph. It was computed
				from synchronized radio data recorded by observatories around Earth.
			</Trans>
		</p>
		<p>
			<Trans>
				The target was M87*, a black hole with a mass of billions of Suns,
				located about 55 million light-years away.
			</Trans>
		</p>
	</>
)

export const blackHoleEvent: SeasonalEvent = {
	id: SeasonalEventId.EventHorizonDay,
	isActive: isEventHorizonDay,
	run: launchBlackHoleEvent,
	details: EventDetails,
	tileAccent: {
		colors: ['#020617', '#1e293b', '#f97316', '#f8fafc', '#020617'],
	},
}

function isEventHorizonDay({ date }: SeasonalEventContext) {
	const year = date.getFullYear()
	const month = String(date.getMonth() + 1).padStart(2, '0')
	const day = String(date.getDate()).padStart(2, '0')
	return EVENT_HORIZON_DAY_DATES.has(`${year}-${month}-${day}`)
}

async function launchBlackHoleEvent() {
	try {
		if (typeof window === 'undefined') {
			return () => {}
		}

		const shouldAnimate = !window.matchMedia('(prefers-reduced-motion: reduce)')
			.matches
		let isPausedForModal = shouldAnimate && isSettingsModalOpen()

		const container = document.createElement('div')
		container.style.position = 'fixed'
		container.style.inset = '0'
		container.style.pointerEvents = 'none'
		container.style.zIndex = '0'
		container.style.opacity = '0'
		container.style.transition = 'opacity 1.8s ease-in'
		container.style.filter = BLACK_HOLE_CANVAS_FILTER
		container.style.mixBlendMode = 'screen'

		const dpr = Math.min(
			window.devicePixelRatio || 1,
			BLACK_HOLE_CANVAS_MAX_DPR,
		)

		// Vanilla Three.js — no React Three Fiber so we can use EffectComposer/bloom
		const renderer = new WebGLRenderer({
			antialias: true,
			alpha: true,
			powerPreference: 'low-power',
		})
		renderer.setClearColor(0x000000, 0)
		renderer.setPixelRatio(dpr)
		renderer.setSize(window.innerWidth, window.innerHeight)
		renderer.autoClear = false
		renderer.domElement.style.position = 'absolute'
		renderer.domElement.style.inset = '0'
		renderer.domElement.style.pointerEvents = 'none'
		container.appendChild(renderer.domElement)

		const scene = new Scene()
		// Base Camera at z=1 — projection handled entirely in the fragment shader
		const camera = new Camera()
		camera.position.z = 1

		// Postprocessing (bundled with three, no extra dependency needed)
		const [
			{ EffectComposer },
			{ RenderPass },
			{ UnrealBloomPass },
			{ OutputPass },
		] = await Promise.all([
			import('three/examples/jsm/postprocessing/EffectComposer.js'),
			import('three/examples/jsm/postprocessing/RenderPass.js'),
			import('three/examples/jsm/postprocessing/UnrealBloomPass.js'),
			import('three/examples/jsm/postprocessing/OutputPass.js'),
		])

		const composer = new EffectComposer(renderer)
		composer.addPass(new RenderPass(scene, camera))
		// strength=1.0, radius=0.5, threshold=0.6 — matching reference datGUI defaults
		composer.addPass(new UnrealBloomPass(new Vector2(128, 128), 1.0, 0.5, 0.6))
		composer.addPass(new OutputPass())

		// Load textures
		const textureLoader = new TextureLoader()
		const loadTex = (url: string) =>
			new Promise<ReturnType<TextureLoader['load']>>((resolve) => {
				textureLoader.load(url, (tex) => {
					tex.magFilter = LinearFilter
					tex.minFilter = LinearFilter
					tex.wrapS = ClampToEdgeWrapping
					tex.wrapT = ClampToEdgeWrapping
					resolve(tex)
				})
			})

		const loadRepeatTex = (url: string) =>
			new Promise<ReturnType<TextureLoader['load']>>((resolve) => {
				textureLoader.load(url, (tex) => {
					tex.magFilter = LinearFilter
					tex.minFilter = LinearFilter
					tex.wrapS = RepeatWrapping
					tex.wrapT = RepeatWrapping
					resolve(tex)
				})
			})

		const [bgTexture, starTexture, diskTexture] = await Promise.all([
			loadTex(milkywayData.src),
			loadRepeatTex(starNoiseData.src),
			loadTex(accretionDiskData.src),
		])

		// Camera nearly in the disk plane (y=0), looking directly at the BH (origin).
		// Small y elevation gives the Interstellar-style horizontal disk sweep.
		// cam_dir = normalize(-cam_pos) so BH is always centered.
		// cam_up = (0,1,0) keeps the disk horizontal. Orbit rotates around y-axis.
		const REF_CAM_POS = new Vector3(0, 0.5, 8)
		const REF_CAM_DIR = new Vector3(0, -0.0499, -0.9988)
		const REF_CAM_UP = new Vector3(0, 1, 0)
		const THETA_INITIAL = Math.atan2(REF_CAM_POS.x, REF_CAM_POS.z)

		const uniforms = {
			time: { value: 0.0 },
			// Resolution must be in physical pixels (CSS * DPR) to match gl_FragCoord.
			resolution: {
				value: new Vector2(window.innerWidth * dpr, window.innerHeight * dpr),
			},
			cam_pos: { value: new Vector3() },
			cam_dir: { value: new Vector3() },
			cam_up: { value: new Vector3() },
			fov: { value: 70.0 },
			bg_texture: { value: bgTexture },
			star_texture: { value: starTexture },
			disk_texture: { value: diskTexture },
		}

		const updateCamera = (theta: number) => {
			const dTheta = theta - THETA_INITIAL
			const cosD = Math.cos(dTheta)
			const sinD = Math.sin(dTheta)
			uniforms.cam_pos.value.set(
				REF_CAM_POS.x * cosD + REF_CAM_POS.z * sinD,
				REF_CAM_POS.y,
				-REF_CAM_POS.x * sinD + REF_CAM_POS.z * cosD,
			)
			uniforms.cam_dir.value.set(
				REF_CAM_DIR.x * cosD + REF_CAM_DIR.z * sinD,
				REF_CAM_DIR.y,
				-REF_CAM_DIR.x * sinD + REF_CAM_DIR.z * cosD,
			)
			uniforms.cam_up.value.set(
				REF_CAM_UP.x * cosD + REF_CAM_UP.z * sinD,
				REF_CAM_UP.y,
				-REF_CAM_UP.x * sinD + REF_CAM_UP.z * cosD,
			)
		}

		updateCamera(THETA_INITIAL)

		const material = new ShaderMaterial({
			uniforms,
			vertexShader: BLACK_HOLE_VERTEX_SHADER,
			fragmentShader: BLACK_HOLE_FRAGMENT_SHADER,
		})
		const mesh = new Mesh(new PlaneGeometry(2, 2), material)
		scene.add(mesh)

		let animFrameId: number | null = null
		let lastTime = 0
		let isMounted = false
		let timeoutId: number | null = null

		const animate = (now: number) => {
			if (isPausedForModal) {
				animFrameId = null
				return
			}

			const delta = lastTime === 0 ? 0 : (now - lastTime) / 1000
			lastTime = now

			const w = window.innerWidth
			const h = window.innerHeight
			renderer.setSize(w, h)
			// Pass CSS pixels — EffectComposer internally multiplies by its stored
			// pixelRatio (= dpr). Passing w*dpr here would double-apply the scale.
			composer.setSize(w, h)
			uniforms.resolution.value.set(w * dpr, h * dpr)

			if (shouldAnimate) {
				// Wrap time into [0, 2π] to prevent float precision loss in the
				// shader — large time values cause phi - time to lose mantissa bits.
				uniforms.time.value =
					(uniforms.time.value + delta * DISK_ROTATION_SPEED) % (Math.PI * 2)
			}

			composer.render()
			animFrameId = requestAnimationFrame(animate)
		}

		const pauseAnimation = () => {
			if (animFrameId !== null) {
				cancelAnimationFrame(animFrameId)
				animFrameId = null
			}
		}

		const resumeAnimation = () => {
			if (!shouldAnimate || !isMounted || animFrameId !== null) {
				return
			}
			lastTime = 0
			animFrameId = requestAnimationFrame(animate)
		}

		const unsubscribeModalState = onSettingsModalStateChange((isOpen) => {
			if (!shouldAnimate) {
				return
			}

			isPausedForModal = isOpen

			if (isOpen) {
				pauseAnimation()
				return
			}

			resumeAnimation()
		})

		const mount = () => {
			if (isMounted) return
			isMounted = true
			document.body.appendChild(container)
			// Double-rAF ensures the browser paints opacity:0 before transitioning.
			// A single rAF batches both style changes into the same frame.
			requestAnimationFrame(() => {
				requestAnimationFrame(() => {
					container.style.opacity = BLACK_HOLE_CANVAS_OPACITY
				})
			})
			composer.render()
			resumeAnimation()
		}

		timeoutId = window.setTimeout(mount, BLACK_HOLE_MOUNT_DELAY_MS)

		return () => {
			if (timeoutId !== null) window.clearTimeout(timeoutId)
			if (animFrameId !== null) cancelAnimationFrame(animFrameId)
			unsubscribeModalState()
			renderer.dispose()
			material.dispose()
			mesh.geometry.dispose()
			bgTexture.dispose()
			starTexture.dispose()
			diskTexture.dispose()
			if (container.parentElement)
				container.parentElement.removeChild(container)
		}
	} catch (error) {
		console.error('Failed to launch Event Horizon Day scene', error)
		return () => {}
	}
}
