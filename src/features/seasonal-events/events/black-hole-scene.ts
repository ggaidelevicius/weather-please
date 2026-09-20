import {
	ACESFilmicToneMapping,
	Camera,
	GLSL3,
	HalfFloatType,
	Mesh,
	NearestFilter,
	PlaneGeometry,
	Scene,
	ShaderMaterial,
	UnsignedByteType,
	Vector2,
	Vector3,
	WebGLRenderTarget,
} from 'three'
import type { Texture, WebGLRenderer } from 'three'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'
import { createAccretionVolumeTexture } from './black-hole-volume'

export function createBlackHoleScene({
	renderer,
	bgTexture,
	starTexture,
}: {
	renderer: WebGLRenderer
	bgTexture: Texture
	starTexture: Texture
}) {
	const resources: { dispose: () => void }[] = []
	const previousToneMapping = renderer.toneMapping
	const previousExposure = renderer.toneMappingExposure
	let hasDisposed = false
	const own = <T extends { dispose: () => void }>(resource: T): T => {
		resources.push(resource)
		return resource
	}
	const dispose = () => {
		if (hasDisposed) return
		hasDisposed = true
		for (const resource of resources.reverse()) resource.dispose()
		renderer.toneMapping = previousToneMapping
		renderer.toneMappingExposure = previousExposure
	}

	try {
		const gasVolume = own(createAccretionVolumeTexture())
		const gl = renderer.getContext()
		const hasHalfFloat =
			renderer.extensions.has('EXT_color_buffer_float') ||
			renderer.extensions.has('EXT_color_buffer_half_float')
		let canCache =
			hasHalfFloat &&
			'MAX_DRAW_BUFFERS' in gl &&
			'MAX_COLOR_ATTACHMENTS' in gl &&
			Number(gl.getParameter(gl.MAX_DRAW_BUFFERS)) >= 4 &&
			Number(gl.getParameter(gl.MAX_COLOR_ATTACHMENTS)) >= 4
		const cacheTarget = canCache
			? own(
					new WebGLRenderTarget(1, 1, {
						count: 4,
						type: HalfFloatType,
						minFilter: NearestFilter,
						magFilter: NearestFilter,
						depthBuffer: false,
						generateMipmaps: false,
					}),
				)
			: null
		const uniforms = {
			uResolution: { value: new Vector2(1, 1) },
			uTanFov: { value: Math.tan((VERTICAL_FOV * Math.PI) / 360) },
			uFrameCenter: { value: new Vector2(0.86, 0.74) },
			uViewRotation: {
				value: new Vector2(Math.cos(VIEW_ROLL), Math.sin(VIEW_ROLL)),
			},
			uTime: { value: 0 },
			uBackground: { value: bgTexture },
			uStars: { value: starTexture },
			uGasVolume: { value: gasVolume },
			uUseCache: { value: canCache },
			uHit0: { value: cacheTarget?.textures[0] ?? null },
			uHit1: { value: cacheTarget?.textures[1] ?? null },
			uHit2: { value: cacheTarget?.textures[2] ?? null },
			uStaticBackground: { value: cacheTarget?.textures[3] ?? null },
			uDiskBrightness: { value: DISK_BRIGHTNESS },
			uOuterColor: { value: new Vector3(...OUTER_DISK_COLOR) },
			uInnerColor: { value: new Vector3(...INNER_DISK_COLOR) },
		}
		const geometry = own(new PlaneGeometry(2, 2))
		const camera = new Camera()
		const scene = new Scene()
		const material = own(
			new ShaderMaterial({
				uniforms,
				vertexShader: VERTEX_SHADER,
				fragmentShader: DISPLAY_FRAGMENT_SHADER,
				depthTest: false,
				depthWrite: false,
				toneMapped: false,
			}),
		)
		const mesh = new Mesh(geometry, material)
		mesh.frustumCulled = false
		scene.add(mesh)
		const cacheScene = new Scene()
		if (cacheTarget) {
			const cacheMaterial = own(
				new ShaderMaterial({
					uniforms,
					vertexShader: VERTEX_SHADER,
					fragmentShader: CACHE_FRAGMENT_SHADER,
					glslVersion: GLSL3,
					depthTest: false,
					depthWrite: false,
					toneMapped: false,
				}),
			)
			const cacheMesh = new Mesh(geometry, cacheMaterial)
			cacheMesh.frustumCulled = false
			cacheScene.add(cacheMesh)
		}

		const outputTarget = new WebGLRenderTarget(1, 1, {
			type: hasHalfFloat ? HalfFloatType : UnsignedByteType,
			depthBuffer: false,
		})
		let composer: EffectComposer
		try {
			composer = own(new EffectComposer(renderer, outputTarget))
		} catch (error) {
			outputTarget.dispose()
			throw error
		}
		composer.setPixelRatio(1)
		const renderPass = own(new RenderPass(scene, camera))
		const bloomPass = own(
			new UnrealBloomPass(
				new Vector2(1, 1),
				BLOOM_STRENGTH,
				BLOOM_RADIUS,
				BLOOM_THRESHOLD,
			),
		)
		// The installed bloom pass omits its high-pass material from dispose().
		own(bloomPass.materialHighPassFilter)
		bloomPass.materialHighPassFilter.fragmentShader = BLOOM_HIGHLIGHT_SHADER
		if (!hasHalfFloat) {
			for (const target of [
				bloomPass.renderTargetBright,
				...bloomPass.renderTargetsHorizontal,
				...bloomPass.renderTargetsVertical,
			]) {
				target.texture.type = UnsignedByteType
			}
		}
		// Spread the inner gas's glare into a soft halo around the lensed ring.
		bloomPass.compositeMaterial.uniforms.bloomFactors.value = [
			0.12, 0.2, 0.27, 0.25, 0.16,
		]
		bloomPass.bloomTintColors = [
			new Vector3(1, 0.98, 0.95),
			new Vector3(0.94, 0.97, 1),
			new Vector3(0.84, 0.91, 1),
			new Vector3(0.76, 0.85, 1),
			new Vector3(0.7, 0.81, 1),
		]
		const outputPass = own(new OutputPass())
		outputPass.uniforms.uReveal = { value: 0 }
		outputPass.uniforms.uTexelSize = { value: new Vector2(1, 1) }
		outputPass.uniforms.uPremultipliedAlpha = {
			value: gl.getContextAttributes()?.premultipliedAlpha ?? true,
		}
		outputPass.material.fragmentShader = OUTPUT_FRAGMENT_SHADER
		composer.addPass(renderPass)
		composer.addPass(bloomPass)
		composer.addPass(outputPass)
		renderer.toneMapping = ACESFilmicToneMapping
		renderer.toneMappingExposure = EXPOSURE

		let lastPixelWidth = 0
		let lastPixelHeight = 0
		const render = ({
			width,
			height,
			dpr,
			time,
			reveal,
		}: {
			width: number
			height: number
			dpr: number
			time: number
			reveal: number
		}) => {
			if (hasDisposed) return
			const safeWidth = Math.max(1, width)
			const safeHeight = Math.max(1, height)
			const safeDpr = Math.max(0.1, dpr)
			const pixelWidth = Math.max(1, Math.floor(safeWidth * safeDpr))
			const pixelHeight = Math.max(1, Math.floor(safeHeight * safeDpr))
			uniforms.uTime.value = time
			outputPass.uniforms.uReveal.value = Math.max(0, Math.min(1, reveal))
			if (pixelWidth !== lastPixelWidth || pixelHeight !== lastPixelHeight) {
				const aspect = pixelWidth / pixelHeight
				const portraitBlend = Math.max(0, Math.min(1, (1.2 - aspect) / 0.5))
				uniforms.uResolution.value.set(pixelWidth, pixelHeight)
				uniforms.uFrameCenter.value.set(
					0.86 - portraitBlend * 0.1,
					0.74 - portraitBlend * 0.12,
				)
				outputPass.uniforms.uTexelSize.value.set(
					1 / pixelWidth,
					1 / pixelHeight,
				)
				uniforms.uTanFov.value =
					Math.tan((VERTICAL_FOV * Math.PI) / 360) / Math.min(1, aspect)
				composer.setSize(pixelWidth, pixelHeight)
				if (canCache && cacheTarget) {
					cacheTarget.setSize(pixelWidth, pixelHeight)
					const previousTarget = renderer.getRenderTarget()
					try {
						renderer.setRenderTarget(cacheTarget)
						canCache =
							gl.checkFramebufferStatus(gl.FRAMEBUFFER) ===
							gl.FRAMEBUFFER_COMPLETE
						if (canCache) renderer.render(cacheScene, camera)
					} finally {
						renderer.setRenderTarget(previousTarget)
					}
					uniforms.uUseCache.value = canCache
				}
				lastPixelWidth = pixelWidth
				lastPixelHeight = pixelHeight
			}
			composer.render(0)
		}
		return { render, dispose }
	} catch (error) {
		dispose()
		throw error
	}
}

