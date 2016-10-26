import fs from 'fs'

export function readFile (path) {
  return new Promise((resolve, reject) => {
    fs.readFile(path, (err, content) => {
      if (err) return reject(err)
      resolve(content)
    })
  })
}
