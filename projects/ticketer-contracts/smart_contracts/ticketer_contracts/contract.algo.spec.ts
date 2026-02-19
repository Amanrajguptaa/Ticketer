import { TestExecutionContext } from '@algorandfoundation/algorand-typescript-testing'
import { describe, expect, it } from 'vitest'
import { TicketerContracts } from './contract.algo'

describe('TicketerContracts contract', () => {
  const ctx = new TestExecutionContext()

  it('creates an event and initialises global state', () => {
    const contract = ctx.contract.create(TicketerContracts)

    contract.createEvent('Test Event', '2026-03-01', 'Main Hall', 100, 1_000_000)

    expect(contract.eventName.value).toBe('Test Event')
    expect(contract.ticketSupply.value).toBe(100)
    expect(contract.ticketsSold.value).toBe(0)
  })
})
