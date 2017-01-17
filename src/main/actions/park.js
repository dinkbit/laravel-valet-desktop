// Native
import path from 'path'

// Packages
import {dir as isDirectory} from 'path-type'

// Ours
import {parkFolder} from '../api'
import {error as showError} from '../dialogs'
import notify from '../notify'

export default async folder => {
  process.env.BUSYNESS = 'parking'

  const dir = path.resolve(folder)

  notify({
    title: 'Parking folder...',
    body: 'Your folder is getting parked.'
  })

  let isDir

  try {
    isDir = await isDirectory(dir)
  } catch (err) {
    showError('Not able to test if item is a directory', err)
    return
  }

  if (!isDir) {
    showError('You can only park directories')
    return
  }

  try {
    await parkFolder(folder)
  } catch (err) {
    showError('Not able to park folder', err)
    return
  }

  process.env.BUSYNESS = 'ready'

  notify({
    title: 'Done parking your folder!',
    body: ''
  })
}
