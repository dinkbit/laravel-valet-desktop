// Native
import path from 'path'

// Packages
import {clipboard, shell} from 'electron'
import Cache from 'electron-config'
import {dir as isDirectory} from 'path-type'

// Ours
import {linkApp} from '../api'
import {error as showError} from '../dialogs'
import notify from '../notify'

export default async folder => {
  process.env.BUSYNESS = 'linking'

  const dir = path.resolve(folder)

  notify({
    title: 'Linking folder...',
    body: 'Your app folder is getting linked.'
  })

  let isDir

  try {
    isDir = await isDirectory(dir)
  } catch (err) {
    showError('Not able to test if item is a directory', err)
    return
  }

  if (!isDir) {
    showError('You can only link directories')
    return
  }

  let app

  try {
    app = await linkApp(folder)
  } catch (err) {
    showError('Not able to link app folder', err)
    return
  }

  const cache = new Cache()
  const domain = cache.get('valet.cache.domain')

  const url = `http://${app.name}.${domain}`

  // Open the URL in the default browser
  shell.openExternal(url)

  process.env.BUSYNESS = 'ready'

  notify({
    title: 'Done linking your app!',
    body: 'Opening the URL in your browser...',
    url
  })

  // Copy app URL to clipboard
  clipboard.writeText(url)

  // Let the user now
  notify({
    title: 'Added',
    body: 'Your clipboard already contains the URL.',
    url
  })
}
