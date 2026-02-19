import React, { useCallback, useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Share2, Calendar, MapPin, Clock, User, Info } from 'lucide-react'
import { useWallet } from '@txnlab/use-wallet-react'
import { AlgorandClient } from '@algorandfoundation/algokit-utils'
import { AlgoAmount } from '@algorandfoundation/algokit-utils/types/amount'
import { events, organisers } from '../../data/mockData'
import type { Event as MockEvent } from '../../data/mockData'
import { getEvent, buyTicket, type Event as ApiEvent } from '../../api/events'
import { TicketerContractsClient } from '../../contracts/TicketerContracts'
import { getAlgodConfigFromViteEnvironment, getIndexerConfigFromViteEnvironment } from '../../utils/network/getAlgoClientConfigs'

const PLACEHOLDER_IMAGE = 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&q=80'

const getOrganiser = (id: string) => organisers.find((o) => o.id === id)

/** Map transaction/API errors to user-friendly messages for Book Now. */
function getFriendlyBuyError(err: unknown): { message: string; alreadyOwned?: boolean } {
  const raw = err instanceof Error ? err.message : String(err)
  const lower = raw.toLowerCase()
  if (lower.includes('already opted in') || lower.includes('already opted-in')) {
    return {
      message: 'You may already have a ticket for this event. Check My Tickets.',
      alreadyOwned: true,
    }
  }
  if (lower.includes('insufficient') || lower.includes('underflow')) {
    return { message: 'Insufficient ALGO balance. Add funds to your wallet and try again.' }
  }
  if (lower.includes('rejected') || lower.includes('user denied')) {
    return { message: 'Transaction was cancelled. Try again when you’re ready.' }
  }
  if (lower.includes('network') || lower.includes('fetch') || lower.includes('failed to fetch')) {
    return { message: 'Network error. Check your connection and try again.' }
  }
  if (lower.includes('not found') || lower.includes('404')) {
    return { message: 'Event or ticket service unavailable. Please try again later.' }
  }
  return { message: 'Purchase failed. Please try again or check My Tickets.' }
}

/** Format "HH:mm" as 12h time */
function formatTime(time24: string) {
  const [h, m] = time24.split(':').map(Number)
  if (h === 12) return `12:${String(m).padStart(2, '0')} PM`
  if (h === 0) return `12:${String(m).padStart(2, '0')} AM`
  if (h > 12) return `${h - 12}:${String(m).padStart(2, '0')} PM`
  return `${h}:${String(m).padStart(2, '0')} AM`
}

/** Format ISO date for time string */
function formatTimeFromIso(iso: string) {
  const d = new Date(iso)
  const h = d.getHours()
  const m = d.getMinutes()
  if (h === 12) return `12:${String(m).padStart(2, '0')} PM`
  if (h === 0) return `12:${String(m).padStart(2, '0')} AM`
  if (h > 12) return `${h - 12}:${String(m).padStart(2, '0')} PM`
  return `${h}:${String(m).padStart(2, '0')} AM`
}

type ResolvedEvent =
  | { source: 'mock'; event: MockEvent }
  | { source: 'api'; event: ApiEvent }

