import React, { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Calendar, MapPin } from 'lucide-react'
import { useWallet } from '@txnlab/use-wallet-react'
import { AlgorandClient } from '@algorandfoundation/algokit-utils'
import { AlgoAmount } from '@algorandfoundation/algokit-utils/types/amount'
import { listEvents, listMyTickets, buyTicket, type Event as ApiEvent } from '../../api/events'
import { TicketerContractsClient } from '../../contracts/TicketerContracts'
import { getAlgodConfigFromViteEnvironment, getIndexerConfigFromViteEnvironment } from '../../utils/network/getAlgoClientConfigs'
import { HeroBanner } from './HeroBanner'

const PLACEHOLDER_IMAGE = 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&q=80'

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/** Featured event from API with Buy now; falls back to mock HeroBanner when no API events. */
export function FeaturedEventFromApi() {
  const navigate = useNavigate()
  const { activeAddress, transactionSigner } = useWallet()
  const [apiEvents, setApiEvents] = useState<ApiEvent[]>([])
  const [myTicketEventIds, setMyTicketEventIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [buyingId, setBuyingId] = useState<string | null>(null)
  const [buyStatus, setBuyStatus] = useState<string | null>(null)
  const [buyError, setBuyError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [events, tickets] = await Promise.all([
        listEvents(),
        activeAddress ? listMyTickets(activeAddress).catch(() => []) : Promise.resolve([]),
      ])
      setApiEvents(events)
      setMyTicketEventIds(new Set(tickets.map((t) => t.eventId)))
    } catch {
      setApiEvents([])
    } finally {
      setLoading(false)
    }
  }, [activeAddress])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleBuy = async (event: ApiEvent) => {
    if (!activeAddress || !transactionSigner || buyingId) return
    setBuyError(null)
    setBuyStatus(null)
    setBuyingId(event.id)

    try {
      let nftAssetId: string | number | bigint | undefined
      if (event.appId && event.appAddress) {
        const algodConfig = getAlgodConfigFromViteEnvironment()
        const indexerConfig = getIndexerConfigFromViteEnvironment()
        const algorand = AlgorandClient.fromConfig({ algodConfig, indexerConfig })
        algorand.setDefaultSigner(transactionSigner)
        algorand.account.setSigner(activeAddress, transactionSigner)

        const appClient = new TicketerContractsClient({
          appId: BigInt(event.appId),
          defaultSender: activeAddress,
          algorand,
        })

        setBuyStatus('Step 1/3: Minting NFT ticket (wallet will ask to sign)…')
        const priceInMicroAlgos = Math.round(parseFloat(event.priceAlgo) * 1_000_000)
        const payTxn = await algorand.createTransaction.payment({
          sender: activeAddress,
          receiver: event.appAddress,
          amount: AlgoAmount.MicroAlgos(priceInMicroAlgos),
        })

        const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001'
        const metadataUrl = `${API_BASE}/api/nft-metadata?appId=${event.appId}#arc3`

        const mintResult = await appClient.send.optIn.mintTicket({
          args: { payment: payTxn, metadataUrl },
          extraFee: AlgoAmount.MicroAlgos(2_000),
          sender: activeAddress,
          signer: transactionSigner,
        })
        if (mintResult.return != null) nftAssetId = mintResult.return

        if (nftAssetId == null) {
          throw new Error('Ticket mint did not return an assetId')
        }

        setBuyStatus('Step 2/3: Opting into ticket asset…')
        await algorand.send.assetOptIn({
          sender: activeAddress,
          assetId: BigInt(nftAssetId),
          signer: transactionSigner,
        })

        setBuyStatus('Step 3/3: Claiming ticket…')
        await appClient.send.claimTicket({
          args: { assetId: BigInt(nftAssetId) },
          sender: activeAddress,
          signer: transactionSigner,
        })
      }

      setBuyStatus('Recording purchase…')
      await buyTicket(event.id, activeAddress, nftAssetId)

      setBuyStatus(null)
      await fetchData()
      navigate('/my-tickets')
    } catch (err) {
      setBuyError(err instanceof Error ? err.message : 'Purchase failed')
      setBuyStatus(null)
    } finally {
      setBuyingId(null)
    }
  }

  if (loading) {
    return (
      <div className="w-full px-4">
        <div className="rounded-2xl border border-tc-border bg-tc-surface overflow-hidden h-[220px] md:h-[400px] animate-pulse">
          <div className="w-full h-full bg-tc-border" />
        </div>
      </div>
    )
  }

  const featured =
    apiEvents.length > 0
      ? apiEvents.find((e) => e.appId && e.appAddress) ?? apiEvents[0]
      : null
  if (!featured) return <HeroBanner />

  const cover = featured.coverImageUrl || PLACEHOLDER_IMAGE
  const sold = featured.ticketsSold ?? 0
  const remaining = featured.ticketSupply - sold
  const soldOut = remaining <= 0
  const owned = myTicketEventIds.has(featured.id)
  const isBuying = buyingId === featured.id

  return (
    <div className="w-full px-4">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="relative rounded-2xl border border-tc-border bg-tc-surface overflow-hidden w-full h-[220px] md:h-[400px]"
      >
        <img src={cover} alt={featured.name} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />

        <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6 flex flex-col gap-3">
          <span className="px-2.5 py-1 rounded-lg bg-tc-lime/90 text-tc-bg font-body font-bold text-[10px] uppercase tracking-wider w-fit">
            Featured · On sale
          </span>
          <h2 className="font-display font-bold text-[22px] md:text-[32px] text-tc-white leading-tight">
            {featured.name}
          </h2>
          <div className="flex items-center gap-2 text-tc-white/90 font-body text-[12px] md:text-[14px]">
            <Calendar className="w-4 h-4 shrink-0" />
            <span>{formatDate(featured.date)}</span>
          </div>
          <div className="flex items-center gap-2 text-tc-white/80 font-body text-[12px] md:text-[14px]">
            <MapPin className="w-4 h-4 shrink-0" />
            <span className="truncate">{featured.venue}</span>
          </div>

          {buyError && (
            <p className="font-body text-[13px] text-tc-coral">
              {buyError}
              <button type="button" onClick={() => setBuyError(null)} className="ml-2 underline">
                Dismiss
              </button>
            </p>
          )}
          {buyStatus && (
            <p className="font-body text-[13px] text-tc-lime flex items-center gap-2">
              <span className="animate-spin">⏳</span>
              {buyStatus}
            </p>
          )}

          <div className="flex items-center justify-between gap-4 mt-2">
            <div>
              <p className="font-body text-[11px] text-tc-muted uppercase tracking-wider">Price</p>
              <p className="font-mono font-bold text-[18px] md:text-[20px] text-tc-lime">
                {featured.priceAlgo} ALGO
              </p>
            </div>
            {owned ? (
              <button
                type="button"
                onClick={() => navigate('/my-tickets')}
                className="px-5 py-2.5 rounded-xl font-display font-bold text-[14px] text-tc-bg bg-tc-lime hover:bg-tc-lime/90 transition-colors"
              >
                View my ticket
              </button>
            ) : soldOut ? (
              <span className="px-5 py-2.5 rounded-xl font-body font-semibold text-[14px] text-tc-muted border border-tc-border bg-tc-surface">
                Sold out
              </span>
            ) : (
              <motion.button
                type="button"
                disabled={isBuying}
                whileTap={!isBuying ? { scale: 0.98 } : undefined}
                onClick={() => handleBuy(featured)}
                className="px-6 py-3 rounded-xl font-display font-bold text-[14px] md:text-[15px] text-tc-bg bg-tc-lime hover:bg-tc-lime/90 disabled:opacity-60 transition-colors border border-tc-lime/50"
              >
                {isBuying ? 'Buying…' : 'Buy now'}
              </motion.button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  )
}
