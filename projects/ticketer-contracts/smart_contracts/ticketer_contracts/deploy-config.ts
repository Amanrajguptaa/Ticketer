import { AlgorandClient } from '@algorandfoundation/algokit-utils'
import { AlgoAmount } from '@algorandfoundation/algokit-utils/types/amount'
import { TicketerContractsFactory } from '../artifacts/ticketer_contracts/TicketerContractsClient'

export async function deploy() {
  console.log('=== Deploying TicketerContracts ===')

  const algorand = AlgorandClient.fromEnvironment()
  const deployer = await algorand.account.fromEnvironment('DEPLOYER')

  const factory = algorand.client.getTypedAppFactory(TicketerContractsFactory, {
    defaultSender: deployer.addr,
  })

  // Step 1: Create app with event info
  const { appClient } = await factory.send.create.createEvent({
    args: {
      name: 'Demo Event',
      date: '2026-03-01T18:00:00Z',
      venue: 'Demo Venue',
      supply: 100,
      priceInMicroAlgos: 1_000_000,
    },
  })

  console.log(`App deployed at ID: ${appClient.appClient.appId}`)
  console.log(`App address: ${appClient.appAddress}`)

  // Step 2: Fund the app
  await algorand.send.payment({
    amount: AlgoAmount.MicroAlgos(400_000),
    sender: deployer.addr,
    receiver: appClient.appAddress,
  })

  // Step 3: Mint ticket ASA
  const mintResult = await appClient.send.mintTickets({
    args: {},
    extraFee: AlgoAmount.MicroAlgos(1_000),
  })

  console.log(`Ticket ASA created with ID: ${mintResult.return}`)
}
