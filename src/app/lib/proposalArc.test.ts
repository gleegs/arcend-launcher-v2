import { describe, it, expect } from 'vitest'
import { isProposalArc } from './proposalArc'

describe('isProposalArc', () => {
  it('returns true for a proposal arc slug', () => {
    expect(isProposalArc('arcend-undefined')).toBe(true)
  })

  it('returns false for a regular arc slug', () => {
    expect(isProposalArc('arcend-prologue')).toBe(false)
  })

  it('returns false for null/undefined/empty', () => {
    expect(isProposalArc(null)).toBe(false)
    expect(isProposalArc(undefined)).toBe(false)
    expect(isProposalArc('')).toBe(false)
  })
})
