import { describe, it, expect } from 'vitest'

describe('Test Setup', () => {
  it('should pass a basic test', () => {
    expect(1 + 1).toBe(2)
  })

  it('should have environment variables', () => {
    expect(process.env.VITE_GOOGLE_MAPS_API_KEY).toBeDefined()
    expect(process.env.VITE_API_URL).toBeDefined()
  })
})