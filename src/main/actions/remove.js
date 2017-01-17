// Packages
import {dialog} from 'electron'
import {execSync} from 'child_process'
import Cache from 'electron-config'

// Ours
import notify from '../notify'
import {error as showError} from '../dialogs'

export async function removeLinked(link) {
  // Ask the user if it was an accident
  const keepIt = dialog.showMessageBox({
    type: 'question',
    title: 'Unlink of ' + link.name,
    message: 'Do you really want to unlink this site?',
    detail: link.name,
    buttons: [
      'Yes',
      'No'
    ]
  })

  // If so, do nothing
  if (keepIt) {
    return
  }

  notify({
    title: `Unlinking ${link.name}...`,
    body: 'The link is being removed.'
  })

  try {
    execSync('valet unlink ' + link.name)
  } catch (err) {
    console.error(err)
    showError('Failed to remove link ' + link.name)

    return
  }

  const cache = new Cache()
  const cacheIdentifier = 'valet.cache.links'

  if (!cache.has(cacheIdentifier)) {
    return
  }

  // Get a list of all links
  const links = cache.get(cacheIdentifier)

  for (const linked of links) {
    if (link.name !== linked.name) {
      continue
    }

    const index = links.indexOf(linked)

    // Remove deleted link from link list
    links.splice(index, 1)
  }

  // And update the list in the cache
  cache.set(cacheIdentifier, links)

  notify({
    title: 'Unliked ' + link.name,
    body: 'The site has been successfully unliked.'
  })
}

export async function removeParked(path) {
  // Ask the user if it was an accident
  const keepIt = dialog.showMessageBox({
    type: 'question',
    title: 'Forget path ' + path,
    message: 'Do you really want to forget this path?',
    detail: path,
    buttons: [
      'Yes',
      'No'
    ]
  })

  // If so, do nothing
  if (keepIt) {
    return
  }

  notify({
    title: `Forgetting ${path}...`,
    body: 'The path is being removed.'
  })

  try {
    execSync('valet forget ' + path)
  } catch (err) {
    console.error(err)
    showError('Failed to remove path ' + path)

    return
  }

  const cache = new Cache()
  const cacheIdentifier = 'valet.cache.paths'

  if (!cache.has(cacheIdentifier)) {
    return
  }

  // Get a list of all paths
  const paths = cache.get(cacheIdentifier)

  for (const parked of paths) {
    if (path !== parked) {
      continue
    }

    const index = paths.indexOf(parked)

    // Remove deleted path from link list
    paths.splice(index, 1)
  }

  // And update the list in the cache
  cache.set(cacheIdentifier, paths)

  notify({
    title: 'Removed ' + path,
    body: 'The directory has been successfully removed.'
  })
}
