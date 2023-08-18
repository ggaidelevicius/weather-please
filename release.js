/* eslint-disable no-console */
const fs = require('fs')

const args = process.argv.slice(2)
const manifestPath = args[0] || 'manifest.json'
const packagePath = args[1] || 'package.json'
const releaseType = args[2]

// Check if releaseType parameter is provided
if (!releaseType) {
  console.log('Enter the release type (\'major\', \'minor\', or \'patch\'): ')
  process.stdin.once('data', data => {
    const input = data.toString().trim()
    processReleaseType(input)
  })
} else {
  processReleaseType(releaseType)
}

function processReleaseType (releaseType) {
  const validReleaseTypes = ['major', 'minor', 'patch']

  if (!validReleaseTypes.includes(releaseType)) {
    console.log('Error: Invalid release type. Use \'major\', \'minor\', or \'patch\'.')
    process.exit(1)
  }

  const manifestContent = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'))
  const packageContent = JSON.parse(fs.readFileSync(packagePath, 'utf-8'))

  const currentVersion = manifestContent.version
  const [major, minor, patch] = currentVersion.split('.').map(part => parseInt(part))

  let newVersion
  switch (releaseType) {
    case 'major':
      newVersion = `${major + 1}.0.0`
      break
    case 'minor':
      newVersion = `${major}.${minor + 1}.0`
      break
    case 'patch':
      newVersion = `${major}.${minor}.${patch + 1}`
      break
  }

  manifestContent.version = newVersion
  packageContent.version = newVersion

  fs.writeFileSync(manifestPath, JSON.stringify(manifestContent, null, 4))
  fs.writeFileSync(packagePath, JSON.stringify(packageContent, null, 4))

  fs.copyFileSync(manifestPath, 'extension/manifest.json')

  console.log(`Version in manifest.json and package.json updated to: ${newVersion}`)
}
