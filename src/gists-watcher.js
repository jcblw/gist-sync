import chokidar from 'chokidar'

const eventMapping = {
  error: 'onError',
  change: 'onFileChanged',
  add: 'onFileAdded',
  deleted: 'onFileRemoved'
}

class GistsWatcher {
  constructor (pattern, options) {
    this.pattern = pattern
    this.options = options
    if (options.autostart) {
      this.createWatcher()
    }
  }

  bindWatcherEvents (watcher) {
    const { options } = this
    Object.keys(eventMapping).forEach(eventName => {
      const method = eventMapping[eventName]
      if (typeof options[method] !== 'function') return
      watcher.on(eventName, options[method])
    })
  }

  createWatcher () {
    this.destroyWatcher()
    this.watcher = chokidar.watch(
      this.pattern,
      this.options
    )
    this.bindWatcherEvents(this.watcher)
  }

  setPattern (pattern) {
    this.pattern = pattern
    this.createWatcher() // recreate watcher
  }

  setOptions (options) {
    Object.assign(this.options, options)
    this.createWatcher() // recreate watcher
  }

  destroyWatcher () {
    if (this.watcher && this.watcher.close) {
      this.watcher.close()
      this.watcher = null
    }
  }

  pause () {
    this.destroyWatcher()
  }

  resume () {
    this.createWatcher()
  }
}

module.exports = GistsWatcher
