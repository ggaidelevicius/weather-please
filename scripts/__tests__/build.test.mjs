// @vitest-environment node
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { expect, it } from 'vitest'

import { buildExtensionOutput } from '../build.mjs'
import { rootPath } from '../lib/root.mjs'

it('packages an enabled application identity rule for map tile requests', () => {
	const rootDirectory = fs.mkdtempSync(
		path.join(os.tmpdir(), 'weather-build-test-'),
	)
	try {
		for (const directory of ['out/_next', '_locales/en']) {
			fs.mkdirSync(path.join(rootDirectory, directory), { recursive: true })
		}
		for (const file of ['out/demo.html', 'out/favicon.png']) {
			fs.writeFileSync(path.join(rootDirectory, file), '')
		}
		for (const file of ['manifest.json', 'openstreetmap-tile-rules.json']) {
			fs.copyFileSync(path.join(rootPath, file), path.join(rootDirectory, file))
		}

		buildExtensionOutput({ rootDirectory })

		const extensionPath = path.join(rootDirectory, 'extension')
		const manifest = JSON.parse(
			fs.readFileSync(path.join(extensionPath, 'manifest.json'), 'utf8'),
		)
		expect(manifest.permissions).toContain(
			'declarativeNetRequestWithHostAccess',
		)
		expect(manifest.host_permissions).toContain(
			'https://tile.openstreetmap.org/*',
		)
		const resource = manifest.declarative_net_request.rule_resources.find(
			(resource) => resource.id === 'openstreetmap_tile_headers',
		)
		expect(resource.enabled).toBe(true)
		const rules = JSON.parse(
			fs.readFileSync(path.join(extensionPath, resource.path), 'utf8'),
		)
		expect(rules).toContainEqual(
			expect.objectContaining({
				action: {
					type: 'modifyHeaders',
					requestHeaders: [
						{
							header: 'User-Agent',
							operation: 'set',
							value: expect.stringContaining('WeatherPlease'),
						},
					],
				},
				condition: {
					urlFilter: '||tile.openstreetmap.org/',
					resourceTypes: ['image'],
				},
			}),
		)
	} finally {
		fs.rmSync(rootDirectory, { recursive: true, force: true })
	}
})
