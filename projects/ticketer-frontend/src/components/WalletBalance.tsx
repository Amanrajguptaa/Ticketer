import { useEffect, useState } from 'react'
import { AlgorandClient } from '@algorandfoundation/algokit-utils'
import { getAlgodConfigFromViteEnvironment, getIndexerConfigFromViteEnvironment } from '../utils/network/getAlgoClientConfigs'
import { ellipseAddress } from '../utils/ellipseAddress'

function WalletIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 12V7H5a2 2 0 01 0-4h14v4" />
      <path d="M3 5v14a2 2 0 002 2h16v-5" />
      <path d="M18 12a2 2 0 000 4h4v-4h-4z" />
    </svg>
  )
}

interface WalletBalanceProps {
  address: string | undefined
  className?: string
  /** Use 'dark' for OrganizerDashboard (tc theme), 'light' for StudentTickets/GateVerifier */
  variant?: 'dark' | 'light'
}

export function WalletBalance({ address, className = '', variant = 'dark' }: WalletBalanceProps) {
  const [balanceAlgo, setBalanceAlgo] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!address) {
      setBalanceAlgo(null)
      setLoading(false)
      return
    }
    let cancelled = false
    setLoading(true)
    const algodConfig = getAlgodConfigFromViteEnvironment()
    const indexerConfig = getIndexerConfigFromViteEnvironment()
    const algorand = AlgorandClient.fromConfig({ algodConfig, indexerConfig })
    algorand.account
      .getInformation(address)
      .then((info) => {
        if (cancelled) return
        const microAlgos = Number(info.balance.microAlgos)
        setBalanceAlgo(microAlgos / 1_000_000)
      })
      .catch(() => {
        if (!cancelled) setBalanceAlgo(null)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [address])

  if (!address) return null

  const isDark = variant === 'dark'
  const textClass = isDark ? 'text-tc-muted' : 'text-gray-400'
  const accentClass = isDark ? 'text-tc-lime' : 'text-blue-400'

  return (
    <div
      className={`inline-flex items-center gap-2 font-body text-sm border border-tc-border rounded-lg px-2 py-1 ${textClass} ${className}`}
      title={`${balanceAlgo != null ? `${balanceAlgo.toFixed(4)} ALGO` : 'Balance'} · ${address}`}
    >
      <span
        className={`flex items-center justify-center w-7 h-7 rounded-lg flex-shrink-0 ${
          isDark ? 'bg-tc-lime/15 text-tc-lime' : 'bg-blue-500/15 text-blue-400'
        }`}
        aria-hidden
      >
        <WalletIcon className="w-4 h-4" />
      </span>
      {loading ? (
        <span className="tabular-nums">—</span>
      ) : balanceAlgo != null ? (
        <span className={`font-semibold tabular-nums ${accentClass}`}>{balanceAlgo.toFixed(2)} ALGO</span>
      ) : (
        <span className="tabular-nums">—</span>
      )}
      <span className="hidden sm:inline font-mono text-xs opacity-90">{ellipseAddress(address)}</span>
    </div>
  )
}
