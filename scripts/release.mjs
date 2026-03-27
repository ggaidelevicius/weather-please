import AdmZip from 'adm-zip'
import fs from 'fs'
import path from 'path'

import { readJson, writeJson } from './lib/json.mjs'
import { setCwdToRoot } from './lib/root.mjs'

setCwdToRoot()

const EXTENSION_DIR = 'extension'
const MANIFEST_PATH = 'manifest.json'
const PACKAGE_PATH = 'package.json'
const EXTENSION_MANIFEST_PATH = path.join(EXTENSION_DIR, MANIFEST_PATH)

const args = process.argv.slice(2)
const releaseType = args[0]

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

	writeExtensionManifest(baseExtensionManifest)

	packageSource()
	process.exit(0)
}

const processZipCreation = (contentPath, newVersion, fileNameSuffix) => {
	const zip = new AdmZip()
	createZipWithContents(
		zip,
		contentPath,
		`weather-please-${newVersion}${fileNameSuffix}.zip`,
	)
}

const packageSource = () => {
	const zip = new AdmZip()

	// function to recursively add files and folders to the zip
	const addContentToZip = (dir, zipDir) => {
		const entries = fs.readdirSync(dir)

		entries.forEach((entry) => {
			const fullPath = dir + '/' + entry
			const zipPath = zipDir + '/' + entry

			if (fs.statSync(fullPath).isDirectory()) {
				// add the directory itself (for empty folders too)
				zip.addFile(zipPath + '/', Buffer.alloc(0))

				// recursively add its content
				addContentToZip(fullPath, zipPath)
			} else if (
				!fullPath.includes('extension') &&
				fullPath.slice(-4) !== '.zip'
			) {
				zip.addLocalFile(fullPath, zipDir)
			}
		})
	}

	// add all FILES from the root directory
	fs.readdirSync('./').forEach((file) => {
		const fullPath = './' + file
		if (
			fs.statSync(fullPath).isFile() &&
			fullPath.slice(-4) !== '.zip' &&
			fullPath !== './.env.local'
		) {
			zip.addLocalFile(fullPath)
		}
	})

	// add 'src' and 'public' folders, preserving their structure
	addContentToZip('./src', 'src')
	addContentToZip('./public', 'public')

	const zipFileName = 'src.zip'
	zip.writeZip(zipFileName)
	fs.renameSync(zipFileName, EXTENSION_DIR + '/' + zipFileName)
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
