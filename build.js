/* eslint-disable no-console */
const fs = require('fs-extra')
const glob = require('glob')
const { execSync } = require('child_process')
const os = require('os')
const path = require('path')

const moveCommand = os.platform() === 'win32' ? 'move' : 'mv'
const sourcePath = 'out/_next'
const destinationPath = 'out/next'

try {
  execSync(`${moveCommand} ${sourcePath} ${destinationPath}`)
  console.log('Moved _next directory to next.')
} catch (error) {
  console.error('Move operation failed:', error)
}

const main = () => {
  const extensionPath = 'extension'

  // Remove the 'extension' directory if it exists
  if (fs.existsSync(extensionPath)) {
    fs.removeSync(extensionPath)
  }

  // Replace content in HTML and JS files
  const files = glob.sync('out/**/*.{html,js}', { nodir: true })
  for (const file of files) {
    let content = fs.readFileSync(file, 'utf-8')
    content = content.replace(/\/_next\//g, '/next/')
    fs.writeFileSync(file, content, 'utf-8')
  }

  // Create a new 'extension' directory
  fs.mkdirSync(extensionPath)

  // Perform related operations
  fs.moveSync(path.join('out', 'index.html'), path.join(extensionPath, 'index.html'))
  fs.moveSync(path.join('out', 'favicon.png'), path.join(extensionPath, 'favicon.png'))
  fs.copySync(path.join('out', 'next'), path.join(extensionPath, 'next'))
  fs.removeSync('out')
  fs.copySync('manifest.json', path.join(extensionPath, 'manifest.json'))

  console.log('Processing completed.')
}

try {
  main()
} catch (error) {
  console.error('An error occurred:', error)
}
