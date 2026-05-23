import { settingsHandlers } from './settings'
import { announcementsHandlers } from './announcements'
import { countsHandlers } from './counts'
import { authHandlers } from './auth'
import { searchHandlers } from './search'
import { downloadHandlers } from './downloads'
import { contactHandlers } from './contact'
import { datasetHandlers } from './datasets'
import { proteinHandlers } from './proteins'
import { networksHandlers } from './networks'
import { filesHandlers } from './files'

export const handlers = [
  ...settingsHandlers,
  ...announcementsHandlers,
  ...countsHandlers,
  ...authHandlers,
  ...searchHandlers,
  ...downloadHandlers,
  ...contactHandlers,
  ...datasetHandlers,
  ...proteinHandlers,
  ...networksHandlers,
  ...filesHandlers,
]
