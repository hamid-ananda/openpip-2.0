import { describe, it, expect } from 'vitest'
import type { AdminSettings } from './api'

describe('Types compile', () => {
  it('AdminSettings shape is correct', () => {
    const s: AdminSettings = {
      title: 'openPIP',
      shortTitle: 'HuRI',
      footer: '<p>Footer</p>',
      homePage: '',
      missionTitle: 'Mission',
      missionText: 'Text',
      methodTitle: 'Methods',
      methodText: 'Text',
      mainColorScheme: '#a51c30',
      headerColorScheme: '#ffffff',
      logoColorScheme: '#ffffff',
      buttonColorScheme: '#a51c30',
      queryNodeColor: '#cc0000',
      interactorNodeColor: '#3c78d8',
      publishedEdgeColor: '#38761d',
      validatedEdgeColor: '#1155cc',
      verifiedEdgeColor: '#cc0000',
      literatureEdgeColor: '#ff9900',
      url: 'https://openpip.usask.ca/',
      version: '1.0',
    }
    expect(s.shortTitle).toBe('HuRI')
  })
})
