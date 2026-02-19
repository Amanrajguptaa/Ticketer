import { decodeAddress } from 'algosdk'
import { useWallet } from '@txnlab/use-wallet-react'
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, QrCode } from 'lucide-react'
import { Html5QrcodeScanner } from 'html5-qrcode'
import { AlgorandClient } from '@algorandfoundation/algokit-utils'
import { useAuth } from '../context/AuthContext'
import { ellipseAddress } from '../utils/ellipseAddress'
import { getTicket, verifyTicket, type VerifyResult } from '../api/events'
import { TicketerContractsClient } from '../contracts/TicketerContracts'
import { getAlgodConfigFromViteEnvironment, getIndexerConfigFromViteEnvironment } from '../utils/network/getAlgoClientConfigs'

const GATE_QR_SCAN_ID = 'verify-ticket-qr-scanner'

function extractTicketIdFromScan(text: string): string {
  const raw = String(text).trim()
  const match = raw.match(/\/tickets\/([^/?#]+)/i) || raw.match(/([a-zA-Z0-9_-]{20,})/)
  return match ? (match[1] ?? raw) : raw
}

/** Allowed roles for the verify-ticket page (guard/gate post wallet connection). */
function canVerify(role: string | null): boolean {
  return role === 'gate' || role === 'guard' || role === 'organizer'
}

export default function VerifyTicketPage() {
  const { activeAddress, wallets, transactionSigner } = useWallet()
  const { role, clearRole } = useAuth()
  const navigate = useNavigate()
  const scannerRef = useRef<Html5QrcodeScanner | null>(null)

  const [ticketId, setTicketId] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<VerifyResult | null>(null)
  const [showScanner, setShowScanner] = useState(false)

  const goHome = async () => {
    const activeWallet = wallets?.find((w) => w.isActive)
    if (activeWallet) await activeWallet.disconnect()
    clearRole()
    navigate('/')
  }

  useEffect(() => {
    if (!activeAddress) {
      navigate('/')
      return
    }
    if (!canVerify(role)) {
      navigate('/')
      return
    }
  }, [activeAddress, role, navigate])

  useEffect(() => {
    if (!showScanner) return
    const scanner = new Html5QrcodeScanner(
      GATE_QR_SCAN_ID,
      { fps: 10, qrbox: { width: 250, height: 250 } },
      false,
    )
    scannerRef.current = scanner
    scanner.render(
      (decodedText) => {
        const id = extractTicketIdFromScan(decodedText)
        if (id) {
          setTicketId(id)
          setShowScanner(false)
        }
        scanner.clear().catch(() => {})
        scannerRef.current = null
      },
      () => {},
    )
    return () => {
      scanner.clear().catch(() => {})
      scannerRef.current = null
    }
  }, [showScanner])

  const handleVerify = async () => {
    const sender = activeAddress ?? ''
    const id = ticketId.trim()
    if (!id || loading || !sender) return
    setLoading(true)
    setResult(null)
    try {
      const ticket = await getTicket(id)
      if (!ticket) {
        setResult({ valid: false, reason: 'Ticket not found' })
        return
      }
      if (ticket.used) {
        setResult({
          valid: false,
          reason: 'Ticket already used',
          usedTicket: {
            id: ticket.id,
            eventName: ticket.event.name,
            buyerAddress: ticket.buyerAddress,
          },
        })
        return
      }

      if (ticket.event.appId && ticket.event.appAddress) {
        let ticketHolderAddress: string
        try {
          decodeAddress(ticket.buyerAddress.toUpperCase())
          ticketHolderAddress = ticket.buyerAddress.toUpperCase()
        } catch {
          setResult({
            valid: false,
            reason: 'Invalid ticket data: buyer address is missing or not a valid Algorand address.',
          })
          return
        }
        const algodConfig = getAlgodConfigFromViteEnvironment()
        const indexerConfig = getIndexerConfigFromViteEnvironment()
        const algorand = AlgorandClient.fromConfig({ algodConfig, indexerConfig })
        algorand.setDefaultSigner(transactionSigner)
        algorand.account.setSigner(sender, transactionSigner)
        const appClient = new TicketerContractsClient({
          appId: BigInt(ticket.event.appId),
          defaultSender: sender,
          algorand,
        })
        await appClient.send.verifyAndUse({
          args: { ticketHolder: ticketHolderAddress },
          sender,
          signer: transactionSigner,
        })
      }

      const res = await verifyTicket(id)
      setResult(res)
    } catch (err) {
      const raw = err instanceof Error ? err.message : String(err)
      const isOverspend = /overspend|insufficient|MicroAlgos.*Raw:0/i.test(raw)
      const message = isOverspend
        ? 'Your wallet has no ALGO. Send a small amount (e.g. 0.1 ALGO) to your connected wallet to pay transaction fees.'
        : raw || 'Verification failed'
      setResult({ valid: false, reason: message })
    } finally {
      setLoading(false)
    }
  }

  const reset = () => {
    setTicketId('')
    setResult(null)
    setShowScanner(false)
  }

  if (!activeAddress || !canVerify(role)) return null

  return (
    <div className="min-h-screen bg-tc-bg text-tc-white">
      <header className="px-4 py-4 flex items-center justify-between border-b border-tc-border">
        <button
          type="button"
          onClick={goHome}
          className="p-2 -m-2 text-tc-muted hover:text-tc-white transition-colors"
          aria-label="Back"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <span className="font-display font-bold text-tc-lime">TicketChain</span>
      </header>

      <main className="max-w-lg mx-auto px-4 py-8">
        <h1 className="font-display font-bold text-2xl mb-6">Verify Ticket</h1>

        {!result ? (
          <div className="p-6 rounded-2xl border border-tc-border bg-tc-surface space-y-4">
            {showScanner ? (
              <>
                <p className="text-tc-muted font-body text-sm">
                  Point the camera at the student&apos;s ticket QR code.
                </p>
                <div id={GATE_QR_SCAN_ID} className="rounded-xl overflow-hidden bg-black" />
                <button
                  type="button"
                  onClick={() => setShowScanner(false)}
                  className="w-full py-3 rounded-xl border border-tc-border text-tc-white font-body font-semibold hover:bg-tc-surface"
                >
                  Cancel
                </button>
              </>
            ) : (
              <>
                <p className="text-tc-muted font-body text-sm">
                  Scan the student&apos;s ticket QR code or paste the ticket ID below.
                </p>
                <button
                  type="button"
                  onClick={() => setShowScanner(true)}
                  className="w-full py-3 rounded-xl border border-tc-border text-tc-white font-body font-semibold flex items-center justify-center gap-2 hover:bg-tc-surface transition-colors"
                >
                  <QrCode className="w-5 h-5" />
                  Scan QR code
                </button>
                <input
                  type="text"
                  value={ticketId}
                  onChange={(e) => setTicketId(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleVerify()}
                  placeholder="Or paste ticket ID here…"
                  className="w-full px-4 py-3 rounded-xl bg-tc-bg border border-tc-border text-tc-white placeholder-tc-muted font-mono text-sm"
                />
                <button
                  type="button"
                  onClick={handleVerify}
                  disabled={!ticketId.trim() || loading}
                  className="w-full py-3 rounded-xl text-tc-bg font-body font-semibold disabled:opacity-50 bg-tc-lime hover:bg-tc-lime/90 transition-colors"
                >
                  {loading ? 'Verifying…' : 'Verify & Check In'}
                </button>
              </>
            )}
          </div>
        ) : result.valid ? (
          <div className="p-6 rounded-2xl border-2 border-tc-teal bg-tc-teal/10 space-y-4">
            <div className="text-center">
              <div className="text-6xl mb-3">✅</div>
              <h2 className="font-display font-bold text-2xl text-tc-teal">VALID — Checked In</h2>
            </div>
            <div className="space-y-2 text-sm font-body">
              <div className="flex justify-between">
                <span className="text-tc-muted">Event</span>
                <span className="font-medium text-tc-white">{result.ticket?.eventName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-tc-muted">Venue</span>
                <span className="font-medium text-tc-white">{result.ticket?.venue}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-tc-muted">Date</span>
                <span className="font-medium text-tc-white">
                  {result.ticket?.date && new Date(result.ticket.date).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-tc-muted">Wallet</span>
                <span className="font-mono text-xs text-tc-white">{ellipseAddress(result.ticket?.buyerAddress ?? '')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-tc-muted">Ticket</span>
                <span className="font-mono text-xs text-tc-white">{result.ticket?.id}</span>
              </div>
            </div>
            <button
              type="button"
              onClick={reset}
              className="w-full py-3 rounded-xl text-tc-bg font-body font-semibold mt-4 bg-tc-lime hover:bg-tc-lime/90"
            >
              Scan Next Ticket
            </button>
          </div>
        ) : (
          <div className="p-6 rounded-2xl border-2 border-tc-coral bg-tc-coral/10 space-y-4">
            <div className="text-center">
              <div className="text-6xl mb-3">❌</div>
              <h2 className="font-display font-bold text-2xl text-tc-coral">INVALID</h2>
              <p className="text-tc-muted mt-2 font-body">{result.reason}</p>
            </div>
            {result.usedTicket && (
              <div className="space-y-2 text-sm font-body border-t border-tc-border pt-3">
                <p className="text-tc-muted text-xs">This ticket was already used:</p>
                <div className="flex justify-between">
                  <span className="text-tc-muted">Event</span>
                  <span className="text-tc-white">{result.usedTicket.eventName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-tc-muted">Wallet</span>
                  <span className="font-mono text-xs text-tc-white">{ellipseAddress(result.usedTicket.buyerAddress)}</span>
                </div>
              </div>
            )}
            <button
              type="button"
              onClick={reset}
              className="w-full py-3 rounded-xl text-tc-white font-body font-semibold mt-4 bg-tc-coral/20 border border-tc-coral hover:bg-tc-coral/30"
            >
              Try Another Ticket
            </button>
          </div>
        )}
      </main>
    </div>
  )
}
