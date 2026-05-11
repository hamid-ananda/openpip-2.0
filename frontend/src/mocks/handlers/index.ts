import { settingsHandlers } from './settings'
import { announcementsHandlers } from './announcements'
import { countsHandlers } from './counts'
import { authHandlers } from './auth'
import { searchHandlers } from './search'
import { downloadHandlers } from './downloads'
import { contactHandlers } from './contact'

export const handlers = [
  ...settingsHandlers,
  ...announcementsHandlers,
  ...countsHandlers,
  ...authHandlers,
  ...searchHandlers,
  ...downloadHandlers,
  ...contactHandlers,
]
