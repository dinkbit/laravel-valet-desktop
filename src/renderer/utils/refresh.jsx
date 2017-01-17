// Packages
import {remote} from 'electron'

const refreshCache = remote.getGlobal('refreshCache')

export default async currentWindow => {
  // Prepare data
  await refreshCache(null, remote.app, currentWindow)

  // Start periodically refreshing data after login
  remote.getGlobal('startRefresh')(currentWindow)
}
