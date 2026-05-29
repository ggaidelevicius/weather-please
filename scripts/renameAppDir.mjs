import fs from 'fs-extra'
import path from 'path'
import { fileURLToPath } from 'url'

import { rootPath } from './lib/root.mjs'

/**
 * Why this exists: the extension build needs Pages Router output, not App
 * Router output.
 *
 * The extension's new tab runs under the MV3 default Content Security Policy
 * (`script-src 'self'`), which forbids inline `<script>` execution. App Router's
 * static export emits inline, executable bootstrap and RSC "flight" scripts
 * (e.g. `self.__next_f.push(...)`), so the browser blocks them and the page
 * never hydrates. Pages Router instead keeps page data in a non-executable
 * `<script type="application/json" id="__NEXT_DATA__">` block and loads behavior
 * from external chunks, which satisfy `'self'`.
 *
 * `src/app` exists only for the Vercel-hosted bug page + server action. During
 * the extension build we move `src/app` -> `src/_app` so Next builds Pages
 * Router only, then restore it afterwards so Vercel still sees `app/`.
 *
 * This is deliberate — do not "simplify" it away. The only alternative is a
 * post-export transform that externalizes App Router's inline scripts, which
 * couples the build to Next's internal HTML emission format (fragile across
 * upgrades) for no runtime benefit on a fully client-side page.
 */
const srcAppPath = path.join(rootPath, 'src', 'app')
const destAppPath = path.join(rootPath, 'src', '_app')

const validateAction = (action) => {
	if (action !== 'rename' && action !== 'restore') {
		throw new Error(`Invalid action: ${action}`)
	}
}

export async function renameAppDir(action) {
	validateAction(action)

	if (action === 'rename') {
		if (!(await fs.pathExists(srcAppPath))) {
			throw new Error(`'src/app' does not exist`)
		}
		if (await fs.pathExists(destAppPath)) {
			throw new Error(`'src/_app' already exists`)
		}

		await fs.rename(srcAppPath, destAppPath)
		console.log(`Renamed 'src/app' to 'src/_app'`)
		return
	}

	if (!(await fs.pathExists(destAppPath))) {
		throw new Error(`'src/_app' does not exist`)
	}
	if (await fs.pathExists(srcAppPath)) {
		throw new Error(`'src/app' already exists`)
	}

	await fs.rename(destAppPath, srcAppPath)
	console.log(`Renamed 'src/_app' back to 'src/app'`)
}

const isCliInvocation =
	process.argv[1] &&
	path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)

if (isCliInvocation) {
	const action = process.argv[2]
	renameAppDir(action).catch((error) => {
		console.error(`Error during renaming:`, error)
		process.exitCode = 1
	})
}
