// Packages
import {execSync} from 'child_process'
import Config from 'electron-config'
import chalk from 'chalk'

// Ours
import {error as showError} from './dialogs'

const commands = {
  getDomain() {
    const domain = execSync('valet domain')

    return domain.toString()
  },
  getPaths() {
    const paths = execSync('valet paths')

    return JSON.parse(paths)
  },
  getLinks() {
    const links = execSync('valet links')

    // This could be a better Regex, I'm being lazy here.
    const data = links.toString().match(/:.*/img)

    const map = []

    data.forEach(link => {
      const appPath = link.substring(4).split(/\s->\s/)

      if (appPath.length > 1) {
        map.push({name: appPath[0], path: appPath[1]})
      }
    })

    return map
  },
  linkApp(path) {
    const newLink = execSync('valet link', {cwd: path})

    const appPath = newLink.toString().match(/\[(.*?)\]/g).map(app => app.replace(/[[\]]/g, ''))

    return {name: appPath[0], path: appPath[1]}
  },
  parkFolder(path) {
    const parkedPath = execSync('valet park', {cwd: path})

    console.log(parkedPath.toString())

    return {path}
  }
}

const refreshKind = async name => {
  let method

  switch (name) {
    case 'domain':
      method = 'getDomain'
      break
    case 'links':
      method = 'getLinks'
      break
    case 'paths':
      method = 'getPaths'
      break
    default:
      method = false
  }

  if (!method) {
    console.error(`Not able to refresh ${name} cache`)
    return
  }

  return new Promise(async (resolve, reject) => {
    let freshData

    try {
      freshData = await commands[method]()
    } catch (err) {
      reject(err)
      return
    }

    const config = new Config()
    const configProperty = 'valet.cache.' + name

    config.set(configProperty, freshData)

    resolve()
  })
}

const stopInterval = interval => {
  if (!interval) {
    return
  }

  console.log('Stopping the refreshing process...')
  clearInterval(interval)
}

export async function refreshCache(kind, app, welcome, interval) {
  if (kind) {
    try {
      await refreshKind(kind)
    } catch (err) {
      showError('Not able to refresh ' + kind, err)
      stopInterval(interval)
    }

    return
  }

  const sweepers = new Set()

  const kinds = new Set([
    'paths',
    'links'
  ])

  for (const kind of kinds) {
    const refresher = refreshKind(kind)
    sweepers.add(refresher)
  }

  try {
    await Promise.all(sweepers)
  } catch (err) {
    stopInterval(interval)

    if (welcome) {
      // Prepare the welcome by reloading its contents
      welcome.reload()

      // Once the content has loaded again, show it
      welcome.once('ready-to-show', () => welcome.show())
    }

    return
  }

  const currentTime = new Date().toLocaleTimeString()

  console.log(chalk.green(`[${currentTime}]`) + ' Refreshed entire cache')
}

export async function linkApp(path) {
  return new Promise(async (resolve, reject) => {
    let appData

    try {
      appData = await commands.linkApp(path)
    } catch (err) {
      reject(err)
      return
    }

    resolve(appData)
  })
}

export async function parkFolder(path) {
  return new Promise(async (resolve, reject) => {
    let appData

    try {
      appData = await commands.parkFolder(path)
    } catch (err) {
      reject(err)
      return
    }

    resolve(appData)
  })
}
