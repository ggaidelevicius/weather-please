import AdmZip from 'adm-zip'
import { spawnSync } from 'child_process'
import fs from 'fs'
import path from 'path'

import { readJson, writeJson } from './lib/json.mjs'
import { setCwdToRoot } from './lib/root.mjs'
import { createSourceArchive } from './lib/source-archive.mjs'

setCwdToRoot()

const EXTENSION_DIR = 'extension'
const MANIFEST_PATH = 'manifest.json'
const PACKAGE_PATH = 'package.json'
const EXTENSION_MANIFEST_PATH = path.join(EXTENSION_DIR, MANIFEST_PATH)

const args = process.argv.slice(2)
const releaseType = args[0]
const pnpmCommand = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm'

const buildRelease = () => {
	const result = spawnSync(pnpmCommand, ['build'], {
		cwd: process.cwd(),
		stdio: 'inherit',
	})
	if (result.error) throw result.error
	if (result.status !== 0)
		throw new Error(`Build failed: ${result.signal ?? result.status}`)
}

const bumpVersion = (currentVersion, releaseType) => {
	const [major, minor, patch] = currentVersion.split('.').map(Number)

	switch (releaseType) {
		case 'major':
			return `${major + 1}.0.0`
		case 'minor':
			return `${major}.${minor + 1}.0`
		case 'patch':
			return `${major}.${minor}.${patch + 1}`
		default:
			throw new Error('Invalid release type')
	}
}

const createZipWithContents = (zip, contentPath, zipName) => {
	const addFolderContentsToZip = (folderPath, zipFolderPath = '') => {
		const items = fs.readdirSync(folderPath)

		if (items.length === 0) {
			zip.addFile(zipFolderPath + '/', Buffer.alloc(0))
		} else {
			items.forEach((item) => {
				const itemPath = folderPath + '/' + item
				if (fs.statSync(itemPath).isDirectory()) {
					addFolderContentsToZip(
						itemPath,
						zipFolderPath ? zipFolderPath + '/' + item : item,
					)
				} else if (itemPath.slice(-4).toLowerCase() !== '.zip') {
					zip.addFile(
						zipFolderPath ? zipFolderPath + '/' + item : item,
						fs.readFileSync(itemPath),
					)
				}
			})
		}
	}

	addFolderContentsToZip(contentPath)

	zip.writeZip(zipName)
	fs.renameSync(zipName, EXTENSION_DIR + '/' + zipName)
}

const readExtensionManifest = () =>
	readJson({ filePath: EXTENSION_MANIFEST_PATH })

const writeExtensionManifest = (manifestContent) => {
	writeJson({ data: manifestContent, filePath: EXTENSION_MANIFEST_PATH })
}

const updateExtensionManifest = ({
	attributesToAdd = {},
	attributesToRemove = [],
	baseManifest,
}) => {
	const nextManifest = { ...baseManifest, ...attributesToAdd }

	for (const attribute of attributesToRemove) {
		delete nextManifest[attribute]
	}

	writeExtensionManifest(nextManifest)
	return nextManifest
}

const processReleaseType = (releaseType) => {
	const validReleaseTypes = ['major', 'minor', 'patch']
	if (!validReleaseTypes.includes(releaseType)) {
		console.log(
			"Error: Invalid release type. Use 'major', 'minor', or 'patch'.",
		)
		process.exit(1)
	}

	buildRelease()

	const manifestContent = readJson({ filePath: MANIFEST_PATH })
	const packageContent = readJson({ filePath: PACKAGE_PATH })

	const newVersion = bumpVersion(manifestContent.version, releaseType)

	manifestContent.version = newVersion
	packageContent.version = newVersion

	writeJson({ data: manifestContent, filePath: MANIFEST_PATH })
	writeJson({ data: packageContent, filePath: PACKAGE_PATH })

	console.log(
		`Version in manifest.json and package.json updated to: ${newVersion}`,
	)

	const extensionManifest = readExtensionManifest()
	const baseExtensionManifest = updateExtensionManifest({
		attributesToAdd: { version: newVersion },
		baseManifest: extensionManifest,
	})
	processZipCreation(EXTENSION_DIR, newVersion, '')

	processFirefoxRelease({ baseExtensionManifest, newVersion })

	createSourceArchive()
	process.exit(0)
}

const processFirefoxRelease = ({ baseExtensionManifest, newVersion }) => {
	try {
		updateExtensionManifest({
			attributesToAdd: {
				browser_specific_settings: {
					gecko: {
						id: '{9282bc49-b1b4-4f46-b135-1dfe00f182c9}',
					},
				},
			},
			attributesToRemove: ['background'],
			baseManifest: baseExtensionManifest,
		})
		processZipCreation(EXTENSION_DIR, newVersion, '-firefox')
	} finally {
		writeExtensionManifest(baseExtensionManifest)
	}
}

const processZipCreation = (contentPath, newVersion, fileNameSuffix) => {
	const zip = new AdmZip()
	createZipWithContents(
		zip,
		contentPath,
		`weather-please-${newVersion}${fileNameSuffix}.zip`,
	)
}

if (!releaseType) {
	console.log("Enter the release type ('major', 'minor', or 'patch'): ")
	process.stdin.once('data', (data) => {
		const input = data.toString().trim()
		processReleaseType(input)
	})
} else {
	processReleaseType(releaseType)
}