export const EventPage = () => {
  const { eventId } = useParams<{ eventId: string }>()
  const navigate = useNavigate()
  const { activeAddress, transactionSigner } = useWallet()
  const [resolved, setResolved] = useState<ResolvedEvent | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [buyingId, setBuyingId] = useState<string | null>(null)
  const [buyStatus, setBuyStatus] = useState<string | null>(null)
  const [buyError, setBuyError] = useState<string | null>(null)
  const [buyErrorAlreadyOwned, setBuyErrorAlreadyOwned] = useState(false)

  const handleBuyApiEvent = useCallback(
    async (event: ApiEvent) => {
      if (!activeAddress || !transactionSigner || buyingId) return
      setBuyError(null)
      setBuyErrorAlreadyOwned(false)
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
        navigate('/my-tickets')
      } catch (err) {
        const { message, alreadyOwned } = getFriendlyBuyError(err)
        setBuyError(message)
        setBuyErrorAlreadyOwned(!!alreadyOwned)
        setBuyStatus(null)
      } finally {
        setBuyingId(null)
      }
    },
    [activeAddress, transactionSigner, buyingId, navigate],
  )

  useEffect(() => {
    if (!eventId) {
      setNotFound(true)
      setLoading(false)
      return
    }
    const mock = events.find((e) => e.id === eventId)
    if (mock) {
      setResolved({ source: 'mock', event: mock })
      setLoading(false)
      return
    }
    let cancelled = false
    getEvent(eventId)
      .then((apiEvent) => {
        if (cancelled) return
        if (apiEvent) setResolved({ source: 'api', event: apiEvent })
        else setNotFound(true)
      })
      .catch(() => {
        if (!cancelled) setNotFound(true)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [eventId])

  useEffect(() => {
    if (!notFound) return
    navigate('/student-home', { replace: true })
  }, [notFound, navigate])

  if (loading) {
    return (
      <div className="min-h-screen bg-tc-bg pb-24 flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-tc-lime border-t-transparent animate-spin" />
      </div>
    )
  }

  if (!resolved) return null

  const handleBack = () => navigate('/student-home')

  if (resolved.source === 'mock') {
    const event = resolved.event
    const organiser = getOrganiser(event.organiser)
    return (
      <div className="min-h-screen bg-tc-bg pb-24">
        <div className="relative h-[300px] md:h-[400px] w-full">
          <img src={event.coverImage} alt={event.title} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-tc-bg" />
          <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between z-10">
            <motion.button
              type="button"
              whileTap={{ scale: 0.9 }}
              onClick={handleBack}
              className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-white hover:bg-black/60 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </motion.button>
            <motion.button
              type="button"
              whileTap={{ scale: 0.9 }}
              className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-white hover:bg-black/60 transition-colors"
            >
              <Share2 className="w-5 h-5" />
            </motion.button>
          </div>
        </div>

        <div className="px-5 -mt-8 relative z-10 max-w-3xl mx-auto">
          <span className="px-3 py-1 rounded-full bg-tc-lime/90 backdrop-blur text-black font-body font-bold text-[11px] uppercase tracking-wider mb-3 inline-block">
            {event.category}
          </span>

          <h1 className="font-display font-bold text-[28px] md:text-[36px] text-white leading-tight mb-2">
            {event.title}
          </h1>

          <div className="flex items-center gap-2 mb-6">
            <div className="w-6 h-6 rounded-full overflow-hidden border border-tc-border">
              {organiser?.initials ? (
                <div className="w-full h-full bg-tc-surface flex items-center justify-center text-[10px] text-tc-white font-bold">
                  {organiser.initials}
                </div>
              ) : (
                <User className="w-4 h-4 text-tc-muted" />
              )}
            </div>
            <span className="font-body text-[13px] text-tc-muted">
              by <span className="text-tc-white font-medium">{organiser?.name || 'Unknown Organiser'}</span>
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-8">
            <div className="bg-tc-surface border border-tc-border rounded-xl p-3 flex items-start gap-3">
              <Calendar className="w-5 h-5 text-tc-lime shrink-0" />
              <div>
                <p className="text-[11px] text-tc-muted uppercase tracking-wider">Date</p>
                <p className="text-[14px] font-medium text-tc-white mt-0.5">
                  {new Date(event.date + 'T00:00:00').toLocaleDateString('en-IN', {
                    weekday: 'short',
                    day: 'numeric',
                    month: 'short',
                  })}
                </p>
              </div>
            </div>
            <div className="bg-tc-surface border border-tc-border rounded-xl p-3 flex items-start gap-3">
              <Clock className="w-5 h-5 text-tc-lime shrink-0" />
              <div>
                <p className="text-[11px] text-tc-muted uppercase tracking-wider">Time</p>
                <p className="text-[14px] font-medium text-tc-white mt-0.5">{formatTime(event.time)}</p>
              </div>
            </div>
            <div className="col-span-2 bg-tc-surface border border-tc-border rounded-xl p-3 flex items-start gap-3">
              <MapPin className="w-5 h-5 text-tc-lime shrink-0" />
              <div>
                <p className="text-[11px] text-tc-muted uppercase tracking-wider">Venue</p>
                <p className="text-[14px] font-medium text-tc-white mt-0.5">{event.venue}</p>
              </div>
            </div>
          </div>

          <div className="mb-8">
            <h3 className="font-display font-bold text-[18px] text-tc-white mb-3 flex items-center gap-2">
              <Info className="w-5 h-5 text-tc-lime" />
              About Event
            </h3>
            <p className="font-body text-[14px] text-tc-muted leading-relaxed">{event.description}</p>
          </div>
        </div>

        <div className="fixed bottom-0 left-0 right-0 p-4 bg-tc-bg/95 backdrop-blur-xl border-t border-tc-border z-30">
          <div className="max-w-3xl mx-auto flex items-center justify-between gap-4">
            <div>
              <p className="text-[11px] text-tc-muted uppercase tracking-wider mb-0.5">Total Price</p>
              <div className="flex items-baseline gap-1">
                <span className="font-mono font-bold text-[20px] text-tc-white">
                  {event.isFree ? 'FREE' : `${event.price} ALGO`}
                </span>
                {!event.isFree && <span className="text-[11px] text-tc-muted">/ person</span>}
              </div>
            </div>
            <motion.button
              type="button"
              whileTap={{ scale: 0.96 }}
              className={`px-8 py-3 rounded-xl font-display font-bold text-[15px] tracking-wide shadow-lg shadow-tc-lime/20 flex-1 max-w-[200px] ${
                event.isSoldOut
                  ? 'bg-tc-surface text-tc-muted cursor-not-allowed border border-tc-border'
                  : 'bg-tc-lime text-black hover:bg-tc-lime/90'
              }`}
              disabled={event.isSoldOut}
            >
              {event.isSoldOut ? 'Sold Out' : 'Book Now'}
            </motion.button>
          </div>
        </div>
      </div>
    )
  }

  // API event
  const e = resolved.event
  const sold = e.ticketsSold ?? 0
  const soldOut = e.ticketSupply - sold <= 0
  const price = parseFloat(e.priceAlgo)
  const isFree = price === 0
  const coverImage = e.coverImageUrl || PLACEHOLDER_IMAGE
  const dateFormatted = new Date(e.date).toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })

  return (
    <div className="min-h-screen bg-tc-bg pb-24">
      <div className="relative h-[300px] md:h-[400px] w-full">
        <img src={coverImage} alt={e.name} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-tc-bg" />
        <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between z-10">
          <motion.button
            type="button"
            whileTap={{ scale: 0.9 }}
            onClick={handleBack}
            className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-white hover:bg-black/60 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </motion.button>
          <motion.button
            type="button"
            whileTap={{ scale: 0.9 }}
            className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-white hover:bg-black/60 transition-colors"
          >
            <Share2 className="w-5 h-5" />
          </motion.button>
        </div>
      </div>

      <div className="px-5 -mt-8 relative z-10 max-w-3xl mx-auto">
        <span className="px-3 py-1 rounded-full bg-tc-lime/90 backdrop-blur text-black font-body font-bold text-[11px] uppercase tracking-wider mb-3 inline-block">
          Event
        </span>

        <h1 className="font-display font-bold text-[28px] md:text-[36px] text-white leading-tight mb-2">
          {e.name}
        </h1>

        <div className="flex items-center gap-2 mb-6">
          <div className="w-6 h-6 rounded-full overflow-hidden border border-tc-border bg-tc-surface flex items-center justify-center">
            <User className="w-4 h-4 text-tc-muted" />
          </div>
          <span className="font-body text-[13px] text-tc-muted">
            Organiser <span className="text-tc-white font-medium">{e.organizerAddress.slice(0, 8)}…{e.organizerAddress.slice(-6)}</span>
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-8">
          <div className="bg-tc-surface border border-tc-border rounded-xl p-3 flex items-start gap-3">
            <Calendar className="w-5 h-5 text-tc-lime shrink-0" />
            <div>
              <p className="text-[11px] text-tc-muted uppercase tracking-wider">Date</p>
              <p className="text-[14px] font-medium text-tc-white mt-0.5">{dateFormatted}</p>
            </div>
          </div>
          <div className="bg-tc-surface border border-tc-border rounded-xl p-3 flex items-start gap-3">
            <Clock className="w-5 h-5 text-tc-lime shrink-0" />
            <div>
              <p className="text-[11px] text-tc-muted uppercase tracking-wider">Time</p>
              <p className="text-[14px] font-medium text-tc-white mt-0.5">{formatTimeFromIso(e.date)}</p>
            </div>
          </div>
          <div className="col-span-2 bg-tc-surface border border-tc-border rounded-xl p-3 flex items-start gap-3">
            <MapPin className="w-5 h-5 text-tc-lime shrink-0" />
            <div>
              <p className="text-[11px] text-tc-muted uppercase tracking-wider">Venue</p>
              <p className="text-[14px] font-medium text-tc-white mt-0.5">{e.venue}</p>
            </div>
          </div>
        </div>

        <div className="mb-8">
          <h3 className="font-display font-bold text-[18px] text-tc-white mb-3 flex items-center gap-2">
            <Info className="w-5 h-5 text-tc-lime" />
            About Event
          </h3>
          <p className="font-body text-[14px] text-tc-muted leading-relaxed">
            Tickets on sale. {e.ticketSupply} total, {sold} sold.
          </p>
        </div>
      </div>

      {/* Fixed status/error bar above the footer */}
      {(buyStatus || buyError) && (
        <div className="fixed left-0 right-0 bottom-[5.5rem] z-40 px-4 py-3 bg-tc-surface border-y border-tc-border shadow-lg">
          <div className="max-w-3xl mx-auto flex flex-col gap-2">
            {buyStatus && (
              <p className="font-body text-[14px] text-tc-lime flex items-center gap-2">
                <span className="animate-spin inline-block w-4 h-4 rounded-full border-2 border-tc-lime border-t-transparent shrink-0" />
                <span>{buyStatus}</span>
              </p>
            )}
            {buyError && (
              <>
                <p className="font-body text-[14px] text-tc-white leading-snug">
                  {buyError}
                </p>
                <div className="flex items-center gap-2 flex-wrap">
                  {buyErrorAlreadyOwned && (
                    <button
                      type="button"
                      onClick={() => { setBuyError(null); setBuyErrorAlreadyOwned(false); navigate('/my-tickets') }}
                      className="px-3 py-1.5 rounded-lg font-medium text-[13px] text-tc-bg bg-tc-lime hover:bg-tc-lime/90"
                    >
                      View My Tickets
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => { setBuyError(null); setBuyErrorAlreadyOwned(false) }}
                    className="px-3 py-1.5 rounded-lg font-medium text-[13px] text-tc-muted hover:text-tc-white border border-tc-border hover:border-tc-muted"
                  >
                    Dismiss
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-tc-bg/95 backdrop-blur-xl border-t border-tc-border z-30">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-4">
          <div>
            <p className="text-[11px] text-tc-muted uppercase tracking-wider mb-0.5">Total Price</p>
            <div className="flex items-baseline gap-1">
              <span className="font-mono font-bold text-[20px] text-tc-white">
                {isFree ? 'FREE' : `${e.priceAlgo} ALGO`}
              </span>
              {!isFree && <span className="text-[11px] text-tc-muted">/ person</span>}
            </div>
          </div>
          <motion.button
            type="button"
            whileTap={!buyingId && !soldOut ? { scale: 0.96 } : undefined}
            onClick={(ev) => {
              ev.preventDefault()
              ev.stopPropagation()
              handleBuyApiEvent(e)
            }}
            className={`px-8 py-3 rounded-xl font-display font-bold text-[15px] tracking-wide shadow-lg shadow-tc-lime/20 flex-1 max-w-[200px] ${
              soldOut || buyingId
                ? 'bg-tc-surface text-tc-muted cursor-not-allowed border border-tc-border'
                : !activeAddress || !transactionSigner
                  ? 'bg-tc-dim text-tc-muted cursor-not-allowed border border-tc-border'
                  : 'bg-tc-lime text-black hover:bg-tc-lime/90'
            }`}
            disabled={soldOut || !!buyingId || !activeAddress || !transactionSigner}
          >
            {buyingId === e.id ? 'Buying…' : soldOut ? 'Sold Out' : !activeAddress ? 'Connect wallet' : 'Book Now'}
          </motion.button>
        </div>
      </div>
    </div>
  )
}
