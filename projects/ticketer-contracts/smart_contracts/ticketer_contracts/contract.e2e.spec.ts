import { Config } from '@algorandfoundation/algokit-utils'
import { registerDebugEventHandlers } from '@algorandfoundation/algokit-utils-debug'
import { algorandFixture } from '@algorandfoundation/algokit-utils/testing'
import { Address } from 'algosdk'
import { beforeAll, beforeEach, describe, expect, test } from 'vitest'
import { TicketerContractsFactory } from '../artifacts/ticketer_contracts/TicketerContractsClient'

describe('TicketerContracts contract', () => {
  const localnet = algorandFixture()
  beforeAll(() => {
    Config.configure({
      debug: true,
    })
    registerDebugEventHandlers()
  })
  beforeEach(localnet.newScope)

  const deploy = async (account: Address) => {
    const factory = localnet.algorand.client.getTypedAppFactory(TicketerContractsFactory, {
      defaultSender: account,
    })

    const { appClient } = await factory.send.create.createEvent({
      args: {
        name: 'E2E Test Event',
        date: '2026-03-01T18:00:00Z',
        venue: 'Test Venue',
        supply: 10,
        priceInMicroAlgos: 1_000_000,
      },
    })
    return { client: appClient }
  }

  test('creates event and returns asset id', async () => {
    const { testAccount } = localnet.context
    const { client } = await deploy(testAccount)

    expect(client.appClient.appId).toBeGreaterThan(0n)
  })
})
