// Native
import path from 'path'

// Packages
import test from 'ava'
import {Application} from 'spectron'

let app

test.before(async () => {
  app = new Application({
    path: path.join(__dirname, '../dist/mac/Valet.app/Contents/MacOS/Valet'),
    env: {
      TESTING: true
    }
  })

  await app.start()
})

test.after(async () => {
  await app.stop()
})

test('check window count', async t => {
  await app.client.waitUntilWindowLoaded()
  t.is(await app.client.getWindowCount(), 4)
})

test('see if dev tools are open', async t => {
  await app.client.waitUntilWindowLoaded()
  t.false(await app.browserWindow.isDevToolsOpened())
})
