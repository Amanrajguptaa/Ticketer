import React from 'react'
import { AuthStep } from './steps/AuthStep'

interface AuthPhaseProps {
  onLoginComplete: () => void
  onSignupComplete: () => void
}

export const AuthPhase = ({ onLoginComplete, onSignupComplete }: AuthPhaseProps) => {
  const handleComplete = (mode: 'login' | 'signup') => {
    if (mode === 'login') {
      onLoginComplete()
    } else {
      onSignupComplete()
    }
  }

  return (
    <div className="min-h-screen bg-tc-bg relative overflow-hidden flex flex-col items-center">
      <div
        className="absolute inset-0 opacity-[0.07] pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(to right, #C8E64A 1px, transparent 1px), linear-gradient(to bottom, #C8E64A 1px, transparent 1px)`,
          backgroundSize: '32px 32px',
        }}
      />

      <header className="w-full flex items-center justify-between px-6 pt-10 pb-6 relative z-10 max-w-6xl">
        <div className="w-1/3" />
        <div className="w-1/3 flex justify-center">
          <span className="font-display font-black text-[22px] tracking-[-0.02em] leading-none bg-gradient-to-r from-tc-lime via-white to-tc-lime bg-clip-text text-transparent">
            ticketer
          </span>
        </div>
        <div className="w-1/3" />
      </header>

      <main className="flex-1 w-full max-w-[480px] px-6 flex flex-col justify-center relative z-10 pb-20">
        <AuthStep onCompleteWithMode={handleComplete} />
      </main>
    </div>
  )
}