const VERTICAL_FOV = 36
const VIEW_ROLL = (22.5 * Math.PI) / 180
const DISK_BRIGHTNESS = 1.35
const OUTER_DISK_COLOR = [0.7, 0.38, 0.19] as const
const INNER_DISK_COLOR = [1, 0.95, 0.79] as const
const BLOOM_STRENGTH = 2.5
const BLOOM_RADIUS = 0
const BLOOM_THRESHOLD = 0.45
const EXPOSURE = 0.85

const VERTEX_SHADER = `
void main() {
	gl_Position = vec4(position, 1.0);
}
`

// Schwarzschild geodesic ray tracer adapted from
// https://github.com/vlwkaos/threejs-blackhole (MIT license).
// Ray geometry is time-independent; moving gas is shaded at cached crossings.
const RAY_SHADER = `
#define STEP 0.05
#define NSTEPS 600
#define PI 3.141592653589793

uniform vec2 uResolution;
uniform float uTanFov;
uniform vec2 uFrameCenter;
uniform vec2 uViewRotation;
uniform float uTime;
uniform sampler2D uBackground;
uniform sampler2D uStars;
uniform highp sampler3D uGasVolume;
uniform float uDiskBrightness;
uniform vec3 uOuterColor;
uniform vec3 uInnerColor;

struct RayResult {
	vec4 hit0;
	vec4 hit1;
	vec4 hit2;
	vec3 background;
	vec3 disk;
	bool overflow;
};

vec3 temperatureColor(float kelvin) {
	float temp = clamp(kelvin, 1000.0, 40000.0) / 100.0;
	vec3 color;
	if (temp <= 66.0) {
		color.r = 255.0;
		color.g = 99.4708025861 * log(temp) - 161.1195681661;
	} else {
		color.r = 329.698727446 * pow(temp - 60.0, -0.1332047592);
		color.g = 288.1221695283 * pow(temp - 60.0, -0.0755148492);
	}
	if (temp >= 66.0) color.b = 255.0;
	else if (temp <= 19.0) color.b = 0.0;
	else color.b = 138.5177312231 * log(temp - 10.0) - 305.0447927307;
	return clamp(color / 255.0, 0.0, 1.0);
}

float filteredFilament(float phase, float footprint) {
	float coordinate = phase / (2.0 * PI);
	float cell = floor(coordinate);
	float blend = fract(coordinate);
	blend = blend * blend * (3.0 - 2.0 * blend);
	float start = fract(sin(cell * 127.1 + 19.7) * 43758.5453);
	float end = fract(sin((cell + 1.0) * 127.1 + 19.7) * 43758.5453);
	float strand = mix(start, end, blend);
	// Subpixel strands converge to their mean brightness instead of sparkling.
	return mix(strand * strand * strand * (4.0 / 3.0), 0.29, smoothstep(0.4, 3.0, footprint));
}

float volumeMip(vec2 footprint, vec2 scale) {
	float texels = max(footprint.x * scale.x, footprint.y * scale.y)
		* float(textureSize(uGasVolume, 0).x);
	return log2(max(texels, 1.0));
}

vec3 shadeDisk(vec4 hit, vec2 pixelFootprint) {
	if (hit.w < 0.5) return vec3(0.0);
	float radialFootprint = pixelFootprint.y * 1.2 + pixelFootprint.x * 0.15;
	float radial = hit.y;
	float innerHeat = 1.0 - smoothstep(0.08, 0.72, radial);
	float outerDust = 1.0 - innerHeat;
	float radius = 2.0 + radial * 4.0;
	float phi = hit.x * 2.0 * PI;
	float longitude = hit.x - uTime / (2.0 * PI);
	// Explicit mips stay stable across ray boundaries and uncached crossings.
	float flowMip = volumeMip(pixelFootprint, vec2(2.0, 0.8));
	float gasMip = volumeMip(pixelFootprint, vec2(6.0, 2.5) * 1.35);
	float detailMip = volumeMip(pixelFootprint, vec2(30.0, 7.5) * 1.35);
	vec4 flow = textureLod(uGasVolume, vec3(longitude * 2.0, radial * 0.8, 0.17), flowMip);
	vec2 stream = vec2(
		longitude * 6.0 + radial * 0.22 + (flow.g - 0.5) * 0.24,
		radial * 2.5 + (flow.r - 0.5) * 0.36 + (flow.b - 0.5) * 0.035
	);
	// Periodic deformation stays continuous when the orbital phase wraps.
	stream.x += 0.025 * sin(uTime + radial * 8.0);
	vec2 radialAxis = vec2(sin(phi), cos(phi));
	vec2 tangent = vec2(cos(phi), -sin(phi));
	vec2 sight = vec2(0.0, 8.0) - radialAxis * radius;
	vec2 parallax = vec2(
		dot(sight, tangent) / (radius * 2.0 * PI),
		dot(sight, radialAxis) * 0.25
	) * vec2(6.0, 2.5) * mix(0.022, 0.06, outerDust);
	vec3 radiance = vec3(0.0);
	float transmission = 1.0;
	// Approximate a thin gas sheet with depth and absorption at each crossing.
	for (int layer = 0; layer < 3; layer++) {
		float depth = float(layer) * 0.5;
		vec3 position = vec3(
			stream + parallax * (depth - 0.5),
			0.13 + depth * mix(0.24, 0.38, outerDust) + 0.012 * sin(uTime)
		);
		vec4 gas = textureLod(uGasVolume, position, gasMip);
		vec2 detail = textureLod(uGasVolume, position * vec3(5.0, 3.0, 2.0), detailMip).ba;
		float wisps = smoothstep(0.2, 0.8, detail.x * 0.65 + gas.a * 0.35);
		float orbit = radial + parallax.y * (depth - 0.5) / 2.5
			+ (flow.r - 0.5) * 0.028 + (gas.g - 0.5) * 0.003;
		float phase = orbit * 2.0 * PI;
		float footprint = max(radialFootprint, 0.0005) * 2.0 * PI;
		float strands =
			0.5 * filteredFilament(phase * 52.0 + gas.g * 1.8, footprint * 52.0)
			+ 0.32 * filteredFilament(phase * 119.0 + flow.b * 3.0 + depth * 7.1, footprint * 119.0)
			+ 0.18 * filteredFilament(phase * 271.0 + detail.x * 1.2, footprint * 271.0);
		float envelope = 0.28 + dot(gas.rgb, vec3(0.18, 0.16, 0.12));
		float density = envelope * (0.2 + strands * 2.1) * (0.65 + wisps * 0.6);
		float dustCoverage = 0.35 + smoothstep(0.2, 0.8, detail.y) * 0.65;
		density *= mix(1.0, dustCoverage, outerDust);
		float cover = textureLod(uGasVolume, position + vec3(0.013, -0.018, 0.075), gasMip).g;
		float shadow = exp(-max(cover - gas.g + 0.1, 0.0) * mix(2.0, 0.9, outerDust));
		float heat = innerHeat * (0.75 + depth * 0.15 + strands * 0.1);
		vec3 color = mix(uOuterColor, uInnerColor, smoothstep(0.12, 0.85, heat));
		// Thin outer veils reveal the illuminated folds behind them.
		float opticalDepth = mix(mix(1.8, 1.2, depth), 0.48, outerDust);
		float opacity = 1.0 - exp(-density * opticalDepth);
		float emission = mix(0.22, 2.6, depth) * (0.35 + strands * 2.3)
			* (0.35 + wisps * 0.95) * shadow;
		radiance += transmission * color * emission * opacity;
		transmission *= 1.0 - opacity;
	}
	float dustEdge = radial + outerDust * (flow.b - 0.5) * 0.18;
	float edge = smoothstep(0.0, 0.065, radial) * (1.0 - smoothstep(0.58, 1.0, dustEdge));
	// Cooler outer gas retains dusty detail without feeding the bloom pass.
	float illumination = 0.12 + 3.4 * exp(-radial * 5.0);
	return radiance * edge * illumination * uDiskBrightness
		/ pow(max(hit.z, 0.15), 3.0);
}

RayResult traceRay(bool shouldShade) {
	RayResult result;
	result.hit0 = vec4(0.0);
	result.hit1 = vec4(0.0);
	result.hit2 = vec4(0.0);
	result.background = vec3(0.0);
	result.disk = vec3(0.0);
	result.overflow = false;
	vec2 uv = 2.0 * (gl_FragCoord.xy / uResolution - uFrameCenter);
	uv.x *= uResolution.x / uResolution.y;
	uv = vec2(
		uViewRotation.x * uv.x + uViewRotation.y * uv.y,
		-uViewRotation.y * uv.x + uViewRotation.x * uv.y
	) * uTanFov;
	// A small foreground world establishes the scale of the cropped disc.
	vec2 planet = (uv - vec2(-0.70, 0.18)) / 0.014;
	float planetRadius = dot(planet, planet);
	if (planetRadius < 1.0) {
		vec3 normal = vec3(planet, sqrt(1.0 - planetRadius));
		float light = max(dot(normal, normalize(vec3(0.96, -0.23, 0.08))), 0.0);
		float surface = 0.84 + 0.16 * sin(planet.x * 19.0 + sin(planet.y * 23.0));
		result.background = vec3(0.0005, 0.0009, 0.0012)
			+ vec3(0.11, 0.14, 0.15) * pow(light, 2.5) * surface;
		return result;
	}
	vec3 forward = normalize(vec3(0.0, -0.04, -1.0));
	vec3 right = normalize(cross(forward, vec3(0.0, 1.0, 0.0)));
	vec3 up = cross(right, forward);
	vec3 rayDirection = normalize(forward + right * uv.x + up * uv.y);
	vec3 point = vec3(0.0, 0.32, 8.0);
	vec3 velocity = rayDirection;
	vec3 momentum = cross(point, velocity);
	float h2 = dot(momentum, momentum);
	vec3 oldPoint = point;
	float distance = length(point);
	int hitCount = 0;
	bool isCaptured = false;
	for (int index = 0; index < NSTEPS; index++) {
		oldPoint = point;
		point += velocity * STEP;
		velocity += -1.5 * h2 * point / pow(dot(point, point), 2.5) * STEP;
		distance = length(point);
		if (distance < 1.0 && length(oldPoint) > 1.0) {
			isCaptured = true;
			break;
		}
		if (oldPoint.y * point.y < 0.0) {
			float lambda = -oldPoint.y / velocity.y;
			vec3 intersection = oldPoint + lambda * velocity;
			float radius = length(intersection);
			if (radius >= 2.0 && radius <= 6.0) {
				float longitude = atan(intersection.x, intersection.z) / (2.0 * PI);
				vec3 diskVelocity = vec3(-intersection.x, 0.0, intersection.z)
					/ sqrt(2.0 * max(radius - 1.0, 0.001)) / (radius * radius);
				float gamma = inversesqrt(max(1.0 - dot(diskVelocity, diskVelocity), 0.001));
				float doppler = gamma * (1.0 + dot(rayDirection / distance, diskVelocity));
				vec4 hit = vec4(longitude, (radius - 2.0) / 4.0, doppler, 1.0);
				if (hitCount == 0) result.hit0 = hit;
				else if (hitCount == 1) result.hit1 = hit;
				else if (hitCount == 2) result.hit2 = hit;
				else result.overflow = true;
				if (shouldShade) {
					// A conservative projected footprint also filters uncached rays.
					float incidence = max(abs(normalize(velocity).y), 0.03);
					float footprint = uTanFov * length(intersection - vec3(0.0, 0.32, 8.0))
						/ (2.0 * uResolution.y * incidence);
					result.disk += shadeDisk(hit, vec2(footprint * incidence * 2.0 / (PI * radius), footprint));
				}
				hitCount++;
			}
		}
	}
	if (!isCaptured && distance > 1.0) {
		vec3 direction = normalize(point - oldPoint);
		vec2 sphere = vec2(atan(direction.z, direction.x), asin(clamp(direction.y, -1.0, 1.0)));
		sphere = sphere * vec2(1.0 / (2.0 * PI), 1.0 / PI) + 0.5;
		vec4 stars = texture2D(uStars, sphere * 2.0);
		result.background = temperatureColor(1000.0 + 39000.0 * stars.r) * stars.g * 0.033;
		result.background += texture2D(uBackground, sphere).rgb * 0.004;
	}
	return result;
}
`

