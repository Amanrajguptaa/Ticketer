import { decodeAddress } from 'algosdk'
import { useWallet } from '@txnlab/use-wallet-react'
import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { QrCode, X } from 'lucide-react'
import { Html5QrcodeScanner } from 'html5-qrcode'
import { AlgorandClient } from '@algorandfoundation/algokit-utils'
import { ellipseAddress } from '../utils/ellipseAddress'
import { getTicket, verifyTicket, type VerifyResult } from '../api/events'
import { TicketerContractsClient } from '../contracts/TicketerContracts'
import { getAlgodConfigFromViteEnvironment, getIndexerConfigFromViteEnvironment } from '../utils/network/getAlgoClientConfigs'

const ORGANIZER_VERIFY_QR_ID = 'organizer-verify-ticket-qr'

function extractTicketIdFromScan(text: string): string {
  const raw = String(text).trim()
  const match = raw.match(/\/tickets\/([^/?#]+)/i) || raw.match(/([a-zA-Z0-9_-]{20,})/)
  return match ? (match[1] ?? raw) : raw
}

interface VerifyTicketDialogProps {
  open: boolean
  onClose: () => void
}

export function VerifyTicketDialog({ open, onClose }: VerifyTicketDialogProps) {
  const { activeAddress, transactionSigner } = useWallet()
  const scannerRef = useRef<Html5QrcodeScanner | null>(null)

  const [ticketId, setTicketId] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<VerifyResult | null>(null)
  const [showScanner, setShowScanner] = useState(false)

  useEffect(() => {
    if (!open) {
      setTicketId('')
      setResult(null)
      setShowScanner(false)
      scannerRef.current?.clear().catch(() => {})
      scannerRef.current = null
    }
  }, [open])

  useEffect(() => {
    if (!open || !showScanner) return
    const el = document.getElementById(ORGANIZER_VERIFY_QR_ID)
    if (!el) return
    const scanner = new Html5QrcodeScanner(
      ORGANIZER_VERIFY_QR_ID,
      { fps: 10, qrbox: { width: 220, height: 220 } },
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
  }, [open, showScanner])

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
        ? 'Your wallet has no ALGO. Send a small amount (e.g. 0.1 ALGO) to pay transaction fees.'
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

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2 }}
        className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-xl border border-tc-border bg-tc-surface shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-tc-border">
          <h2 className="font-display font-bold text-lg bg-gradient-to-r from-tc-lime via-tc-white to-tc-lime bg-clip-text text-transparent">
            Verify ticket
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-tc-muted hover:text-tc-white hover:bg-tc-dim transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {!result ? (
            <>
              {showScanner ? (
                <>
                  <p className="text-tc-muted font-body text-sm">
                    Point the camera at the ticket QR code.
                  </p>
                  <div
                    id={ORGANIZER_VERIFY_QR_ID}
                    className="rounded-xl overflow-hidden bg-black mx-auto w-full max-w-[280px]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowScanner(false)}
                    className="w-full py-2.5 rounded-xl border border-tc-border text-tc-white font-body text-sm font-medium hover:bg-tc-dim transition-colors"
                  >
                    Cancel scan
                  </button>
                </>
              ) : (
                <>
                  <p className="text-tc-muted font-body text-sm">
                    Scan the ticket QR code or paste the ticket ID below.
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowScanner(true)}
                    className="w-full py-3 rounded-xl border border-tc-border text-tc-white font-body text-sm font-semibold flex items-center justify-center gap-2 hover:bg-tc-dim transition-colors"
                  >
                    <QrCode className="w-5 h-5" />
                    Scan QR code
                  </button>
                  <input
                    type="text"
                    value={ticketId}
                    onChange={(e) => setTicketId(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleVerify()}
                    placeholder="Or paste ticket ID…"
                    className="w-full px-3 py-2.5 rounded-xl bg-tc-bg border border-tc-border text-tc-white placeholder-tc-muted font-mono text-sm focus:outline-none focus:border-tc-lime/50"
                  />
                  <button
                    type="button"
                    onClick={handleVerify}
                    disabled={!ticketId.trim() || loading}
                    className="w-full py-3 rounded-xl text-tc-bg font-body text-sm font-semibold disabled:opacity-50 bg-tc-lime hover:bg-tc-lime/90 transition-colors"
                  >
                    {loading ? 'Verifying…' : 'Verify & check in'}
                  </button>
                </>
              )}
            </>
          ) : result.valid ? (
            <div className="p-4 rounded-xl border-2 border-tc-teal bg-tc-teal/10 space-y-3">
              <div className="text-center">
                <div className="text-5xl mb-2">✅</div>
                <h3 className="font-display font-bold text-xl text-tc-teal">Valid — Checked in</h3>
              </div>
              <div className="space-y-1.5 text-sm font-body">
                <div className="flex justify-between">
                  <span className="text-tc-muted">Event</span>
                  <span className="font-medium text-tc-white">{result.ticket?.eventName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-tc-muted">Venue</span>
                  <span className="font-medium text-tc-white">{result.ticket?.venue}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-tc-muted">Wallet</span>
                  <span className="font-mono text-xs text-tc-white">{ellipseAddress(result.ticket?.buyerAddress ?? '')}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={reset}
                className="w-full py-2.5 rounded-xl text-tc-bg font-body text-sm font-semibold bg-tc-lime hover:bg-tc-lime/90"
              >
                Scan next ticket
              </button>
            </div>
          ) : (
            <div className="p-4 rounded-xl border-2 border-tc-coral bg-tc-coral/10 space-y-3">
              <div className="text-center">
                <div className="text-5xl mb-2">❌</div>
                <h3 className="font-display font-bold text-xl text-tc-coral">Invalid</h3>
                <p className="text-tc-muted mt-1 font-body text-sm">{result.reason}</p>
              </div>
              {result.usedTicket && (
                <div className="space-y-1 text-sm font-body border-t border-tc-border pt-2">
                  <p className="text-tc-muted text-xs">Already used:</p>
                  <div className="flex justify-between">
                    <span className="text-tc-muted">Event</span>
                    <span className="text-tc-white">{result.usedTicket.eventName}</span>
                  </div>
                </div>
              )}
              <button
                type="button"
                onClick={reset}
                className="w-full py-2.5 rounded-xl text-tc-white font-body text-sm font-semibold bg-tc-coral/20 border border-tc-coral hover:bg-tc-coral/30"
              >
                Try another ticket
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}
