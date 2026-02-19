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
    globalUints: 3,
    globalBytes: 4,
    localUints: 6,
    localBytes: 0,
  },
})
export class TicketerContracts extends Contract {
  // ── Global state (per-event, one deployed app = one event) ────────────
  organizer = GlobalState<Account>()
  eventName = GlobalState<string>()
  eventDate = GlobalState<string>()
  eventVenue = GlobalState<string>()
  ticketPrice = GlobalState<uint64>()
  ticketSupply = GlobalState<uint64>()
  ticketsSold = GlobalState<uint64>()

  // ── Local state (per-user who opts in) ────────────────────────────────
  ownedAssetId = LocalState<uint64>() // 0 = no ticket
  pendingAssetId = LocalState<uint64>() // 0 = no pending mint
  used = LocalState<uint64>()
  listedForSale = LocalState<uint64>()
  listedPrice = LocalState<uint64>()

  // ═══════════════════════════════════════════════════════════════════════
  //  STEP 1 — Create event (stores state, NO inner transactions)
  //  No pre-minted ASA; each ticket will be a unique NFT minted on purchase.
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
  }

  // ═══════════════════════════════════════════════════════════════════════
  //  STEP 2a — Mint ticket NFT (no transfer yet).
  //  Creates one unique NFT (ARC-3: total=1, url=metadata) and records it as pending.
  //  Frontend flow:
  //    1) Call mintTicket(payment, metadataUrl) → returns assetId
  //    2) Wallet opts buyer into that ASA
  //    3) Call claimTicket(assetId) to receive the NFT
  // ═══════════════════════════════════════════════════════════════════════
  @abimethod({ allowActions: ['OptIn'] })
  mintTicket(payment: gtxn.PaymentTxn, metadataUrl: string): uint64 {
    assert(this.ticketsSold.value < this.ticketSupply.value, 'Sold out')
    assert(
      payment.receiver === Global.currentApplicationAddress,
      'Payment must be sent to the app',
    )
    assert(payment.amount >= this.ticketPrice.value, 'Insufficient payment')

    const minFee: uint64 = Global.minTxnFee
    const assetTxn = itxn
      .assetConfig({
        fee: minFee,
        total: 1,
        decimals: 0,
        defaultFrozen: false,
        unitName: 'TCKT',
        assetName: this.eventName.value,
        url: metadataUrl,
        manager: Global.currentApplicationAddress,
        reserve: Global.currentApplicationAddress,
        clawback: Global.currentApplicationAddress,
      })
      .submit()

    const createdAsset: Asset = assetTxn.createdAsset
    this.pendingAssetId(Txn.sender).value = createdAsset.id
    this.used(Txn.sender).value = 0
    this.listedForSale(Txn.sender).value = 0
    this.listedPrice(Txn.sender).value = 0
    this.ticketsSold.value = this.ticketsSold.value + 1
    return createdAsset.id
  }

  // ═══════════════════════════════════════════════════════════════════════
  //  STEP 2b — Claim ticket NFT after wallet opt-in.
  //  Requires:
  //    - pendingAssetId(sender) == assetId
  //    - sender has opted in to assetId
  //  Then transfers 1 unit from app to sender and finalizes ownership.
  // ═══════════════════════════════════════════════════════════════════════
  @abimethod({ allowActions: ['NoOp'] })
  claimTicket(assetId: uint64): void {
    const pending: uint64 = this.pendingAssetId(Txn.sender).value
    assert(pending !== 0, 'No pending ticket')
    assert(pending === assetId, 'Wrong asset')

    const nftAsset: Asset = Asset(assetId)

    // Ensure sender is opted in; if not, the transfer will fail with must optin
    const minFee: uint64 = Global.minTxnFee
    itxn
      .assetTransfer({
        fee: minFee,
        xferAsset: nftAsset,
        assetReceiver: Txn.sender,
        assetAmount: 1,
      })
      .submit()

    this.pendingAssetId(Txn.sender).value = 0
    this.ownedAssetId(Txn.sender).value = assetId
    this.used(Txn.sender).value = 0
    this.listedForSale(Txn.sender).value = 0
    this.listedPrice(Txn.sender).value = 0
  }

  // ═══════════════════════════════════════════════════════════════════════
  //  VERIFY — Gate confirms NFT ownership → marks USED.
  // ═══════════════════════════════════════════════════════════════════════
  verifyAndUse(ticketHolder: Account): boolean {
    assert(this.ownedAssetId(ticketHolder).value !== 0, 'No valid ticket')
    assert(this.used(ticketHolder).value === 0, 'Ticket already used')

    this.used(ticketHolder).value = 1
    return true
  }

  // ═══════════════════════════════════════════════════════════════════════
  //  RESALE — Price cap + automatic 5% royalty to organizer
  // ═══════════════════════════════════════════════════════════════════════
  listForSale(price: uint64): void {
    assert(this.ownedAssetId(Txn.sender).value !== 0, 'No ticket to list')
    assert(this.used(Txn.sender).value === 0, 'Ticket already used')
    assert(price <= this.ticketPrice.value, 'Cannot list above face value')

    this.listedForSale(Txn.sender).value = 1
    this.listedPrice(Txn.sender).value = price
  }

  cancelListing(): void {
    assert(this.ownedAssetId(Txn.sender).value !== 0, 'No ticket')
    this.listedForSale(Txn.sender).value = 0
    this.listedPrice(Txn.sender).value = 0
  }

  @abimethod({ allowActions: ['OptIn', 'NoOp'] })
  buyResale(payment: gtxn.PaymentTxn, seller: Account): void {
    const sellerAssetId: uint64 = this.ownedAssetId(seller).value
    assert(sellerAssetId !== 0, 'Seller has no ticket')
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

    const minFee: uint64 = Global.minTxnFee
    if (sellerPayout > 0) {
      itxn
        .payment({
          fee: minFee,
          receiver: seller,
          amount: sellerPayout,
        })
        .submit()
    }

    const nftAsset: Asset = Asset(sellerAssetId)
    itxn
      .assetTransfer({
        fee: minFee,
        xferAsset: nftAsset,
        assetSender: seller,
        assetReceiver: Txn.sender,
        assetAmount: 1,
      })
      .submit()

    this.ownedAssetId(seller).value = 0
    this.listedForSale(seller).value = 0
    this.listedPrice(seller).value = 0
    this.ownedAssetId(Txn.sender).value = sellerAssetId
    this.used(Txn.sender).value = 0
    this.listedForSale(Txn.sender).value = 0
    this.listedPrice(Txn.sender).value = 0
  }

  withdraw(): void {
    assert(Txn.sender === this.organizer.value, 'Only organizer can withdraw')

    const balance: uint64 =
      Global.currentApplicationAddress.balance -
      Global.currentApplicationAddress.minBalance
    assert(balance > 0, 'No funds to withdraw')

    itxn
      .payment({
        fee: Global.minTxnFee,
        receiver: this.organizer.value,
        amount: balance,
      })
      .submit()
  }
}