const CACHE_FRAGMENT_SHADER = `
${RAY_SHADER}
layout(location = 0) out vec4 hit0;
layout(location = 1) out vec4 hit1;
layout(location = 2) out vec4 hit2;
layout(location = 3) out vec4 background;
void main() {
	RayResult ray = traceRay(false);
	hit0 = ray.hit0;
	hit1 = ray.hit1;
	hit2 = ray.hit2;
	background = vec4(ray.background, ray.overflow ? -1.0 : 0.0);
}
`

const DISPLAY_FRAGMENT_SHADER = `
${RAY_SHADER}
uniform bool uUseCache;
uniform sampler2D uHit0;
uniform sampler2D uHit1;
uniform sampler2D uHit2;
uniform sampler2D uStaticBackground;
vec2 hitFootprint(vec4 hit) {
	vec2 dx = dFdx(hit.xy);
	vec2 dy = dFdy(hit.xy);
	// Longitude wraps at atan's seam; that is not a change in pixel size.
	dx.x -= floor(dx.x + 0.5);
	dy.x -= floor(dy.x + 0.5);
	return abs(dx) + abs(dy);
}
void main() {
	vec2 uv = gl_FragCoord.xy / uResolution;
	if (uUseCache) {
		vec4 background = texture2D(uStaticBackground, uv);
		vec4 hit0 = texture2D(uHit0, uv);
		vec4 hit1 = texture2D(uHit1, uv);
		vec4 hit2 = texture2D(uHit2, uv);
		// Take derivatives before per-pixel validity and fallback branches.
		vec2 width0 = hitFootprint(hit0);
		vec2 width1 = hitFootprint(hit1);
		vec2 width2 = hitFootprint(hit2);
		if (background.a >= 0.0) {
			vec3 color = background.rgb
				+ shadeDisk(hit0, width0)
				+ shadeDisk(hit1, width1)
				+ shadeDisk(hit2, width2);
			gl_FragColor = vec4(color, 1.0);
			return;
		}
	}
	RayResult ray = traceRay(true);
	gl_FragColor = vec4(ray.background + ray.disk, 1.0);
}
`

