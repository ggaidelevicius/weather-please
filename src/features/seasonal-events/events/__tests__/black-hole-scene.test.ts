import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
	Data3DTexture,
	Material,
	Mesh,
	PlaneGeometry,
	ReinhardToneMapping,
	ShaderMaterial,
	Texture,
	UnsignedByteType,
	WebGLRenderTarget,
} from 'three'
import type { WebGLRenderer } from 'three'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'
import { createBlackHoleScene } from '../black-hole-scene'
import { createAccretionVolumeTexture } from '../black-hole-volume'

vi.mock('../black-hole-volume', () => ({
	createAccretionVolumeTexture: vi.fn(),
}))

const scenes: ReturnType<typeof createBlackHoleScene>[] = []
const frame = { width: 1280, height: 720, dpr: 1, time: 0, reveal: 1 }

beforeEach(() => {
	vi.mocked(createAccretionVolumeTexture).mockReset()
	vi.mocked(createAccretionVolumeTexture).mockImplementation(
		() => new Data3DTexture(new Uint8Array([128, 180, 230, 255]), 1, 1, 1),
	)
	vi.spyOn(EffectComposer.prototype, 'render').mockImplementation(() => {})
	vi.spyOn(EffectComposer.prototype, 'setPixelRatio')
	vi.spyOn(EffectComposer.prototype, 'setSize')
	vi.spyOn(Material.prototype, 'setValues')
})

afterEach(() => {
	for (const scene of scenes.splice(0)) scene.dispose()
	vi.restoreAllMocks()
})

