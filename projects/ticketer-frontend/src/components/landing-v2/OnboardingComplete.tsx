import React, { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { useWallet } from '@txnlab/use-wallet-react'
import { useOnboardingStore } from '../../store/onboardingStore'
import ConnectWallet from '../ConnectWallet'
import { useAuth } from '../../context/AuthContext'
import { loginUser, registerUser } from '../../api/auth'
import { saveAuth, saveProfile } from '../../utils/authStorage'
export const OnboardingComplete = ({
  onFinish,
  onBackToRoles,
}: {
  onFinish: () => void
  onBackToRoles?: () => void
}) => {
  const name = useOnboardingStore((s) => s.name)
  const role = useOnboardingStore((s) => s.role)
  const email = useOnboardingStore((s) => s.email)
  const interests = useOnboardingStore((s) => s.interests)
  const authMode = useOnboardingStore((s) => s.authMode)
  const password = useOnboardingStore((s) => s.password)
  const { activeAddress } = useWallet()
  const { setRole } = useAuth()
  const [openWalletModal, setOpenWalletModal] = useState(false)
  const [status, setStatus] = useState<'idle' | 'submitting' | 'done' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const isGuard = role === 'guard'
  const isStudent = role === 'student'

  useEffect(() => {
    if (!activeAddress) {
      setStatus('idle')
      setErrorMsg(null)
    }
  }, [activeAddress])

  const mapRole = (r: typeof role) => {
    if (r === 'organiser') return 'organizer' as const
    if (r === 'guard') return 'gate' as const
    return 'student' as const
  }

  const submitAuth = async (walletAddress: string) => {
    if (!email || !password) {
      setStatus('error')
      setErrorMsg('Missing email or password. Please go back and try again.')
      return
    }
    if (authMode === 'signup' && !role) return

    setStatus('submitting')
    setErrorMsg(null)

    try {
      if (authMode === 'signup') {
        const apiRole = mapRole(role!)
        const resp = await registerUser({
          name,
          email,
          password,
          role: apiRole,
          walletAddress,
          hobbies: apiRole === 'student' ? interests : [],
        })

        saveAuth(resp.token, resp.profile.walletAddress)
        saveProfile(resp.profile)
        setRole(resp.profile.role)
        setStatus('done')
        setTimeout(() => onFinish(), 800)
        return
      }

      // Login flow
      const resp = await loginUser({ email, password, walletAddress })
      saveAuth(resp.token, resp.profile.walletAddress)
      saveProfile(resp.profile)
      setRole(resp.profile.role)
      const storeRole = resp.profile.role === 'organizer' ? 'organiser' : resp.profile.role === 'gate' ? 'guard' : 'student'
      useOnboardingStore.getState().setRole(storeRole)
      useOnboardingStore.getState().setFormData({
        name: resp.profile.name ?? '',
        email: resp.profile.email ?? '',
        interests: resp.profile.hobbies ?? [],
      })
      setStatus('done')
      setTimeout(() => onFinish(), 800)
    } catch (e) {
      console.error(e)
      setStatus('error')
      setErrorMsg(e instanceof Error ? e.message : 'Something went wrong. Please try again.')
    }
  }

  // Call login or register API when we have wallet + credentials (after Sign In / Sign up or after connecting wallet)
  useEffect(() => {
    if (!activeAddress || !email?.trim() || !password) return
    if (status !== 'idle') return
    void submitAuth(String(activeAddress))
  }, [activeAddress, status, email, password])

  const dots = useMemo(() => {
    return Array.from({ length: 16 }).map((_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      duration: Math.random() * 3 + 2,
      delay: Math.random() * 2,
    }))
  }, [])

  const welcomeTitle = isStudent
    ? `You're in, ${name || 'Student'}`
    : isGuard
      ? `Welcome, ${name || 'Gate Guard'}`
      : `Welcome, ${name || 'Organizer'}`
  const welcomeSubtitle = isStudent
    ? 'Your campus awaits'
    : isGuard
      ? 'Scan tickets. Verify entry. Keep the vibe clean.'
      : 'Create events. Mint tickets. Run the gate.'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-tc-bg overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.07] pointer-events-none"
          style={{
            backgroundImage: `linear-gradient(to right, #C8E64A 1px, transparent 1px), linear-gradient(to bottom, #C8E64A 1px, transparent 1px)`,
            backgroundSize: '32px 32px',
          }}
        />
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none mix-blend-overlay bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
        <motion.div
          className="absolute -bottom-20 -left-20 w-[400px] h-[400px] rounded-full bg-tc-lime/5 blur-[80px] pointer-events-none"
          animate={{ x: [0, 20, 0], y: [0, -15, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute -top-40 -right-40 w-[300px] h-[300px] rounded-full bg-tc-teal/5 blur-[60px] pointer-events-none"
          animate={{ x: [0, -15, 0], y: [0, 20, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
        />
        {dots.map((dot) => (
          <motion.div
            key={dot.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.1, 0], y: [0, -10, 0] }}
            transition={{
              duration: dot.duration,
              repeat: Infinity,
              delay: dot.delay,
              ease: 'easeInOut',
            }}
            className="absolute bg-tc-lime rounded-full"
            style={{ left: dot.left, top: dot.top, width: 1, height: 1 }}
          />
        ))}
        <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.05)_50%)] bg-[length:100%_4px] z-10" />

        <div className="relative flex flex-col items-center justify-center z-20 px-4 py-12">
          <div className="relative mb-10">
            <motion.svg
              width="140"
              height="94"
              viewBox="0 0 96 64"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', stiffness: 180, damping: 14 }}
            >
              <motion.path
                d="M8 4H88C90.2 4 92 5.8 92 8V24C89 24 86.5 26.5 86.5 29.5C86.5 32.5 89 35 92 35V56C92 58.2 90.2 60 88 60H8C5.8 60 4 58.2 4 56V35C7 35 9.5 32.5 9.5 29.5C9.5 26.5 7 24 4 24V8C4 5.8 5.8 4 8 4Z"
                stroke="#C8E64A"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1.2, ease: 'easeInOut', delay: 0.2 }}
              />
              <motion.path
                d="M30 10V54"
                stroke="#C8E64A"
                strokeWidth="1"
                strokeDasharray="3 3"
                strokeLinecap="round"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 0.35 }}
                transition={{ duration: 0.6, delay: 1, ease: 'easeOut' }}
              />
              <motion.path
                d="M17 30L18.5 26L20 30L24 31.5L20 33L18.5 37L17 33L13 31.5Z"
                stroke="#C8E64A"
                strokeWidth="1"
                strokeLinejoin="round"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 0.5 }}
                transition={{ duration: 0.5, delay: 1.2, ease: 'easeOut' }}
              />
              <motion.path
                d="M40 22H78"
                stroke="#C8E64A"
                strokeWidth="1"
                strokeLinecap="round"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 0.3 }}
                transition={{ duration: 0.4, delay: 1.3, ease: 'easeOut' }}
              />
              <motion.path
                d="M40 30H66"
                stroke="#C8E64A"
                strokeWidth="1"
                strokeLinecap="round"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 0.2 }}
                transition={{ duration: 0.4, delay: 1.45, ease: 'easeOut' }}
              />
              <motion.path
                d="M40 38H56"
                stroke="#C8E64A"
                strokeWidth="1"
                strokeLinecap="round"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 0.15 }}
                transition={{ duration: 0.4, delay: 1.6, ease: 'easeOut' }}
              />
            </motion.svg>
            <motion.div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-tc-lime/20 rounded-full blur-2xl"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: [0, 4], opacity: [0, 0.5, 0] }}
              transition={{ duration: 0.8, delay: 1.8, ease: 'easeOut' }}
            />
          </div>

          <motion.h1
            initial={{ y: 24, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.4 }}
            className="font-display font-black text-[42px] sm:text-[52px] md:text-[64px] tracking-[-0.03em] leading-none bg-gradient-to-r from-tc-lime via-white to-tc-lime bg-clip-text text-transparent text-center"
          >
            {welcomeTitle}
          </motion.h1>

          <motion.p
            initial={{ y: 12, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, ease: 'easeOut', delay: 0.6 }}
            className="mt-4 font-body font-medium text-[13px] sm:text-[14px] md:text-[15px] tracking-[0.12em] uppercase text-center"
            style={{
              background: 'linear-gradient(90deg, #6B6B6B, #C8E64A, #6B6B6B)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            {welcomeSubtitle}
          </motion.p>

          <motion.div
            className="mt-4 h-[1px] bg-gradient-to-r from-transparent via-tc-lime/50 to-transparent"
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 80, opacity: 1 }}
            transition={{ delay: 1, duration: 0.6, ease: 'easeOut' }}
          />

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2, duration: 0.5 }}
            className="mt-8 w-full flex flex-col items-center"
          >
            <button
              type="button"
              onClick={() => {
                if (status === 'error' && onBackToRoles) {
                  onBackToRoles()
                  return
                }
                if (activeAddress && status === 'error') {
                  void submitAuth(String(activeAddress))
                  return
                }
                setOpenWalletModal(true)
              }}
              disabled={status === 'submitting'}
              className="px-8 py-3.5 rounded-lg font-semibold text-tc-bg bg-tc-lime hover:bg-tc-lime/90 transition-colors border border-tc-lime/50 font-body"
            >
              {status === 'submitting'
                ? authMode === 'login'
                  ? 'Signing in…'
                  : 'Creating account…'
                : status === 'error' && activeAddress
                  ? 'Try again'
                  : 'Connect Wallet'}
            </button>
            {errorMsg && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 w-full max-w-sm px-4 py-3 rounded-xl bg-tc-surface border border-tc-border text-center"
              >
                <p className="font-body text-[13px] text-tc-white leading-snug">
                  {errorMsg}
                </p>
                <p className="mt-1.5 font-body text-[11px] text-tc-muted">
                  Use the button above to try again or connect a different wallet.
                </p>
              </motion.div>
            )}
          </motion.div>
        </div>

        <ConnectWallet
          openModal={openWalletModal}
          closeModal={() => setOpenWalletModal(false)}
        />
    </div>
  )
}
