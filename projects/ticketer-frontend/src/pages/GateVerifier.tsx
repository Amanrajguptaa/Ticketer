import { decodeAddress } from 'algosdk'
import { useWallet } from '@txnlab/use-wallet-react'
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Html5QrcodeScanner } from 'html5-qrcode'
import { AlgorandClient } from '@algorandfoundation/algokit-utils'
import { useAuth } from '../context/AuthContext'
import { ellipseAddress } from '../utils/ellipseAddress'
import { WalletBalance } from '../components/WalletBalance'
import { getTicket, verifyTicket, type VerifyResult } from '../api/events'
import { TicketerContractsClient } from '../contracts/TicketerContracts'
import { getAlgodConfigFromViteEnvironment, getIndexerConfigFromViteEnvironment } from '../utils/network/getAlgoClientConfigs'

const GATE_QR_SCAN_ID = 'gate-qr-scanner'

function extractTicketIdFromScan(text: string): string {
  const raw = String(text).trim()
  const match = raw.match(/\/tickets\/([^/?#]+)/i) || raw.match(/([a-zA-Z0-9_-]{20,})/)
  return match ? (match[1] ?? raw) : raw
}

export default function GateVerifier() {
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
    if (!activeAddress) { navigate('/'); return }
    if (role !== 'organizer' && role !== 'gate') { navigate('/'); return }
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

  if (!activeAddress || (role !== 'organizer' && role !== 'gate')) return null

  return (
    <div className="min-h-screen bg-[#0f172a] text-white">
      <header className="px-4 py-4 flex items-center justify-between border-b border-white/10">
        <div className="flex items-center gap-4">
          <button onClick={goHome} className="text-gray-400 hover:text-white">
            ← Back
          </button>
          <span className="font-bold" style={{ color: '#1A56DB' }}>TicketChain</span>
          <span className="text-gray-500">Verify tickets</span>
          {role === 'organizer' && (
            <button onClick={() => navigate('/organizer')} className="text-sm text-gray-400 hover:text-white">
              Dashboard
            </button>
          )}
        </div>
        <div className="flex items-center gap-2 text-sm">
          <WalletBalance address={activeAddress ?? undefined} variant="light" />
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Verify Ticket</h1>

        {!result ? (
          <div className="p-6 rounded-xl border border-white/10 bg-white/5 space-y-4">
            {showScanner ? (
              <>
                <p className="text-gray-400 text-sm">Point the camera at the student&apos;s ticket QR code.</p>
                <div id={GATE_QR_SCAN_ID} className="rounded-lg overflow-hidden bg-black" />
                <button
                  type="button"
                  onClick={() => setShowScanner(false)}
                  className="w-full py-3 rounded-lg border border-white/20 text-white font-semibold"
                >
                  Cancel
                </button>
              </>
            ) : (
              <>
                <p className="text-gray-400 text-sm">
                  Scan the student&apos;s ticket QR code or paste the ticket ID below.
                </p>
                <button
                  type="button"
                  onClick={() => setShowScanner(true)}
                  className="w-full py-3 rounded-lg border border-white/20 text-white font-semibold flex items-center justify-center gap-2"
                >
                  📷 Scan QR code
                </button>
                <input
                  type="text"
                  value={ticketId}
                  onChange={(e) => setTicketId(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleVerify()}
                  placeholder="Or paste ticket ID here…"
                  className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/20 text-white placeholder-gray-500 font-mono text-sm"
                />
                <button
                  onClick={handleVerify}
                  disabled={!ticketId.trim() || loading}
                  className="w-full py-3 rounded-lg text-white font-semibold disabled:opacity-50"
                  style={{ backgroundColor: '#1A56DB' }}
                >
                  {loading ? 'Verifying…' : 'Verify & Check In'}
                </button>
              </>
            )}
          </div>
        ) : result.valid ? (
          <div className="p-6 rounded-xl border-2 border-green-500 bg-green-500/10 space-y-4">
            <div className="text-center">
              <div className="text-6xl mb-3">✅</div>
              <h2 className="text-2xl font-bold text-green-400">VALID — Checked In</h2>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Event</span>
                <span className="font-medium">{result.ticket?.eventName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Venue</span>
                <span className="font-medium">{result.ticket?.venue}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Date</span>
                <span className="font-medium">
                  {result.ticket?.date && new Date(result.ticket.date).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Wallet</span>
                <span className="font-mono text-xs">{ellipseAddress(result.ticket?.buyerAddress ?? '')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Ticket</span>
                <span className="font-mono text-xs">{result.ticket?.id}</span>
              </div>
            </div>
            <button
              onClick={reset}
              className="w-full py-3 rounded-lg text-white font-semibold mt-4"
              style={{ backgroundColor: '#1A56DB' }}
            >
              Scan Next Ticket
            </button>
          </div>
        ) : (
          <div className="p-6 rounded-xl border-2 border-red-500 bg-red-500/10 space-y-4">
            <div className="text-center">
              <div className="text-6xl mb-3">❌</div>
              <h2 className="text-2xl font-bold text-red-400">INVALID</h2>
              <p className="text-gray-400 mt-2">{result.reason}</p>
            </div>
            {result.usedTicket && (
              <div className="space-y-2 text-sm border-t border-white/10 pt-3">
                <p className="text-gray-500 text-xs">This ticket was already used:</p>
                <div className="flex justify-between">
                  <span className="text-gray-400">Event</span>
                  <span>{result.usedTicket.eventName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Wallet</span>
                  <span className="font-mono text-xs">{ellipseAddress(result.usedTicket.buyerAddress)}</span>
                </div>
              </div>
            )}
            <button
              onClick={reset}
              className="w-full py-3 rounded-lg text-white font-semibold mt-4"
              style={{ backgroundColor: '#1A56DB' }}
            >
              Try Another Ticket
            </button>
          </div>
        )}
      </main>
    </div>
  )
}