describe('black hole scene resources', () => {
	it('bakes ray geometry once while continuing to compose every animation frame', () => {
		const { scene, renderer, composer } = createScene()
		scene.render(frame)
		const sizeCalls = vi.mocked(EffectComposer.prototype.setSize).mock.calls
			.length
		for (let index = 1; index <= 20; index += 1) {
			scene.render({ ...frame, time: index * 0.05, reveal: index / 20 })
		}

		expect(renderer.render).toHaveBeenCalledOnce()
		expect(EffectComposer.prototype.render).toHaveBeenCalledTimes(21)
		expect(EffectComposer.prototype.setSize).toHaveBeenCalledTimes(sizeCalls)
		expect(renderer.setRenderTarget).toHaveBeenCalledTimes(2)
		expect(renderer.getRenderTarget()).toBeNull()
		expect(createAccretionVolumeTexture).toHaveBeenCalledOnce()
		expect(
			Object.values(getDisplayMesh(composer).material.uniforms).some(
				({ value }) => value === getCreatedVolume(),
			),
		).toBe(true)
	})

	it.each([
		{ width: 390, height: 844, dpr: 1 },
		{ width: 1280, height: 720, dpr: 1.2 },
	])(
		'rebakes once when the physical viewport changes to $width × $height at $dpr DPR',
		(viewport) => {
			const { scene, renderer, composer } = createScene()
			scene.render(frame)
			scene.render({ ...frame, ...viewport, time: 1 })
			scene.render({ ...frame, ...viewport, time: 2 })

			expect(renderer.render).toHaveBeenCalledTimes(2)
			expect(composer.renderTarget1.width).toBe(
				Math.floor(viewport.width * viewport.dpr),
			)
			expect(composer.renderTarget1.height).toBe(
				Math.floor(viewport.height * viewport.dpr),
			)
			expect(EffectComposer.prototype.render).toHaveBeenCalledTimes(3)
		},
	)

	it('reuses a bake when CSS size and DPR change without changing physical dimensions', () => {
		const { scene, renderer } = createScene()
		scene.render(frame)
		scene.render({ ...frame, width: 640, height: 360, dpr: 2, time: 1 })
		expect(renderer.render).toHaveBeenCalledOnce()
		expect(EffectComposer.prototype.render).toHaveBeenCalledTimes(2)
	})

	it.each([
		{ hasHalfFloat: false, maxAttachments: 8 },
		{ hasHalfFloat: true, maxAttachments: 2 },
	])(
		'renders without a geometry cache when MRT is unsupported ($hasHalfFloat, $maxAttachments)',
		(capabilities) => {
			const { scene, renderer, gl, composer, bloom } = createScene(capabilities)
			scene.render(frame)
			scene.render({ ...frame, time: 1 })
			expect(renderer.render).not.toHaveBeenCalled()
			expect(gl.checkFramebufferStatus).not.toHaveBeenCalled()
			expect(EffectComposer.prototype.render).toHaveBeenCalledTimes(2)
			expect(getDisplayMesh(composer).material.uniforms.uUseCache.value).toBe(
				false,
			)
			if (!capabilities.hasHalfFloat) {
				for (const target of getPostprocessTargets(composer, bloom)) {
					expect(target.texture.type).toBe(UnsignedByteType)
				}
			}
		},
	)

	it('falls back permanently when the allocated MRT framebuffer is incomplete', () => {
		const { scene, renderer, gl, composer } = createScene({
			isFramebufferComplete: false,
		})
		scene.render(frame)
		scene.render({ ...frame, width: 390, height: 844, time: 1 })
		expect(gl.checkFramebufferStatus).toHaveBeenCalledOnce()
		expect(renderer.render).not.toHaveBeenCalled()
		expect(renderer.getRenderTarget()).toBeNull()
		expect(getDisplayMesh(composer).material.uniforms.uUseCache.value).toBe(
			false,
		)
		expect(EffectComposer.prototype.render).toHaveBeenCalledTimes(2)
	})

	it('disposes every owned target, material, pass, and geometry once without disposing caller resources', () => {
		const { scene, renderer, composer, bloom, textures } = createScene()
		scene.render(frame)
		const cacheTarget = vi.mocked(renderer.setRenderTarget).mock.calls[0][0]
		expect(cacheTarget).toBeInstanceOf(WebGLRenderTarget)
		if (!cacheTarget) throw new Error('Missing geometry cache')
		const targets = [cacheTarget, ...getPostprocessTargets(composer, bloom)]
		const disposals = [
			vi.spyOn(getCreatedVolume(), 'dispose'),
			...targets.map((target) => vi.spyOn(target, 'dispose')),
			...getCreatedMaterials().map((material) => vi.spyOn(material, 'dispose')),
			...composer.passes.map((pass) => vi.spyOn(pass, 'dispose')),
			vi.spyOn(getDisplayMesh(composer).geometry, 'dispose'),
			vi.spyOn(composer, 'dispose'),
		]
		const inputDisposals = textures.map((texture) =>
			vi.spyOn(texture, 'dispose'),
		)
		scene.dispose()
		scene.dispose()
		scene.render({ ...frame, time: 10 })

		for (const dispose of disposals) expect(dispose).toHaveBeenCalledOnce()
		for (const dispose of inputDisposals) expect(dispose).not.toHaveBeenCalled()
		expect(renderer.dispose).not.toHaveBeenCalled()
		expect(renderer.toneMapping).toBe(ReinhardToneMapping)
		expect(renderer.toneMappingExposure).toBe(1.7)
		expect(EffectComposer.prototype.render).toHaveBeenCalledOnce()
	})

	it('cleans up allocated resources when postprocessing setup fails', () => {
		const materialDispose = vi.spyOn(Material.prototype, 'dispose')
		const geometryDispose = vi.spyOn(PlaneGeometry.prototype, 'dispose')
		const composerDispose = vi.spyOn(EffectComposer.prototype, 'dispose')
		const bloomDispose = vi.spyOn(UnrealBloomPass.prototype, 'dispose')
		const volumeDispose = vi.spyOn(Data3DTexture.prototype, 'dispose')
		vi.spyOn(EffectComposer.prototype, 'addPass').mockImplementationOnce(() => {
			throw new Error('Postprocessing unavailable')
		})
		const inputs = createInputs()
		const inputDisposals = [inputs.bgTexture, inputs.starTexture].map(
			(texture) => vi.spyOn(texture, 'dispose'),
		)

		expect(() => createBlackHoleScene(inputs)).toThrow(
			'Postprocessing unavailable',
		)
		for (const material of getCreatedMaterials()) {
			expect(
				materialDispose.mock.contexts.filter((value) => value === material),
			).toHaveLength(1)
		}
		expect(geometryDispose).toHaveBeenCalledOnce()
		expect(composerDispose).toHaveBeenCalledOnce()
		expect(bloomDispose).toHaveBeenCalledOnce()
		expect(createAccretionVolumeTexture).toHaveBeenCalledOnce()
		expect(volumeDispose).toHaveBeenCalledOnce()
		for (const dispose of inputDisposals) expect(dispose).not.toHaveBeenCalled()
		expect(inputs.renderer.dispose).not.toHaveBeenCalled()
		expect(inputs.renderer.toneMapping).toBe(ReinhardToneMapping)
		expect(inputs.renderer.toneMappingExposure).toBe(1.7)
	})

	it('restores the previous render target when geometry baking throws', () => {
		const { scene, renderer } = createScene()
		const previousTarget = new WebGLRenderTarget(8, 8)
		renderer.setRenderTarget(previousTarget)
		vi.mocked(renderer.render).mockImplementationOnce(() => {
			throw new Error('Geometry rendering failed')
		})
		expect(() => scene.render(frame)).toThrow('Geometry rendering failed')
		expect(renderer.getRenderTarget()).toBe(previousTarget)
		expect(EffectComposer.prototype.render).not.toHaveBeenCalled()
		previousTarget.dispose()
	})
})

