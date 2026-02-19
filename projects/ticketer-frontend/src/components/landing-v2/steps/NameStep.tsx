import React, { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion, AnimatePresence } from 'framer-motion'
import { Check } from 'lucide-react'
import { nameSchema } from '../../../types/onboarding'
import type { z } from 'zod'
import { useOnboardingStore } from '../../../store/onboardingStore'
import { Button } from '../../ui/Button'

type NameForm = z.infer<typeof nameSchema>

interface NameStepProps {
  /** When provided, called on submit instead of nextStep (e.g. when this is the last step) */
  onComplete?: () => void
}

export const NameStep = ({ onComplete }: NameStepProps) => {
  const nameFromStore = useOnboardingStore((s) => s.name)
  const setName = useOnboardingStore((s) => s.setName)
  const nextStep = useOnboardingStore((s) => s.nextStep)

  const {
    register,
    handleSubmit,
    watch,
    formState: { isValid },
  } = useForm<NameForm>({
    resolver: zodResolver(nameSchema),
    defaultValues: { name: nameFromStore ?? '' },
    mode: 'onChange',
  })

  const nameValue = watch('name')

  useEffect(() => {
    setName(nameValue ?? '')
  }, [nameValue, setName])

  const onSubmit = () => {
    if (isValid) {
      if (onComplete) {
        onComplete()
      } else {
        nextStep()
      }
    }
  }

  return (
    <div className="flex flex-col items-start w-full">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-4 h-[1px] bg-tc-lime" />
        <span className="font-body font-semibold text-[11px] tracking-[0.2em] text-tc-lime uppercase">
          Step 01
        </span>
      </div>

      <h1 className="font-display font-extrabold text-[28px] md:text-[34px] text-tc-white leading-[1.15] mb-3">
        What should we call you?
      </h1>

      <p className="font-body text-[15px] text-tc-muted mb-10">
        Your name shows on your tickets and profile.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="w-full relative group">
        <div className="relative flex items-center w-full py-4 border-b border-tc-border focus-within:border-tc-lime transition-colors duration-300">
          <input
            {...register('name')}
            autoFocus
            placeholder="Your name"
            className="w-full bg-transparent border-none outline-none font-display font-bold text-[28px] md:text-[32px] text-tc-white placeholder:text-tc-dim caret-tc-lime"
          />

          <AnimatePresence>
            {nameValue && nameValue.length >= 2 && (
              <motion.div
                initial={{ opacity: 0, x: 4 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 4 }}
                className="absolute right-0"
              >
                <Check className="w-6 h-6 text-tc-teal" />
              </motion.div>
            )}
          </AnimatePresence>

          <div className="absolute bottom-0 left-0 w-full h-[2px] bg-tc-lime opacity-0 group-focus-within:opacity-100 blur-[2px] transition-opacity duration-300 pointer-events-none" />
        </div>

        <div className="mt-10 h-16">
          <AnimatePresence>
            {nameValue && nameValue.length >= 2 && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
              >
                <Button type="submit" className="w-full md:w-auto">
                  Continue
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </form>
    </div>
  )
}
