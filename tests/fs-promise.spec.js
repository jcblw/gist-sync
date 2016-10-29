import test from 'ava'
import {readFile, writeFile} from '../dist/fs-promise'
import fs from 'fs'

const rando = () => Math.floor(Math.random() * 1000)
const randomName = () => `${rando()}-${rando()}`

// readFile

test('readFile import', (t) => {
  t.is(typeof readFile, 'function', 'the readFile import is an function')
})

test('readFile returns promise', (t) => {
  t.is(
    typeof readFile('./scaffold/foo.txt').then,
    'function',
    'readFile will return a promise when called'
  )
})

test(`
  readFile promise resolves to the content of the file
  when passed a valid file path
`, async (t) => {
  t.plan(1)
  const content = await readFile('./scaffold/foo.txt')
  t.is(content.toString('utf8').trim(), 'foo', 'the correct content is passed to the resolve')
})

test(`
  readFile promise rejects when passed a invalid file path
`, (t) => {
  t.throws(
    readFile('./scaffold/qux.txt'),
    /ENOENT/g,
    'Cannot file error is thrown'
  )
})

// writeFile

test('writeFile import', (t) => {
  t.is(typeof writeFile, 'function', 'the writeFile import is an function')
})

test('writeFile returns promise', (t) => {
  const file = `./scaffold/${randomName()}.txt`
  const content = randomName()
  t.is(
    typeof writeFile(file, content).then,
    'function',
    'writeFile will return a promise when called'
  )
  fs.unlink(file)
})

test('writeFile resolve', async(t) => {
  const file = `./scaffold/${randomName()}.txt`
  const content = randomName()
  t.plan(1)
  const ret = await writeFile(file, content)
  t.is(ret, undefined, 'nothing is resolved to when it is success full')
  fs.unlink(file)
})

test('writeFile correct data written', async t => {
  const file = `./scaffold/${randomName()}.txt`
  const content = randomName()
  t.plan(1)
  await writeFile(file, content)
  const fileContent = await readFile(file)
  t.is(fileContent.toString('utf8'), content, 'the correct content is resolved')
  fs.unlink(file)
})

test('writeFile will throw when passed a bad first param', t => {
  t.throws(
    writeFile(undefined),
    /path/g,
    'a bad first param caused the write file to throw error'
  )
})