const BLOOM_HIGHLIGHT_SHADER = `
uniform sampler2D tDiffuse;
uniform float luminosityThreshold;
varying vec2 vUv;
void main() {
	vec3 color = max(texture2D(tDiffuse, vUv).rgb, vec3(0.0));
	float brightness = dot(color, vec3(0.2126, 0.7152, 0.0722));
	float excess = max(brightness - luminosityThreshold, 0.0);
	gl_FragColor = vec4(color * excess / max(brightness, 0.0001), 1.0);
}
`

const OUTPUT_FRAGMENT_SHADER = `
precision highp float;
uniform sampler2D tDiffuse;
uniform float uReveal;
uniform vec2 uTexelSize;
uniform bool uPremultipliedAlpha;
varying vec2 vUv;
#include <tonemapping_pars_fragment>
#include <colorspace_pars_fragment>
vec3 sampleLight(vec2 uv) {
	vec3 space = vec3(0.0012, 0.0018, 0.003);
	return ACESFilmicToneMapping(max(texture2D(tDiffuse, uv).rgb, vec3(0.0)) + space);
}
void main() {
	vec3 center = sampleLight(vUv);
	vec3 north = sampleLight(vUv + vec2(0.0, uTexelSize.y));
	vec3 south = sampleLight(vUv - vec2(0.0, uTexelSize.y));
	vec3 east = sampleLight(vUv + vec2(uTexelSize.x, 0.0));
	vec3 west = sampleLight(vUv - vec2(uTexelSize.x, 0.0));
	vec3 low = min(center, min(min(north, south), min(east, west)));
	vec3 high = max(center, max(max(north, south), max(east, west)));
	float contrast = dot(high - low, vec3(0.2126, 0.7152, 0.0722));
	vec3 filtered = center * 0.5 + (north + south + east + west) * 0.125;
	vec3 color = mix(center, filtered, smoothstep(0.06, 0.3, contrast));
	#ifdef SRGB_TRANSFER
		color = sRGBTransferOETF(vec4(color, 1.0)).rgb;
	#endif
	if (uPremultipliedAlpha) color *= uReveal;
	gl_FragColor = vec4(color, uReveal);
}
`