function createScene(options: Parameters<typeof createInputs>[0] = {}) {
	const inputs = createInputs(options)
	const scene = createBlackHoleScene(inputs)
	scenes.push(scene)
	const composer = vi.mocked(EffectComposer.prototype.setPixelRatio).mock
		.contexts[0]
	if (!(composer instanceof EffectComposer)) throw new Error('Missing composer')
	const bloom = composer.passes.find((pass) => pass instanceof UnrealBloomPass)
	if (!bloom) throw new Error('Missing bloom pass')
	return {
		scene,
		renderer: inputs.renderer,
		gl: inputs.renderer.getContext(),
		composer,
		bloom,
		textures: [inputs.bgTexture, inputs.starTexture],
	}
}

function createInputs({
	hasHalfFloat = true,
	maxAttachments = 8,
	isFramebufferComplete = true,
}: {
	hasHalfFloat?: boolean
	maxAttachments?: number
	isFramebufferComplete?: boolean
} = {}) {
	const gl: Pick<
		WebGL2RenderingContext,
		| 'MAX_DRAW_BUFFERS'
		| 'MAX_COLOR_ATTACHMENTS'
		| 'FRAMEBUFFER'
		| 'FRAMEBUFFER_COMPLETE'
		| 'getParameter'
		| 'checkFramebufferStatus'
		| 'getContextAttributes'
	> = {
		MAX_DRAW_BUFFERS: 0x8824,
		MAX_COLOR_ATTACHMENTS: 0x8cdf,
		FRAMEBUFFER: 0x8d40,
		FRAMEBUFFER_COMPLETE: 0x8cd5,
		getParameter: vi.fn(() => maxAttachments),
		checkFramebufferStatus: vi.fn(() =>
			isFramebufferComplete ? 0x8cd5 : 0x8cd6,
		),
		getContextAttributes: vi.fn(() => ({ premultipliedAlpha: true })),
	}
	let target: WebGLRenderTarget | null = null
	const renderer: Pick<
		WebGLRenderer,
		| 'getContext'
		| 'extensions'
		| 'getPixelRatio'
		| 'getRenderTarget'
		| 'setRenderTarget'
		| 'render'
		| 'dispose'
		| 'toneMapping'
		| 'toneMappingExposure'
	> = {
		getContext: () => gl as WebGL2RenderingContext,
		extensions: { has: vi.fn(() => hasHalfFloat), get: vi.fn(), init: vi.fn() },
		getPixelRatio: () => 1,
		getRenderTarget: () => target,
		setRenderTarget: vi.fn((next) => {
			target = next
		}),
		render: vi.fn(),
		dispose: vi.fn(),
		toneMapping: ReinhardToneMapping,
		toneMappingExposure: 1.7,
	}
	return {
		renderer: renderer as WebGLRenderer,
		bgTexture: new Texture(),
		starTexture: new Texture(),
	}
}

function getCreatedVolume() {
	const volume = vi.mocked(createAccretionVolumeTexture).mock.results[0]?.value
	if (!(volume instanceof Data3DTexture)) {
		throw new Error('Missing generated accretion volume')
	}
	return volume
}

function getDisplayMesh(composer: EffectComposer) {
	const pass = composer.passes.find(
		(candidate) => candidate instanceof RenderPass,
	)
	const mesh = pass?.scene.children.find((child) => child instanceof Mesh)
	if (!(mesh instanceof Mesh) || !(mesh.material instanceof ShaderMaterial)) {
		throw new Error('Missing black hole display material')
	}
	return mesh as Mesh<PlaneGeometry, ShaderMaterial>
}

function getPostprocessTargets(
	composer: EffectComposer,
	bloom: UnrealBloomPass,
) {
	return [
		composer.renderTarget1,
		composer.renderTarget2,
		bloom.renderTargetBright,
		...bloom.renderTargetsHorizontal,
		...bloom.renderTargetsVertical,
	]
}

function getCreatedMaterials() {
	return [
		...new Set(
			vi
				.mocked(Material.prototype.setValues)
				.mock.contexts.filter(
					(value): value is Material => value instanceof Material,
				),
		),
	]
}
