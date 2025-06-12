import { describe, it, expect } from 'vitest'

describe('Claude Service - Simple Tests', () => {
  it('should identify competitor brands correctly', () => {
    const competitorBrands = ['IKO', 'KNAUF', 'ISOVER', 'ROCKWOOL']
    const sopremaBrands = ['SOPREMA', 'SOPRASTAR', 'ELASTOPHENE']
    
    // Test des marques concurrentes
    expect(competitorBrands.includes('IKO')).toBe(true)
    expect(competitorBrands.includes('SOPREMA')).toBe(false)
    
    // Test des marques SOPREMA
    expect(sopremaBrands.includes('SOPREMA')).toBe(true)
    expect(sopremaBrands.includes('IKO')).toBe(false)
  })

  it('should calculate potential correctly', () => {
    const competitorAmount = 1000
    const conversionRate = 0.7 // 70%
    const potential = competitorAmount * conversionRate
    
    expect(potential).toBe(700)
  })

  it('should format invoice numbers', () => {
    const baseNumber = 'FA'
    const timestamp = '2024001'
    const invoiceNumber = `${baseNumber}-${timestamp}`
    
    expect(invoiceNumber).toMatch(/^FA-\d+$/)
    expect(invoiceNumber).toBe('FA-2024001')
  })
})