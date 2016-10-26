
export const serializeSingleFileGist = (filename, content, gist = {}) => {
  return Object.assign({}, gist, {
    files: { [filename]: { filename, content } }
  })
}

export const parseSingleFileFromGist = (gist = {}) => {
  const files = gist.files || {}
  const filename = Object.keys(files)[0] || ''
  const content = (files[filename] || {}).content || ''
  return { filename, content }
}

const buildFilenameIndex = (gists) => {
  return gists.reduce((accum, gist) => {
    const { filename } = parseSingleFileFromGist(gist)
    accum[filename] = gist
    return accum
  }, {})
}

// this is a thunk, to allow for locking in cache
export const getGistByFileName = (gists) => {
  const gistByFilename = buildFilenameIndex(gists)
  return (filename) => gistByFilename[filename]
}
