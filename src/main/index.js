// Packages
import {app, Tray, Menu, BrowserWindow, ipcMain, dialog} from 'electron'
import ms from 'ms'
import Config from 'electron-config'
import isDev from 'electron-is-dev'
import {dir as isDirectory} from 'path-type'
import fixPath from 'fix-path'
import log from 'electron-log'
import {resolve as resolvePath} from 'app-root-path'
import firstRun from 'first-run'

// Ours
import {innerMenu, outerMenu, mapLink, mapParked} from './menu'
import {error as showError} from './dialogs'
import link from './actions/link'
import park from './actions/park'
import {refreshCache} from './api'
import attachTrayState from './utils/highlight'
import toggleWindow from './utils/toggle-window'

// Log uncaught exceptions to a file
// Locations: megahertz/electron-log
process.on('uncaughtException', log.info)

const isPlatform = name => {
  let handle

  switch (name) {
    case 'windows':
      handle = 'win32'
      break
    case 'macOS':
      handle = 'darwin'
      break
    default:
      handle = name
  }

  return process.platform === handle
}

// Prevent garbage collection
// Otherwise the tray icon would randomly hide after some time
let tray = null

// Hide dock icon before the app starts
if (isPlatform('macOS')) {
  app.dock.hide()
}

// Define the application name
app.setName('Laravel Valet')

// Make Now start automatically on login
if (!isDev && firstRun()) {
  app.setLoginItemSettings({
    openAtLogin: true
  })
}

// We need this method in the renderer process
// So that we can load all data after the user has logged in
// And before he opens the context menu
global.refreshCache = refreshCache

global.isDev = isDev

// Share these  between renderer process and the main one
global.errorHandler = showError

// Make the error handler kill the app
global.appInstance = app

// Makes sure where inheriting the correct path
// Within the bundled app, the path would otherwise be different
fixPath()

// Keep track of the app's busyness for telling
process.env.BUSYNESS = 'ready'

// Make sure that unhandled errors get handled
process.on('uncaughtException', err => {
  console.error(err)
  showError('Unhandled error appeared', err)
})

const config = new Config()

// For starting the refreshment right after login
global.startRefresh = welcomeWindow => {
  const timeSpan = ms('10s')

  // Periodically rebuild local cache every 10 seconds
  const interval = setInterval(async () => {
    await refreshCache(null, app, welcomeWindow, interval)
  }, timeSpan)
}

const welcomeWindow = () => {
  const win = new BrowserWindow({
    width: 650,
    height: 430,
    title: 'Welcome to Laravel Valet',
    resizable: false,
    center: true,
    frame: isPlatform('windows'),
    show: false,
    fullscreenable: false,
    maximizable: false,
    titleBarStyle: 'hidden-inset',
    backgroundColor: '#fff'
  })

  win.loadURL('file://' + resolvePath('../app/pages/main.html'))
  attachTrayState(win, tray)

  // We need to access it from the "About" window
  // To be able to open it from there
  global.welcome = win

  const emitTrayClick = aboutWindow => {
    win.hide()

    const emitClick = () => {
      if (aboutWindow && aboutWindow.isVisible()) {
        return
      }

      // Automatically open the context menu
      if (tray) {
        tray.emit('click')
      }

      win.removeListener('hide', emitClick)
    }

    win.on('hide', emitClick)
  }

  win.on('open-tray', emitTrayClick)

  // Just hand it back
  return win
}

const aboutWindow = () => {
  const win = new BrowserWindow({
    width: 360,
    height: 408,
    title: 'About Laravel Valet',
    resizable: false,
    center: true,
    show: false,
    fullscreenable: false,
    maximizable: false,
    minimizable: false,
    titleBarStyle: 'hidden-inset',
    frame: isPlatform('windows'),
    backgroundColor: '#ECECEC'
  })

  win.loadURL('file://' + resolvePath('../app/pages/main.html'))
  attachTrayState(win, tray)

  global.about = win

  return win
}

const preferencesWindow = () => {
  const win = new BrowserWindow({
    width: 250,
    height: 250,
    title: 'Preferences',
    resizable: false,
    center: true,
    frame: isPlatform('windows'),
    show: false,
    fullscreenable: false,
    maximizable: false,
    titleBarStyle: 'hidden-inset',
    backgroundColor: '#fff'
  })

  win.loadURL('file://' + resolvePath('../app/pages/main.html'))
  attachTrayState(win, tray)

  // We need to access it from the "About" window
  // To be able to open it from there
  global.preferences = win

  const emitTrayClick = preferencesWindow => {
    win.hide()

    const emitClick = () => {
      if (preferencesWindow && preferencesWindow.isVisible()) {
        return
      }

      // Automatically open the context menu
      if (tray) {
        tray.emit('click')
      }

      win.removeListener('hide', emitClick)
    }

    win.on('hide', emitClick)
  }

  win.on('open-tray', emitTrayClick)

  // Just hand it back
  return win
}

