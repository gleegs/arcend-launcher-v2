import { describe, it, expect, beforeEach } from 'vitest'
import { useSettingsStore } from './settings'

beforeEach(() => {
  useSettingsStore.setState({ isSettingsOpen: false })
})

describe('useSettingsStore', () => {
  describe('setIsSettingsOpen', () => {
    it('sets isSettingsOpen to true', () => {
      useSettingsStore.getState().setIsSettingsOpen(true)

      expect(useSettingsStore.getState().isSettingsOpen).toBe(true)
    })

    it('sets isSettingsOpen to false', () => {
      useSettingsStore.setState({ isSettingsOpen: true })

      useSettingsStore.getState().setIsSettingsOpen(false)

      expect(useSettingsStore.getState().isSettingsOpen).toBe(false)
    })
  })

  describe('toggleSettings', () => {
    it('toggles isSettingsOpen from false to true', () => {
      useSettingsStore.setState({ isSettingsOpen: false })

      useSettingsStore.getState().toggleSettings()

      expect(useSettingsStore.getState().isSettingsOpen).toBe(true)
    })

    it('toggles isSettingsOpen from true to false', () => {
      useSettingsStore.setState({ isSettingsOpen: true })

      useSettingsStore.getState().toggleSettings()

      expect(useSettingsStore.getState().isSettingsOpen).toBe(false)
    })
  })
})
