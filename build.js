/* eslint-disable no-console */
const fs = require('fs-extra')
const glob = require('glob')

async function main () {
  const extensionPath = 'extension'

  // Remove the 'extension' directory if it exists
  await fs.remove(extensionPath)

  // Replace content in HTML and JS files
  const files = glob.sync('out/**/*.{html,js}', { nodir: true })
  for (const file of files) {
    let content = await fs.readFile(file, 'utf-8')
    content = content.replace(/\/_next\//g, '/next/')
    await fs.writeFile(file, content, 'utf-8')
  }

  // Create a new 'extension' directory
  await fs.mkdir(extensionPath)

  // Move index.html and favicon.png to the 'extension' directory
  await fs.move('out/index.html', `${extensionPath}/index.html`)
  await fs.move('out/favicon.png', `${extensionPath}/favicon.png`)

  // Copy 'next' directory contents
  await fs.copy('out/next', `${extensionPath}/next`)

  // Remove the 'out' directory
  await fs.remove('out')

  // Copy manifest.json to the 'extension' directory
  await fs.copy('manifest.json', `${extensionPath}/manifest.json`)

  console.log('Processing completed.')
}

main().catch(error => console.error('An error occurred:', error))
