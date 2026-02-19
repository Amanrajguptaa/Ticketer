import { useWallet } from '@txnlab/use-wallet-react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { ellipseAddress } from '../utils/ellipseAddress'
import { verifyTicket, type VerifyResult } from '../api/events'

export default function GateVerifier() {
  const { activeAddress, wallets } = useWallet()
  const { role, clearRole } = useAuth()
  const navigate = useNavigate()

  const [ticketId, setTicketId] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<VerifyResult | null>(null)

  const goHome = async () => {
    const activeWallet = wallets?.find((w) => w.isActive)
    if (activeWallet) await activeWallet.disconnect()
    clearRole()
    navigate('/')
  }

  useEffect(() => {
    if (!activeAddress) { navigate('/'); return }
    if (role !== 'gate') { navigate('/'); return }
  }, [activeAddress, role, navigate])

  const handleVerify = async () => {
    const id = ticketId.trim()
    if (!id || loading) return
    setLoading(true)
    setResult(null)
    try {
      const res = await verifyTicket(id)
      setResult(res)
    } catch {
      setResult({ valid: false, reason: 'Network error — could not reach server' })
    } finally {
      setLoading(false)
    }
  }

  const reset = () => {
    setTicketId('')
    setResult(null)
  }

  if (!activeAddress || role !== 'gate') return null

  return (
    <div className="min-h-screen bg-[#0f172a] text-white">
      <header className="px-4 py-4 flex items-center justify-between border-b border-white/10">
        <div className="flex items-center gap-4">
          <button onClick={goHome} className="text-gray-400 hover:text-white">
            ← Back
          </button>
          <span className="font-bold" style={{ color: '#1A56DB' }}>TicketChain</span>
          <span className="text-gray-500">Gate Verifier</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <span>{ellipseAddress(activeAddress)}</span>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Verify Ticket</h1>

        {!result ? (
          <div className="p-6 rounded-xl border border-white/10 bg-white/5 space-y-4">
            <p className="text-gray-400 text-sm">
              Enter the ticket ID from the student's QR code, or paste it directly.
            </p>
            <input
              type="text"
              value={ticketId}
              onChange={(e) => setTicketId(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleVerify()}
              placeholder="Paste ticket ID here…"
              className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/20 text-white placeholder-gray-500 font-mono text-sm"
              autoFocus
            />
            <button
              onClick={handleVerify}
              disabled={!ticketId.trim() || loading}
              className="w-full py-3 rounded-lg text-white font-semibold disabled:opacity-50"
              style={{ backgroundColor: '#1A56DB' }}
            >
              {loading ? 'Verifying…' : 'Verify & Check In'}
            </button>
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
