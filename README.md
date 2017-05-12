# Gist Sync

[![Greenkeeper badge](https://badges.greenkeeper.io/jcblw/gist-sync.svg)](https://greenkeeper.io/)

[![Build Status](https://travis-ci.org/jcblw/gist-sync.svg?branch=master)](https://travis-ci.org/jcblw/gist-sync)

This is a lib that allows you to sync a directory to you github gist.

### Concept

This makes and updates `one file gists`. Add a file to your synced directory and it makes a gist. Edit a file in that directory and it updates that gist.

## Usage

```shell
npm install gist-sync
```

```javascript
import GistSync from 'gist-sync'

GistsSync.of('/Users/foo/example-path', {
  applicationToken: 'foobarqux', // a personal access token from github
  isWatching: true, // auto start watch
  setCache: (name, content) => Promise.resolve(), // set cache
  clearCache: () => Promise.resolve(), // set cache
  getCache: (name) => Promise.resolve('my-cache') // set cache
})
```
or the alternative new syntax

```javascript
new GistSync(dir, options)
```

#### Cache

You need to pass `setCache`, `clearCache`, and `getCache` to the options. This allows the program to have some persistence of data. You can use just about anything for storage. Event just memory :D. The functions allow for `async` operations. All you need to do is return a `Promise`. This is the case for all three methods. Eg.

```javascript
...
getCache (key) {
  return new Promise((resolve, reject) => {
    db.lookup(key, (err, resp) => {
      if (err) return reject(err)
      resolve(resp)
    })
  })
}  
...
```

#### Methods

**`pauseWatcher`** will stop the watcher from watching the directory for file changes. This will then stop syncing the files

```javascript
gistSync.pauseWatcher()
```

**`resumeWatcher`** will resume the watcher to watch the directory for file changes. This will then start syncing the files.

> If you dont pass `true` to isWatching you will not sync files till calling `resumeWatcher`

```javascript
gistSync.resumeWatcher()
```

## Contributing

Just one run `npm test` before making a PR.

## Roadmap

- Some type of polling for changes that are pushed to github and updating file cache
- turn into a binary and all for command line usage
- ideas? make a issue
