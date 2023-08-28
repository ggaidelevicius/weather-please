/* eslint-disable no-console */
const fs = require('fs')
const path = require('path')
const AdmZip = require('adm-zip')

const EXTENSION_DIR = 'extension'
MANIFEST_PATH = 'manifest.json'
PACKAGE_PATH = 'package.json'

const args = process.argv.slice(2)
const releaseType = args[0]

if (!releaseType) {
  console.log('Enter the release type (\'major\', \'minor\', or \'patch\'): ')
  process.stdin.once('data', (data) => {
    const input = data.toString().trim()
    processReleaseType(input)
  })
} else {
  processReleaseType(releaseType)
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
      items.forEach(item => {
        const itemPath = path.join(folderPath, item)
        if (fs.statSync(itemPath).isDirectory()) {
          addFolderContentsToZip(itemPath, path.join(zipFolderPath, item))
        } else if (path.extname(item).toLowerCase() !== '.zip') {
          zip.addFile(path.join(zipFolderPath, item), fs.readFileSync(itemPath))
        }
      })
    }
  }

  addFolderContentsToZip(contentPath)

  zip.writeZip(zipName)
  fs.renameSync(zipName, path.join(EXTENSION_DIR, zipName))
}

const addAttributesToManifest = (attributes) => {
  const manifestContent = JSON.parse(fs.readFileSync(path.join(EXTENSION_DIR, MANIFEST_PATH), 'utf-8'))
  Object.assign(manifestContent, attributes)
  fs.writeFileSync(path.join(EXTENSION_DIR, MANIFEST_PATH), JSON.stringify(manifestContent, null, 2))
}

const removeAttributesFromManifest = (attributes) => {
  const manifestContent = JSON.parse(fs.readFileSync(path.join(EXTENSION_DIR, MANIFEST_PATH), 'utf-8'))
  attributes.forEach(attribute => {
    delete manifestContent[attribute]
  })
  fs.writeFileSync(path.join(EXTENSION_DIR, MANIFEST_PATH), JSON.stringify(manifestContent, null, 2))
}

const modifyManifest = (attributesToAdd, attributesToRemove) => {
  if (attributesToAdd && Object.keys(attributesToAdd).length > 0) {
    addAttributesToManifest(attributesToAdd)
  }

  if (attributesToRemove && attributesToRemove.length > 0) {
    removeAttributesFromManifest(attributesToRemove)
  }
}

const processReleaseType = (releaseType) => {
  const validReleaseTypes = ['major', 'minor', 'patch']
  if (!validReleaseTypes.includes(releaseType)) {
    console.log('Error: Invalid release type. Use \'major\', \'minor\', or \'patch\'.')
    process.exit(1)
  }

  const manifestContent = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf-8'))
  const packageContent = JSON.parse(fs.readFileSync(PACKAGE_PATH, 'utf-8'))

  const newVersion = bumpVersion(manifestContent.version, releaseType)

  manifestContent.version = newVersion
  packageContent.version = newVersion

  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifestContent, null, 2))
  fs.writeFileSync(PACKAGE_PATH, JSON.stringify(packageContent, null, 2))

  console.log(`Version in manifest.json and package.json updated to: ${newVersion}`)

  modifyManifest({ version: newVersion }, [])
  processZipCreation(EXTENSION_DIR, newVersion, '')

  modifyManifest({
    'browser_specific_settings': {
      'gecko': {
        'id': 'addon@example.com',
      },
    },
  }, [])
  processZipCreation(EXTENSION_DIR, newVersion, '-firefox')

  modifyManifest({}, ['browser_specific_settings'])

  packageSource()
  process.exit(0)
}

const processZipCreation = (contentPath, newVersion, fileNameSuffix) => {
  const zip = new AdmZip()
  createZipWithContents(zip, contentPath, `weather-please-${newVersion}${fileNameSuffix}.zip`)
}

const packageSource = () => {
  const zip = new AdmZip()

  // function to recursively add files and folders to the zip
  const addContentToZip = (dir, zipDir) => {
    const entries = fs.readdirSync(dir)

    entries.forEach(entry => {
      const fullPath = path.join(dir, entry)
      const zipPath = path.join(zipDir, entry)

      if (fs.statSync(fullPath).isDirectory()) {
        // add the directory itself (for empty folders too)
        zip.addFile(zipPath + '/', Buffer.alloc(0))

        // recursively add its content
        addContentToZip(fullPath, zipPath)
      } else if (!fullPath.includes('extension') && path.extname(fullPath) !== '.zip') {
        zip.addLocalFile(fullPath, zipDir)
      }
    })
  }

  // add all FILES from the root directory
  fs.readdirSync('./').forEach(file => {
    const fullPath = path.join('./', file)
    if (fs.statSync(fullPath).isFile() && path.extname(fullPath) !== '.zip') {
      zip.addLocalFile(fullPath)
    }
  })

  // add "src" and "public" folders, preserving their structure
  addContentToZip('./src', 'src')
  addContentToZip('./public', 'public')

  const zipFileName = 'src.zip'
  zip.writeZip(zipFileName)
  fs.renameSync(zipFileName, path.join(EXTENSION_DIR, zipFileName))
}
