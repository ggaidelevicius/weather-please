import fs from 'fs-extra'

const readJson = ({ filePath }) => fs.readJsonSync(filePath)

const writeJson = ({ filePath, data }) => {
	fs.writeJsonSync(filePath, data, { spaces: 2 })
}

export { readJson, writeJson }
