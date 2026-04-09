import { spawnSync } from 'child_process'

import { buildExtensionOutput } from './build.mjs'
import { setCwdToRoot } from './lib/root.mjs'
import { renameAppDir } from './renameAppDir.mjs'

setCwdToRoot()

const pnpmCommand = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm'

const runCommand = (command, args) => {
	const result = spawnSync(command, args, {
		cwd: process.cwd(),
		stdio: 'inherit',
	})

	if (result.error) {
		throw result.error
	}

	if (typeof result.status === 'number' && result.status !== 0) {
		throw new Error(
			`${command} ${args.join(' ')} exited with code ${result.status}`,
		)
	}
}

const main = async () => {
	let renamed = false

	try {
		await renameAppDir('rename')
		renamed = true

		runCommand(pnpmCommand, ['exec', 'next', 'build'])
		buildExtensionOutput()
	} finally {
		if (renamed) {
			await renameAppDir('restore')
		}
	}
}

main().catch((error) => {
	console.error('Build failed:', error)
	process.exitCode = 1
})
