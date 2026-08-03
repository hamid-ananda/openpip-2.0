import { create } from 'zustand'

/**
 * Which Site Settings panels have unsaved edits.
 *
 * The settings form owns the edits, but the sidebar that lists its panels lives
 * in the admin layout above it, and has to show a marker next to a panel an
 * admin has changed and navigated away from — with one Save button covering ten
 * panels, an edit left behind on another panel is otherwise invisible.
 *
 * The layout also uses `tabs.length` to warn before a link would leave the
 * settings form and drop those edits.
 */
interface AdminDirtyStore {
  /** Settings tab ids with unsaved edits. Empty whenever the form is clean. */
  tabs: string[]
  setDirtyTabs: (tabs: string[]) => void
}

export const useAdminDirty = create<AdminDirtyStore>((set, get) => ({
  tabs: [],
  setDirtyTabs: (tabs) => {
    // Called from an effect on every render of the settings form; bail out when
    // nothing moved so the sidebar does not re-render on each keystroke.
    const current = get().tabs
    if (current.length === tabs.length && current.every((t, i) => t === tabs[i])) return
    set({ tabs })
  },
}))
