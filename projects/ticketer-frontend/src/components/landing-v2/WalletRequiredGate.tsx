import { useState, useEffect } from 'react'
import { useWallet } from '@txnlab/use-wallet-react'
import ConnectWallet from '../ConnectWallet'

/**
 * Full-screen gate for signup flow: user must connect wallet before
 * they can access role selection, name, interests, or complete.
 */
export function WalletRequiredGate() {
  const { activeAddress } = useWallet()
  const [openModal, setOpenModal] = useState(true)

  useEffect(() => {
    if (!activeAddress) {
      setOpenModal(true)
    }
  }, [activeAddress])

  return (
    <div className="min-h-screen bg-tc-bg relative overflow-hidden flex flex-col items-center justify-center px-6">
      <div
        className="absolute inset-0 opacity-[0.07] pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(to right, #C8E64A 1px, transparent 1px), linear-gradient(to bottom, #C8E64A 1px, transparent 1px)`,
          backgroundSize: '32px 32px',
        }}
      />

      <div className="relative z-10 text-center max-w-md">
        <h1 className="font-display font-extrabold text-[28px] md:text-[34px] text-tc-white leading-tight mb-3">
          Connect your wallet to continue
        </h1>
        <p className="font-body text-[15px] text-tc-muted mb-8 leading-relaxed">
          You need to connect an Algorand wallet (Pera, Defly, or Exodus) before you can create your account.
        </p>
        <button
          type="button"
          onClick={() => setOpenModal(true)}
          className="px-6 py-3.5 rounded-lg font-body font-semibold text-tc-bg bg-tc-lime hover:bg-tc-lime/90 transition-colors"
        >
          Connect wallet
        </button>
      </div>

      <ConnectWallet
        openModal={openModal}
        closeModal={() => setOpenModal(false)}
      />
    </div>
  )
}
