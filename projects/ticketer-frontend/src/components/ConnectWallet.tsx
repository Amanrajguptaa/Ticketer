import { useWallet, Wallet, WalletId } from '@txnlab/use-wallet-react'
import Account from './Account'

interface ConnectWalletInterface {
  openModal: boolean
  closeModal: () => void
}

const ConnectWallet = ({ openModal, closeModal }: ConnectWalletInterface) => {
  const { wallets, activeAddress } = useWallet()

  const isKmd = (wallet: Wallet) => wallet.id === WalletId.KMD

  return (
    <dialog
      id="connect_wallet_modal"
      className={`modal ${openModal ? 'modal-open' : ''}`}
      onClose={() => closeModal()}
    >
      <form
        method="dialog"
        className="modal-box p-0 bg-tc-surface border border-tc-border rounded-xl overflow-hidden max-w-md shadow-2xl"
      >
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-tc-border">
          <h3 className="font-display font-bold text-xl text-tc-white tracking-tight">
            Connect wallet
          </h3>
          <p className="font-body text-sm text-tc-muted mt-1">
            Use your Algorand wallet to sign in (Pera, Defly, Exodus)
          </p>
        </div>

        {/* Content */}
        <div className="px-6 py-5">
          {activeAddress && (
            <div className="space-y-4 text-tc-white [&_a]:text-tc-lime [&_a:hover]:text-tc-lime/80 [&_a]:underline-offset-2">
              <Account />
              <div className="h-px bg-tc-border" />
            </div>
          )}

          {!activeAddress &&
            wallets?.map((wallet) => (
              <button
                type="button"
                data-test-id={`${wallet.id}-connect`}
                className="w-full flex items-center justify-center gap-3 px-4 py-3.5 rounded-lg font-body font-medium text-tc-white bg-tc-raised border border-tc-border hover:border-tc-lime/50 hover:bg-tc-dim transition-colors mb-3 last:mb-0"
                key={`provider-${wallet.id}`}
                onClick={() => wallet.connect()}
              >
                {!isKmd(wallet) && (
                  <img
                    alt={`${wallet.metadata.name} icon`}
                    src={wallet.metadata.icon}
                    className="w-7 h-7 object-contain flex-shrink-0"
                  />
                )}
                <span>{isKmd(wallet) ? 'LocalNet Wallet' : wallet.metadata.name}</span>
              </button>
            ))}
        </div>

        {/* Actions */}
        <div className="px-6 pb-6 pt-2 flex flex-wrap items-center justify-end gap-3 border-t border-tc-border">
          {activeAddress && (
            <button
              type="button"
              className="px-4 py-2.5 rounded-lg font-body font-medium text-tc-coral border border-tc-coral/50 hover:bg-tc-coral/10 transition-colors"
              data-test-id="logout"
              onClick={async () => {
                if (wallets) {
                  const activeWallet = wallets.find((w) => w.isActive)
                  if (activeWallet) {
                    await activeWallet.disconnect()
                  } else {
                    localStorage.removeItem('@txnlab/use-wallet:v3')
                    window.location.reload()
                  }
                }
              }}
            >
              Disconnect
            </button>
          )}
          <button
            type="submit"
            data-test-id="close-wallet-modal"
            className="px-5 py-2.5 rounded-lg font-body font-semibold text-tc-bg bg-tc-lime hover:bg-tc-lime/90 transition-colors"
            onClick={() => closeModal()}
          >
            {activeAddress ? 'Done' : 'Close'}
          </button>
        </div>
      </form>
      <form method="dialog" className="modal-backdrop bg-black/70">
        <button type="submit" tabIndex={-1} aria-hidden>
          close
        </button>
      </form>
    </dialog>
  )
}

export default ConnectWallet
