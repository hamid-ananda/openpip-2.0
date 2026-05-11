import type { AdminSettings } from '../../types/api'

export const settingsFixture: AdminSettings = {
  title: 'openPIP — Protein Interaction Portal',
  shortTitle: 'openPIP',
  footer: '<p>© 2026 openPIP. All rights reserved.</p>',
  homePage: '',
  missionTitle: '<h4>Our Mission</h4>',
  missionText: '<p>openPIP provides a curated map of human protein–protein interactions.</p>',
  methodTitle: '<h4>Methods</h4>',
  methodText: '<p>Interactions are sourced from published experimental datasets.</p>',
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
  url: 'http://localhost:5173/',
  version: '2.0',
}
