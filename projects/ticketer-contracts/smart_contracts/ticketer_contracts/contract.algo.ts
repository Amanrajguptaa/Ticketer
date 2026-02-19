import {
  Contract,
  contract,
  abimethod,
  GlobalState,
  LocalState,
  Account,
  Asset,
  uint64,
  Txn,
  Global,
  itxn,
  assert,
  gtxn,
} from '@algorandfoundation/algorand-typescript'

@contract({
  stateTotals: {
    globalUints: 5,
    globalBytes: 4,
    localUints: 4,
    localBytes: 0,
  },
})
export class TicketerContracts extends Contract {
  // ── Global state (per-event, one deployed app = one event) ────────────
  organizer = GlobalState<Account>()
  eventName = GlobalState<string>()
  eventDate = GlobalState<string>()
  eventVenue = GlobalState<string>()
  ticketPrice = GlobalState<uint64>() // in microAlgos
  ticketSupply = GlobalState<uint64>()
  ticketsSold = GlobalState<uint64>()
  ticketAsset = GlobalState<Asset>()
  minted = GlobalState<uint64>() // 0 = not yet, 1 = ASA created

  // ── Local state (per-user who opts in) ────────────────────────────────
  owned = LocalState<uint64>()
  used = LocalState<uint64>()
  listedForSale = LocalState<uint64>()
  listedPrice = LocalState<uint64>()

  // ═══════════════════════════════════════════════════════════════════════
  //  STEP 1 — Create event (stores state, NO inner transactions)
  //  Called during app creation. App is not funded yet so no ASA minting.
  // ═══════════════════════════════════════════════════════════════════════
  @abimethod({ onCreate: 'require' })
  createEvent(
    name: string,
    date: string,
    venue: string,
    supply: uint64,
    priceInMicroAlgos: uint64,
  ): void {
    this.organizer.value = Txn.sender
    this.eventName.value = name
    this.eventDate.value = date
    this.eventVenue.value = venue
    this.ticketPrice.value = priceInMicroAlgos
    this.ticketSupply.value = supply
    this.ticketsSold.value = 0
    this.minted.value = 0
  }

  // ═══════════════════════════════════════════════════════════════════════
  //  STEP 2 — Mint ticket ASA (called AFTER the app is funded)
  //  Creates a fungible ASA: total = ticketSupply, each unit = 1 ticket.
  //  Supply is enforced on-chain — impossible to exceed declared total.
  //  Contract is the clawback authority to enable resale transfers.
  // ═══════════════════════════════════════════════════════════════════════
  mintTickets(): uint64 {
    assert(Txn.sender === this.organizer.value, 'Only organizer')
    assert(this.minted.value === 0, 'Already minted')

    const assetTxn = itxn
      .assetConfig({
        total: this.ticketSupply.value,
        decimals: 0,
        defaultFrozen: false,
        unitName: 'TCKT',
        assetName: this.eventName.value,
        manager: Global.currentApplicationAddress,
        reserve: Global.currentApplicationAddress,
        clawback: Global.currentApplicationAddress,
      })
      .submit()

    this.ticketAsset.value = assetTxn.createdAsset
    this.minted.value = 1
    return assetTxn.createdAsset.id
  }

  // ═══════════════════════════════════════════════════════════════════════
  //  BUY TICKET — Atomic: student pays ALGO → contract sends 1 NFT unit.
  //  If either side fails the whole group is rolled back.
  //  One ticket per wallet enforced on-chain.
  // ═══════════════════════════════════════════════════════════════════════
  @abimethod({ allowActions: ['OptIn'] })
  buyTicket(payment: gtxn.PaymentTxn): void {
    assert(this.minted.value === 1, 'Tickets not minted yet')
    assert(this.ticketsSold.value < this.ticketSupply.value, 'Sold out')
    assert(
      payment.receiver === Global.currentApplicationAddress,
      'Payment must be sent to the app',
    )
    assert(payment.amount >= this.ticketPrice.value, 'Insufficient payment')
    // OptIn action already prevents double purchase (can't opt in twice)

    itxn
      .assetTransfer({
        xferAsset: this.ticketAsset.value,
        assetReceiver: Txn.sender,
        assetAmount: 1,
      })
      .submit()

    this.owned(Txn.sender).value = 1
    this.used(Txn.sender).value = 0
    this.listedForSale(Txn.sender).value = 0
    this.listedPrice(Txn.sender).value = 0
    const newSold: uint64 = this.ticketsSold.value + 1
    this.ticketsSold.value = newSold
  }

