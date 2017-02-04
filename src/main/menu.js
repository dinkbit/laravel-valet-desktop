// Packages
import {shell, clipboard} from 'electron'

// Ours
import {park, link} from './dialogs'
import {removeLinked, removeParked} from './actions/remove'
import notify from './notify'
import toggleWindow from './utils/toggle-window'

export function mapParked(parked) {
  return {
    label: parked,
    submenu: [
      {
        label: 'Unpark',
        async click() {
          await removeParked(parked)
        }
      }
    ]
  }
}

export function mapLink(link) {
  const url = 'http://' + link.name + '.dev'

  return {
    label: link.name,
    submenu: [
      {
        label: 'Open in Browser...',
        click: () => shell.openExternal(url)
      },
      {
        label: 'Copy URL to Clipboard',
        click() {
          clipboard.writeText(url)

          // Let the user know
          notify({
            title: 'Copied to clipboard',
            body: 'Your clipboard now contains the URL of your linked site.',
            url
          })
        }
      },
      {
        type: 'separator'
      },
      {
        label: 'Unlink',
        async click() {
          await removeLinked(link)
        }
      }
    ]
  }
}

export async function innerMenu(app, tray, data, windows) {
  let hasLinks = false
  let hasParked = false

  if (Array.isArray(data.links) && data.links.length > 0) {
    hasLinks = true
  }

  if (Array.isArray(data.parked) && data.parked.length > 0) {
    hasParked = true
  }

  return [
    {
      label: 'Park...',
      accelerator: 'CmdOrCtrl+P',
      async click() {
        await park(tray)
      }
    },
    {
      label: 'Link...',
      accelerator: 'CmdOrCtrl+L',
      async click() {
        await link(tray)
      }
    },
    {
      type: 'separator'
    },
    {
      label: 'Parked',

      // We need this because electron otherwise keeps the item alive
      // Even if the submenu is just an empty array
      type: hasParked ? 'submenu' : 'normal',

      submenu: hasParked ? data.parked : [],
      visible: hasParked
    },
    {
      label: 'Linked',

      // We need this because electron otherwise keeps the item alive
      // Even if the submenu is just an empty array
      type: hasLinks ? 'submenu' : 'normal',

      submenu: hasLinks ? data.links : [],
      visible: hasLinks
    },
    {
      type: 'separator'
    },
    {
      label: process.platform === 'darwin' ? `About ${app.getName()}` : 'About',
      click() {
        toggleWindow(null, windows.about)
      }
    },
    {
      label: 'Preferences...',
      accelerator: 'CmdOrCtrl+,',
      click() {
        toggleWindow(null, windows.preferences)
      }
    },
    {
      label: 'Quit',
      click: app.quit,
      role: 'quit'
    }
  ]
}

export function outerMenu(app, windows) {
  return [
    {
      label: process.platform === 'darwin' ? `About ${app.getName()}` : 'About',
      click() {
        toggleWindow(null, windows.about)
      }
    },
    {
      type: 'separator'
    },
    {
      label: 'Preferences...',
      accelerator: 'CmdOrCtrl+,',
      click() {
        toggleWindow(null, windows.preferences)
      }
    },
    {
      label: 'Quit',
      role: 'quit'
    }
  ]
}
