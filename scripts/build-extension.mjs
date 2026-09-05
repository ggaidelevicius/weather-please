import { spawnSync } from 'node:child_process'
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { config } from 'dotenv'
import fs from 'fs-extra'

import { buildExtensionOutput } from './build.mjs'
import { rootPath } from './lib/root.mjs'
import { getSourceFiles } from './lib/source-archive.mjs'

const pnpmCommand = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm'
const stage = mkdtempSync(path.join(tmpdir(), 'weather-please-build-'))

const runCommand = (args, env) => {
	const result = spawnSync(pnpmCommand, args, {
		cwd: stage,
		env,
		stdio: 'inherit',
	})
	if (result.error) throw result.error
	if (result.status !== 0) {
		throw new Error(
			`Build command failed (${result.signal ?? result.status}): ${args.join(' ')}`,
		)
	}
}

try {
	config({
		path: [
			'.env.production.local',
			'.env.local',
			'.env.production',
			'.env',
		].map((file) => path.join(rootPath, file)),
		quiet: true,
	})
	for (const file of getSourceFiles()) {
		fs.copySync(path.join(rootPath, file), path.join(stage, file))
	}
	// MV3 requires Pages Router's external bootstrap scripts. Exclude the
	// server-only App Router in the staging directory, leaving the checkout intact.
	fs.removeSync(path.join(stage, 'src', 'app'))
	fs.symlinkSync(
		path.join(rootPath, 'node_modules'),
		path.join(stage, 'node_modules'),
		'junction',
	)
	const env = {
		...process.env,
		DATABASE_URL:
			process.env.DATABASE_URL || 'postgresql://localhost:5432/weather_please',
		WEATHER_PLEASE_BUILD_TARGET: 'extension',
		NEXT_PUBLIC_WEATHER_PLEASE_BUILD_TARGET: 'extension',
	}
	runCommand(['exec', 'prisma', 'generate'], env)
	runCommand(['exec', 'next', 'build', '--webpack'], env)
	buildExtensionOutput({ rootDirectory: stage })
	fs.moveSync(path.join(stage, 'extension'), path.join(rootPath, 'extension'), {
		overwrite: true,
	})
} catch (error) {
	console.error('Build failed:', error)
	process.exitCode = 1
} finally {
	fs.removeSync(stage)
}