  // ═══════════════════════════════════════════════════════════════════════
  //  VERIFY — Gate scans QR → confirms NFT ownership → marks USED.
  //  Second scan returns "already used" → prevents re-entry.
  // ═══════════════════════════════════════════════════════════════════════
  verifyAndUse(ticketHolder: Account): boolean {
    assert(this.owned(ticketHolder).value === 1, 'No valid ticket')
    assert(this.used(ticketHolder).value === 0, 'Ticket already used')

    this.used(ticketHolder).value = 1
    return true
  }

  // ═══════════════════════════════════════════════════════════════════════
  //  RESALE — Price cap + automatic 5% royalty to organizer
  // ═══════════════════════════════════════════════════════════════════════
  listForSale(price: uint64): void {
    assert(this.owned(Txn.sender).value === 1, 'No ticket to list')
    assert(this.used(Txn.sender).value === 0, 'Ticket already used')
    assert(price <= this.ticketPrice.value, 'Cannot list above face value')

    this.listedForSale(Txn.sender).value = 1
    this.listedPrice(Txn.sender).value = price
  }

  cancelListing(): void {
    assert(this.owned(Txn.sender).value === 1, 'No ticket')
    this.listedForSale(Txn.sender).value = 0
    this.listedPrice(Txn.sender).value = 0
  }

  @abimethod({ allowActions: ['OptIn', 'NoOp'] })
  buyResale(payment: gtxn.PaymentTxn, seller: Account): void {
    assert(this.owned(seller).value === 1, 'Seller has no ticket')
    assert(this.used(seller).value === 0, 'Ticket already used')
    assert(this.listedForSale(seller).value === 1, 'Ticket not listed for sale')
    assert(
      payment.receiver === Global.currentApplicationAddress,
      'Payment must be sent to app',
    )
    assert(payment.amount >= this.listedPrice(seller).value, 'Below asking price')
    assert(payment.amount <= this.ticketPrice.value, 'Cannot exceed face value')

    const royalty: uint64 = (payment.amount * 5) / 100
    const sellerPayout: uint64 = payment.amount - royalty

    if (sellerPayout > 0) {
      itxn
        .payment({
          receiver: seller,
          amount: sellerPayout,
        })
        .submit()
    }

    itxn
      .assetTransfer({
        xferAsset: this.ticketAsset.value,
        assetSender: seller,
        assetReceiver: Txn.sender,
        assetAmount: 1,
      })
      .submit()

    this.owned(seller).value = 0
    this.listedForSale(seller).value = 0
    this.listedPrice(seller).value = 0
    this.owned(Txn.sender).value = 1
    this.used(Txn.sender).value = 0
    this.listedForSale(Txn.sender).value = 0
    this.listedPrice(Txn.sender).value = 0
  }

  // ── Organizer withdraws collected ticket sale revenue ─────────────────
  withdraw(): void {
    assert(Txn.sender === this.organizer.value, 'Only organizer can withdraw')

    const balance: uint64 =
      Global.currentApplicationAddress.balance -
      Global.currentApplicationAddress.minBalance
    assert(balance > 0, 'No funds to withdraw')

    itxn
      .payment({
        receiver: this.organizer.value,
        amount: balance,
      })
      .submit()
  }
}
