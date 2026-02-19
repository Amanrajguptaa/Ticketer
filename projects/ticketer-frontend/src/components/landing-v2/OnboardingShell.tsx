import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft } from 'lucide-react'
import { useOnboardingStore } from '../../store/onboardingStore'
import { NameStep } from './steps/NameStep'
import { InterestsStep } from './steps/InterestsStep'

export const OnboardingShell = () => {
  const role = useOnboardingStore((s) => s.role)
  const currentStep = useOnboardingStore((s) => s.currentStep)
  const direction = useOnboardingStore((s) => s.direction)
  const prevStep = useOnboardingStore((s) => s.prevStep)
  const setPhase = useOnboardingStore((s) => s.setPhase)

  const isOrganiser = role === 'organiser'
  const isGuard = role === 'guard'
  const isTwoStepRole = isOrganiser || isGuard
  const isFirstStep = currentStep === 1
  // Signup flow only: Name, then Interests (students only)
  const stepLabels = isTwoStepRole ? ['Name'] : ['Name', 'Interests']
  const maxStep = stepLabels.length

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <NameStep
            onComplete={isTwoStepRole ? () => setPhase('complete') : undefined}
          />
        )
      case 2:
        return isTwoStepRole ? null : <InterestsStep onComplete={() => setPhase('complete')} />
      default:
        return null
    }
  }

  const variants = {
    enter: (d: 'forward' | 'backward') => ({
      x: d === 'forward' ? 40 : -40,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (d: 'forward' | 'backward') => ({
      x: d === 'forward' ? -40 : 40,
      opacity: 0,
    }),
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
        <div className="w-1/3">
          <AnimatePresence>
            {!isFirstStep && (
              <motion.button
                type="button"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                whileHover={{ x: -2, color: '#F0F0F0' }}
                onClick={prevStep}
                className="flex items-center gap-1.5 text-tc-muted transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
                <span className="font-body text-sm font-medium">Back</span>
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        <div className="w-1/3 flex justify-center">
          <span className="font-display font-black text-[22px] tracking-[-0.02em] leading-none bg-gradient-to-r from-tc-lime via-white to-tc-lime bg-clip-text text-transparent">
            ticketer
          </span>
        </div>

        <div className="w-1/3" />
      </header>

      <div className="w-full max-w-[360px] px-6 mt-2 mb-12 relative z-10">
        <div className="flex items-center justify-between relative">
          <div className="absolute top-[11px] left-[14px] right-[14px] h-[2px] bg-tc-dim rounded-full" />
          <motion.div
            className="absolute top-[11px] left-[14px] h-[2px] bg-tc-lime rounded-full origin-left"
            initial={false}
            animate={{
              width: `${maxStep > 1 ? ((currentStep - 1) / (maxStep - 1)) * 100 : 0}%`,
            }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            style={{ maxWidth: 'calc(100% - 28px)' }}
          />

          {stepLabels.map((label, i) => {
            const step = i + 1
            const isActive = step === currentStep
            const isCompleted = step < currentStep
            return (
              <div
                key={label}
                className="flex flex-col items-center gap-2 relative z-10"
              >
                <motion.div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold font-body ${isActive ? 'bg-tc-lime text-black shadow-[0_0_12px_rgba(200,230,74,0.4)]' : isCompleted ? 'bg-tc-lime text-black' : 'bg-tc-bg border-2 border-tc-dim text-tc-muted'}`}
                  animate={{ scale: isActive ? 1.15 : 1 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                >
                  {isCompleted ? (
                    <div className="w-2 h-2 rounded-full bg-black" />
                  ) : (
                    step
                  )}
                </motion.div>
                <span
                  className={`text-[11px] font-body font-medium ${isActive ? 'text-tc-lime' : isCompleted ? 'text-tc-lime/60' : 'text-tc-muted'}`}
                >
                  {label}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      <main className="flex-1 w-full max-w-[480px] px-6 flex flex-col justify-center relative z-10">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentStep}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: 'spring', stiffness: 300, damping: 30 },
              opacity: { duration: 0.2 },
            }}
            className="w-full pb-20"
          >
            {renderStep()}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  )
}
