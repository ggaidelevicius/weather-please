import AdmZip from 'adm-zip'
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

import { createSourceArchive } from './lib/source-archive.mjs'

const directory = fs.mkdtempSync(
	path.join(os.tmpdir(), 'weather-source-build-'),
)
const pnpmCommand = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm'

try {
	const archive = createSourceArchive({
		destination: path.join(directory, 'src.zip'),
	})
	const checkout = path.join(directory, 'source')
	new AdmZip(archive).extractAllTo(checkout)
	for (const args of [['install', '--frozen-lockfile'], ['build']]) {
		const result = spawnSync(pnpmCommand, args, {
			cwd: checkout,
			stdio: 'inherit',
			env: { ...process.env, HUSKY: '0' },
		})
		if (result.error) throw result.error
		if (result.status !== 0)
			throw new Error(
				`Source archive verification failed: ${args.join(' ')} (${result.signal ?? result.status})`,
			)
	}
	console.log('The source archive installs and builds independently.')
} catch (error) {
	console.error(error)
	process.exitCode = 1
} finally {
	fs.rmSync(directory, { recursive: true, force: true })
}
