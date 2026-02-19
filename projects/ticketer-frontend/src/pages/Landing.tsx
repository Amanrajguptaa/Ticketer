import { useWallet } from '@txnlab/use-wallet-react'
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import ConnectWallet from '../components/ConnectWallet'
import { useAuth, type UserRole } from '../context/AuthContext'
import { getProfile, createProfile, type ProfileRole } from '../api/profile'

export default function Landing() {
  const { activeAddress } = useWallet()
  const { role, setRole } = useAuth()
  const navigate = useNavigate()
  const [openWalletModal, setOpenWalletModal] = useState(false)
  const [profileLoading, setProfileLoading] = useState(false)
  const [profileError, setProfileError] = useState<string | null>(null)
  const [signUpLoading, setSignUpLoading] = useState(false)
  const [signUpError, setSignUpError] = useState<string | null>(null)

  // When wallet connects, fetch profile from backend
  useEffect(() => {
    if (!activeAddress) {
      setRole(null)
      setProfileError(null)
      return
    }
    let cancelled = false
    setProfileLoading(true)
    setProfileError(null)
    getProfile(activeAddress)
      .then((profile) => {
        if (!cancelled && profile) setRole(profile.role as UserRole)
      })
      .catch((err) => {
        if (!cancelled) setProfileError(err instanceof Error ? err.message : 'Failed to load profile')
      })
      .finally(() => {
        if (!cancelled) setProfileLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [activeAddress, setRole])

  // Auto-redirect to dashboard when we have role
  useEffect(() => {
    if (!activeAddress || !role) return
    if (role === 'organizer') navigate('/organizer', { replace: true })
    else if (role === 'student') navigate('/tickets', { replace: true })
    else if (role === 'gate') navigate('/verify', { replace: true })
  }, [activeAddress, role, navigate])

  const handleSignUp = async (selectedRole: UserRole) => {
    if (!activeAddress) return
    setSignUpError(null)
    setSignUpLoading(true)
    try {
      await createProfile(activeAddress, selectedRole as ProfileRole)
      setRole(selectedRole)
      if (selectedRole === 'organizer') navigate('/organizer')
      else if (selectedRole === 'student') navigate('/tickets')
      else navigate('/verify')
    } catch (err) {
      setSignUpError(err instanceof Error ? err.message : 'Sign up failed')
    } finally {
      setSignUpLoading(false)
    }
  }

  const needsSignUp = activeAddress && !profileLoading && !role && !profileError

  return (
    <div className="min-h-screen bg-[#0f172a] text-white">
      <header className="px-4 py-6 flex flex-wrap items-center justify-between gap-4 border-b border-white/10">
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold tracking-tight" style={{ color: '#1A56DB' }}>
            TicketChain
          </span>
          <span className="text-sm text-gray-400 hidden sm:inline">Your ticket. On-chain. Forever.</span>
        </div>
        <button
          onClick={() => setOpenWalletModal(true)}
          className="btn border-2 font-semibold rounded-lg px-4 py-2 transition-colors"
          style={{ borderColor: '#1A56DB', color: activeAddress ? '#22c55e' : '#F59E0B' }}
        >
          {activeAddress ? `Connected · ${activeAddress.slice(0, 6)}...${activeAddress.slice(-4)}` : 'Connect Wallet'}
        </button>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-12 sm:py-16">
        <section className="text-center mb-16">
          <h1 className="text-4xl sm:text-5xl font-bold mb-4" style={{ color: '#e2e8f0' }}>
            Your ticket lives on the blockchain
          </h1>
          <p className="text-xl text-gray-400 mb-2">Unfakeable. Unstealable.</p>
          <p className="text-gray-500 max-w-xl mx-auto">
            NFT tickets on Algorand — verified at the gate, no central database, no screenshots.
          </p>
        </section>

        {/* How it works */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold mb-6" style={{ color: '#1A56DB' }}>
            How it works
          </h2>
          <div className="grid sm:grid-cols-3 gap-6">
            {[
              { step: 1, title: 'Create Event', desc: 'Organizers set supply, price, and mint NFT tickets.' },
              { step: 2, title: 'Buy Ticket (NFT)', desc: 'Students pay in ALGO; ticket is sent to their wallet.' },
              { step: 3, title: 'Scan & Enter', desc: 'Gate scans QR; on-chain check grants or denies entry.' },
            ].map(({ step, title, desc }) => (
              <div
                key={step}
                className="p-5 rounded-xl border border-white/10 bg-white/5"
              >
                <span className="inline-flex items-center justify-center w-10 h-10 rounded-full font-bold text-lg mb-3" style={{ backgroundColor: '#1A56DB', color: '#fff' }}>
                  {step}
                </span>
                <h3 className="font-semibold text-lg mb-1">{title}</h3>
                <p className="text-sm text-gray-400">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Loading profile after connect */}
        {activeAddress && profileLoading && (
          <section className="mb-16 p-6 rounded-xl border border-white/10 bg-white/5 text-center">
            <p className="text-gray-400">Checking your account…</p>
          </section>
        )}

        {/* Profile fetch error */}
        {activeAddress && profileError && !profileLoading && (
          <section className="mb-16 p-6 rounded-xl border border-red-500/30 bg-red-500/10">
            <p className="text-red-400 mb-2">{profileError}</p>
            <button
              onClick={() => window.location.reload()}
              className="btn btn-sm border border-white/20 text-white"
            >
              Retry
            </button>
          </section>
        )}

        {/* Sign up — no profile in DB yet: "Are you an Organizer or a Student?" */}
        {needsSignUp && (
          <section className="mb-16 p-6 rounded-xl border border-white/10 bg-white/5">
            <h2 className="text-xl font-bold mb-2" style={{ color: '#F59E0B' }}>
              Sign up
            </h2>
            <p className="text-gray-400 mb-4">Are you an Organizer or a Student? This choice is saved to your account.</p>
            {signUpError && (
              <p className="text-red-400 text-sm mb-4">{signUpError}</p>
            )}
            <div className="grid sm:grid-cols-3 gap-4">
              <button
                onClick={() => handleSignUp('organizer')}
                disabled={signUpLoading}
                className="p-4 rounded-lg border-2 border-white/20 hover:border-[#1A56DB] hover:bg-white/5 transition-colors text-left disabled:opacity-50"
              >
                <span className="font-semibold block mb-1">Organizer</span>
                <span className="text-sm text-gray-400">Create events, set tickets, view sales</span>
              </button>
              <button
                onClick={() => handleSignUp('student')}
                disabled={signUpLoading}
                className="p-4 rounded-lg border-2 border-white/20 hover:border-[#1A56DB] hover:bg-white/5 transition-colors text-left disabled:opacity-50"
              >
                <span className="font-semibold block mb-1">Student / Attendee</span>
                <span className="text-sm text-gray-400">Buy tickets, view My Tickets</span>
              </button>
              <button
                onClick={() => handleSignUp('gate')}
                disabled={signUpLoading}
                className="p-4 rounded-lg border-2 border-white/20 hover:border-[#1A56DB] hover:bg-white/5 transition-colors text-left disabled:opacity-50"
              >
                <span className="font-semibold block mb-1">Gate Verifier</span>
                <span className="text-sm text-gray-400">Scan QR, verify NFT at entry</span>
              </button>
            </div>
            {signUpLoading && <p className="text-gray-400 text-sm mt-4">Saving…</p>}
          </section>
        )}

        {/* CTAs when not connected */}
        {!activeAddress && (
          <section className="flex flex-wrap gap-4 justify-center">
            <button
              onClick={() => setOpenWalletModal(true)}
              className="btn font-semibold rounded-lg px-6 py-3"
              style={{ backgroundColor: '#1A56DB', color: '#fff' }}
            >
              Create Your Event
            </button>
            <button
              onClick={() => setOpenWalletModal(true)}
              className="btn font-semibold rounded-lg px-6 py-3 border-2"
              style={{ borderColor: '#F59E0B', color: '#F59E0B' }}
            >
              Browse Events
            </button>
          </section>
        )}

        {activeAddress && role && (
          <section className="flex flex-wrap gap-4 justify-center">
            <button
              onClick={() => navigate(role === 'organizer' ? '/organizer' : role === 'student' ? '/tickets' : '/verify')}
              className="btn font-semibold rounded-lg px-6 py-3"
              style={{ backgroundColor: '#1A56DB', color: '#fff' }}
            >
              Go to {role === 'organizer' ? 'Dashboard' : role === 'student' ? 'My Tickets' : 'Gate Verifier'}
            </button>
          </section>
        )}
      </main>

      <ConnectWallet openModal={openWalletModal} closeModal={() => setOpenWalletModal(false)} />
    </div>
  )
}
