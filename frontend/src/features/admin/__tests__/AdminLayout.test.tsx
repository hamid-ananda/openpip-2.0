import { render, screen, fireEvent, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { AdminLayout } from '../AdminLayout'
import { useAdminDirty } from '../../../store/adminDirty'

/** The shell plus stand-ins for the screens it frames. */
function renderShell(path = '/admin/settings') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/admin" element={<AdminLayout />}>
          <Route path="settings" element={<div>settings screen</div>} />
          <Route path="announcement" element={<div>news screen</div>} />
        </Route>
      </Routes>
    </MemoryRouter>
  )
}

describe('AdminLayout', () => {
  beforeEach(() => useAdminDirty.setState({ tabs: [] }))
  afterEach(() => vi.restoreAllMocks())

  it('groups every admin screen under a category in one sidebar', () => {
    renderShell()
    const nav = screen.getByRole('navigation', { name: 'Admin sections' })

    for (const section of ['Site', 'Pages', 'Content']) {
      expect(within(nav).getByRole('heading', { name: section })).toBeInTheDocument()
    }
    // The settings panels and the standalone managers sit in the same column.
    for (const item of ['Site Identity', 'Appearance', 'Home', 'Accounts', 'News', 'Files']) {
      expect(within(nav).getByRole('link', { name: new RegExp(item) })).toBeInTheDocument()
    }
  })

  it('marks the open screen as current', () => {
    renderShell('/admin/announcement')
    expect(screen.getByRole('link', { name: /News/ })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('link', { name: /Site Identity/ })).not.toHaveAttribute('aria-current')
  })

  it('reads the open settings panel from the query string', () => {
    renderShell('/admin/settings?tab=accounts')
    expect(screen.getByRole('link', { name: /Accounts/ })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('link', { name: /Site Identity/ })).not.toHaveAttribute('aria-current')
  })

  it('shows which settings panel has unsaved edits', () => {
    useAdminDirty.setState({ tabs: ['home'] })
    renderShell()
    expect(
      screen.getByRole('link', { name: /Home/ }).querySelector('[aria-label="has unsaved changes"]')
    ).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: /Search/ }).querySelector('[aria-label="has unsaved changes"]')
    ).not.toBeInTheDocument()
  })

  it('confirms before a link would leave unsaved settings behind', () => {
    useAdminDirty.setState({ tabs: ['home'] })
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false)
    renderShell()

    fireEvent.click(screen.getByRole('link', { name: /News/ }))

    expect(confirm).toHaveBeenCalledOnce()
    expect(screen.getByText('settings screen')).toBeInTheDocument()
    expect(screen.queryByText('news screen')).not.toBeInTheDocument()
  })

  it('moves between settings panels without confirming', () => {
    useAdminDirty.setState({ tabs: ['home'] })
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false)
    renderShell()

    // Panels share one form, so switching between them keeps the edits.
    fireEvent.click(screen.getByRole('link', { name: /Appearance/ }))

    expect(confirm).not.toHaveBeenCalled()
    expect(screen.getByRole('link', { name: /Appearance/ })).toHaveAttribute('aria-current', 'page')
  })
})
