// Packages
import {dialog} from 'electron'

// Ours
import linking from './actions/link'
import parking from './actions/park'

const showDialog = details => {
  const filePath = dialog.showOpenDialog(details)

  if (filePath) {
    return filePath[0]
  }

  return false
}

export async function park(tray) {
  const info = {
    title: 'Select a folder to park',
    properties: [
      'openDirectory'
    ],
    buttonLabel: 'Park'
  }

  tray.setHighlightMode('always')
  const path = showDialog(info)
  tray.setHighlightMode('never')

  if (!path) {
    return
  }

  try {
    await parking(path)
  } catch (err) {
    error('Not able to park folder', err)
  }
}

export async function link(tray) {
  const info = {
    title: 'Select a folder to link',
    properties: [
      'openDirectory'
    ],
    buttonLabel: 'Link'
  }

  tray.setHighlightMode('always')
  const path = showDialog(info)
  tray.setHighlightMode('never')

  if (path) {
    try {
      await linking(path)
    } catch (err) {
      error('Not able to link folder', err)
    }
  }
}

export function error(detail, trace, win) {
  dialog.showMessageBox(win || null, {
    type: 'error',
    message: 'An Error Occurred',
    detail,
    buttons: []
  })
}
