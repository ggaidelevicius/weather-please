// @vitest-environment node
import AdmZip from 'adm-zip'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { expect, it } from 'vitest'

import { createSourceArchive } from '../lib/source-archive.mjs'

it('packages build inputs without local secrets, generated files, or symlinks', () => {
	const rootDirectory = fs.mkdtempSync(
		path.join(os.tmpdir(), 'weather-source-test-'),
	)
	try {
		for (const file of [
			'package.json',
			'scripts/build-extension.mjs',
			'prisma/schema.prisma',
			'_locales/en/messages.json',
			'src/pages/demo.tsx',
			'src/generated/prisma/client.ts',
			'.env',
			'.env.local',
			'.env.production',
			'.npmrc',
			'private.pem',
			'.env.example',
		]) {
			fs.mkdirSync(path.dirname(path.join(rootDirectory, file)), {
				recursive: true,
			})
			fs.writeFileSync(path.join(rootDirectory, file), file)
		}
		fs.symlinkSync(
			path.join(rootDirectory, '.env'),
			path.join(rootDirectory, 'src', 'linked-secret'),
		)
		const archive = createSourceArchive({ rootDirectory })
		const zip = new AdmZip(archive)
		expect(
			zip
				.getEntries()
				.map((entry) => entry.entryName)
				.sort(),
		).toEqual([
			'.env.example',
			'_locales/en/messages.json',
			'package.json',
			'prisma/schema.prisma',
			'scripts/build-extension.mjs',
			'src/pages/demo.tsx',
		])
		expect(zip.readAsText('scripts/build-extension.mjs')).toBe(
			'scripts/build-extension.mjs',
		)
	} finally {
		fs.rmSync(rootDirectory, { recursive: true, force: true })
	}
})
