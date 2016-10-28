import fs from 'fs'

export function readFile (path) {
  return new Promise((resolve, reject) => {
    fs.readFile(path, (err, content) => {
      if (err) return reject(err)
      resolve(content)
    })
  })
}

export function writeFile (path, content) {
  return new Promise((resolve, reject) => {
    fs.writeFile(path, content, (err) => {
      if (err) return reject(err)
      resolve()
    })
  })
}
