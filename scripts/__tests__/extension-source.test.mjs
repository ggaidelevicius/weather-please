// @vitest-environment node
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { expect, it } from 'vitest'

import { getExtensionSourceFiles } from '../lib/extension-source.mjs'

it('selects only the demo page and its wrappers without changing the source files', () => {
	const rootDirectory = fs.mkdtempSync(
		path.join(os.tmpdir(), 'weather-extension-source-test-'),
	)
	const retainedFiles = [
		'next.config.ts',
		'package.json',
		'prisma/schema.prisma',
		'public/favicon.png',
		'scripts/build-extension.mjs',
		'src/app-config.ts',
		'src/features/weather/ui/weather.tsx',
		'src/pages/_app.tsx',
		'src/pages/_document.tsx',
		'src/pages/demo.tsx',
		'src/shared/app/example.ts',
		'src/styles/tailwind.css',
	]
	const excludedFiles = [
		'src/app/actions.ts',
		'src/app/bug/page.tsx',
		'src/app/layout.tsx',
		'src/pages/about.tsx',
		'src/pages/api/example.ts',
		'src/pages/demo/details.tsx',
		'src/pages/index.tsx',
		'src/pages/privacy.tsx',
	]
	const sourceFiles = [...retainedFiles, ...excludedFiles]
	try {
		for (const file of sourceFiles) {
			fs.mkdirSync(path.dirname(path.join(rootDirectory, file)), {
				recursive: true,
			})
			fs.writeFileSync(path.join(rootDirectory, file), file)
		}

		expect(getExtensionSourceFiles({ rootDirectory })).toEqual(
			[...retainedFiles].sort(),
		)
		for (const file of sourceFiles) {
			expect(fs.readFileSync(path.join(rootDirectory, file), 'utf8')).toBe(file)
		}
	} finally {
		fs.rmSync(rootDirectory, { force: true, recursive: true })
	}
})
