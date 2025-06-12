import { describe, it, expect } from 'vitest'
import React from 'react'
import { render, screen } from '@testing-library/react'

describe('Simple Component Tests', () => {
  it('should render a simple div', () => {
    render(<div>Hello Test</div>)
    expect(screen.getByText('Hello Test')).toBeDefined()
  })

  it('should perform basic calculations', () => {
    expect(2 + 2).toBe(4)
    expect(10 * 5).toBe(50)
  })

  it('should handle arrays correctly', () => {
    const arr = [1, 2, 3]
    expect(arr).toHaveLength(3)
    expect(arr[0]).toBe(1)
  })
})