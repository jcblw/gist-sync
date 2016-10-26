import path from 'path'
import assert from 'assert'
import autoBind from 'auto-bind'
import { EventEmitter2 } from 'eventemitter2'
import asyncCatch from 'async-fn-catch'
import { readFile } from './fs-promise'
import GistsWatcher from './gists-watcher'
import GistsApi from './gists-api'
import {
  serializeSingleFileGist,
  getGistByFileName
} from './gist-serializer'

class GistsSync extends EventEmitter2 {
  constructor (directory = '', options = {}) {
    super()
    autoBind(this)
    this.validateOptions(options)
    this.pattern = this.getPattern(directory)
    this.pollInterval = options.pollInterval
    this.options = options
    this.updateToken(options.applicationToken)
    // can probably make abstraction for this
    this.onFileChanged = asyncCatch(this.onFileChanged, this.onError)
    this.onFileAdded = asyncCatch(this.onFileAdded, this.onError)
    this.onFileRemoved = asyncCatch(this.onFileRemoved, this.onError)
    this.initialize = asyncCatch(this.initialize, this.onError)
    this.initialize()
  }

  static of (...args) { return new GistsSync(...args) }

  async initialize () {
    const gists = await this.getAllGist()
    this.getGistByFileName = getGistByFileName(gists)
    this.createWatcher()
    if (this.pollInterval) {
      this.startPolling()
    }
  }

  /*
    util methods - possibly move to helpers
  */

  getPattern (directory) {
    const dir = path.resolve(process.cwd(), directory)
    return `${dir}/`
  }

  hasFileUpdated (filename, content, existing) {
    if (!existing) return true
    const oldContent = existing.files[filename].content
    if (!oldContent) return true
    return oldContent !== content
  }

  async getFileDataFromPath (path) {
    const filename = path.split(/\//).pop()
    const fileContent = await readFile(path)
    const content = fileContent.toString('utf8') || '.'
    return { filename, content }
  }

  async hasExisting (filename) {
    return !!this.getGistByFileName(filename)
  }

  async updateGistInCache (gist) {
    const { setCache } = this.options
    const cachedGists = await this.getAllGist()
    const {login} = await this.getUser()
    const gists = [...cachedGists]
    const gistIndex = gists
      .reduce((c, g, i) => g.id === gist.id ? i : c, -1)
    if (gistIndex === -1) {
      gists.push(gist)
    } else {
      gists.splice(gistIndex, 1, gist)
    }
    await setCache(`${login}:gists`, gists)
    const freshGists = await this.getAllGist()
    this.getGistByFileName = getGistByFileName(freshGists)
  }

  /*
    methods dealing with setting or validating optoins
  */

  validateOptions ({
    setCache,
    clearCache,
    getCache,
    applicationToken
  }) {
    assert(typeof setCache === 'function', 'The GistSync class needs a way to set cache')
    assert(typeof clearCache === 'function', 'The GistSync class needs a way to clear cache')
    assert(typeof getCache === 'function', 'The GistSync class needs a way to getCache')
    assert(typeof applicationToken === 'string', 'The GistSync class needs a user token to access gists')
  }

  updateToken (token) { this.api = new GistsApi(token) }

  setPollInterval (num) {
    this.pollInterval = num
    this.stopPolling()
    if (this.pollInterval) {
      this.startPolling()
    }
  }

  setDirectory (directory) {
    this.pattern = this.getPattern(directory)
    this.watcher.setPattern(this.pattern)
  }

  /*
    methods dealing with creating/config watcher
  */

  createWatcher () {
    const {
      onError,
      onFileChanged,
      onFileAdded,
      onFileRemoved
    } = this
    this.watcher = new GistsWatcher(this.pattern, {
      autostart: this.options.isWatching,
      onError,
      onFileChanged,
      onFileAdded,
      onFileRemoved,
      // should make this more config right now just ignores
      // dotfiles
      ignored: (filepath) =>
        /(^[.#]|(?:__|~)$)/.test(path.basename(filepath))
    })
  }

  resumeWatcher () { this.watcher.resume() }

  pauseWatcher () { this.watcher.pause() }

  /*
    methods dealing with polling
  */

  async poll () {
    await this.getAllGists()
    this.startPolling() // keep polling
    return Promise.resolve()
  }

  stopPolling () {
    clearTimeout(this.pollTimeout)
  }

  startPolling () {
    this.stopPolling()
    this.pollTimeout(this.poll, this.pollInterval)
  }

  /*
    methods dealing with event handling of submodule
  */

  onError (err) { this.emit('error', err) }

  async onFileChanged (path) {
    const { filename, content } = await this.getFileDataFromPath(path)
    const existingGist = this.getGistByFileName(filename)

    if (!this.hasFileUpdated(filename, content, existingGist)) return

    const gist = serializeSingleFileGist(
      filename,
      content,
      existingGist
    )
    const resp = await this.api.updateGist(gist)
    if (resp.statusCode > 400) {
      return this.onError(new Error(`Unable to update gist: ${resp.body}`))
    }
    this.updateGistInCache(resp.body)
  }

  async onFileAdded (path, stat) {
    const { filename, content } = await this.getFileDataFromPath(path)
    const hasExisting = await this.hasExisting(filename)
    if (hasExisting) {
      return this.onFileChanged(path, stat)
    }
    const gist = serializeSingleFileGist(
      filename,
      content
    )
    const resp = await this.api.createGist(gist)
    if (resp.statusCode > 400) {
      return this.onError(new Error(`Unable to create gist: ${resp.body}`))
    }
    this.updateGistInCache(resp.body)
  }

  async onFileRemoved () {
    // TODO: Possibly do this?
  }

  /*
    methods dealing with fetching more data
  */

  async getUser () {
    const { getCache, applicationToken, setCache } = this.options
    let user = await getCache(applicationToken)
    if (!user) {
      const { body } = await this.api.getUser()
      user = body
      await setCache(applicationToken, user)
    }
    return user
  }

  async getAllGist () {
    const { setCache, getCache } = this.options
    const {login} = await this.getUser()
    let gists = await getCache(`${login}:gists`)
    if (!gists) {
      const { body } = await this.api.getAllGists({login})
      gists = body
      await setCache(`${login}:gists`, gists)
      this.getGistByFileName = getGistByFileName(gists)
    }
    return gists
  }
}

module.exports = GistsSync