app.on('window-all-closed', () => {
  if (!isPlatform('macOS')) {
    app.quit()
  }
})

const toggleContextMenu = async windows => {
  const valetLinks = config.get('valet.cache.links')
  const valetPaths = config.get('valet.cache.paths')

  const apps = new Map()
  const parked = new Map()
  const linkList = []
  const parkedList = []

  for (const path of valetPaths) {
    const name = path

    if (parked.has(name)) {
      const existingParks = parked.get(name)
      parked.set(name, [...existingParks, path])

      continue
    }

    parked.set(name, [path])
  }

  parked.forEach((valetPaths, label) => {
    if (valetPaths.length === 1) {
      parkedList.push(mapParked(valetPaths[0]))
      return
    }

    parkedList.push({
      type: 'separator'
    })

    parkedList.push({
      label,
      enabled: false
    })

    for (const link of valetPaths) {
      parkedList.push(mapParked(link))
    }

    parkedList.push({
      type: 'separator'
    })
  })

  for (const link of valetLinks) {
    const name = link.name

    if (apps.has(name)) {
      const existingLinks = apps.get(name)
      apps.set(name, [...existingLinks, link])

      continue
    }

    apps.set(name, [link])
  }

  apps.forEach((valetLinks, label) => {
    if (valetLinks.length === 1) {
      linkList.push(mapLink(valetLinks[0]))
      return
    }

    linkList.push({
      type: 'separator'
    })

    linkList.push({
      label,
      enabled: false
    })

    for (const link of valetLinks) {
      linkList.push(mapLink(link))
    }

    linkList.push({
      type: 'separator'
    })
  })

  const data = {
    links: linkList,
    parked: parkedList
  }

  const generatedMenu = await innerMenu(app, tray, data, windows)

  const menu = Menu.buildFromTemplate(generatedMenu)

  tray.popUpContextMenu(menu)
}

const fileDropped = async (event, files) => {
  event.preventDefault()

  if (files.length > 1) {
    showError('You can only park o link one folder at a time.')
    return
  }

  const item = files[0]

  if (!isDirectory(item)) {
    showError('You can only park o link directories')
    return
  }

  const dialogAnswer = dialog.showMessageBox({
    type: 'question',
    message: 'Would you like to park or link the folder?',
    detail: 'Park will register your current working directory and link will serve a single site.',
    buttons: [
      'Link',
      'Park'
    ]
  })

  if (dialogAnswer) {
    await park(item)
    return
  }

  await link(item)
}

app.on('ready', async () => {
  const onlineStatusWindow = new BrowserWindow({
    width: 0,
    height: 0,
    show: false
  })

  onlineStatusWindow.loadURL('file://' + resolvePath('../app/pages/status.html'))

  ipcMain.on('online-status-changed', (event, status) => {
    process.env.CONNECTION = status
  })

  // DO NOT create the tray icon BEFORE the login status has been checked!
  // Otherwise, the user will start clicking...
  // ...the icon and the app wouldn't know what to do

  // I have no idea why, but path.resolve doesn't work here
  try {
    tray = new Tray(resolvePath('/assets/icons/iconTemplate.png'))

    // Opening the context menu after login should work
    global.tray = tray
  } catch (err) {
    showError('Could not spawn tray item', err)
    return
  }

  const windows = {
    welcome: welcomeWindow(),
    about: aboutWindow(),
    preferences: preferencesWindow()
  }

  const toggleActivity = event => {
    if (windows.welcome.isVisible()) {
      toggleWindow(event || null, windows.welcome)
    } else {
      tray.setHighlightMode('selection')
      toggleContextMenu(windows)
    }
  }

  // Only allow one instance of Valet running
  // at the same time
  app.makeSingleInstance(toggleActivity)

  // Periodically rebuild local cache every 10 seconds
  global.startRefresh(windows.welcome)

  if (isDev || firstRun()) {
    // Show the welcome as soon as the content has finished rendering
    // This avoids a visual flash
    windows.welcome.on('ready-to-show', () => toggleWindow(null, windows.welcome))
  }

  // When quitting the app, force close the welcome and about windows
  app.on('before-quit', () => {
    process.env.FORCE_CLOSE = true
  })

  // Define major event listeners for tray
  tray.on('drop-files', fileDropped)
  tray.on('click', toggleActivity)

  let isHighlighted = false
  let submenuShown = false

  tray.on('right-click', async event => {
    const menu = Menu.buildFromTemplate(outerMenu(app, windows))

    if (!windows.welcome.isVisible()) {
      isHighlighted = !isHighlighted
      tray.setHighlightMode(isHighlighted ? 'always' : 'never')
    }

    // Toggle submenu
    tray.popUpContextMenu(submenuShown ? null : menu)
    submenuShown = !submenuShown

    event.preventDefault()
  })
})
