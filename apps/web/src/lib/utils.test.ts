import { describe, expect, it } from 'vitest'

import { cn } from './utils'

describe('cn (className utility)', () => {
  it('merges class names', () => {
    expect(cn('foo', 'bar')).toBe('foo bar')
  })

  it('resolves Tailwind conflicts (last wins)', () => {
    expect(cn('p-4', 'p-2')).toBe('p-2')
  })

  it('ignores falsy values', () => {
    expect(cn('foo', false, null, undefined, 'bar')).toBe('foo bar')
  })
})
