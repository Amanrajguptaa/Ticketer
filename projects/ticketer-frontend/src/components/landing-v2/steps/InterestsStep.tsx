import React from 'react'
import { motion } from 'framer-motion'
import {
  Music,
  Code,
  Dribbble,
  Mic,
  Trophy,
  Palette,
  Clapperboard,
  Gamepad2,
  UtensilsCrossed,
  Headphones,
} from 'lucide-react'
import { useOnboardingStore } from '../../../store/onboardingStore'
import { Button } from '../../ui/Button'

const INTERESTS = [
  { id: 'music', label: 'Music', icon: Music },
  { id: 'tech', label: 'Hacks', icon: Code },
  { id: 'sports', label: 'Sports', icon: Trophy },
  { id: 'comedy', label: 'Comedy', icon: Mic },
  { id: 'art', label: 'Art', icon: Palette },
  { id: 'film', label: 'Film', icon: Clapperboard },
  { id: 'gaming', label: 'Gaming', icon: Gamepad2 },
  { id: 'food', label: 'Food', icon: UtensilsCrossed },
  { id: 'dance', label: 'Dance & DJ', icon: Headphones },
  { id: 'sports2', label: 'Athletics', icon: Dribbble },
]

export const InterestsStep = ({ onComplete }: { onComplete: () => void }) => {
  const interests = useOnboardingStore((s) => s.interests)
  const toggleInterest = useOnboardingStore((s) => s.toggleInterest)
  const selectedCount = interests.length
  const isMaxReached = selectedCount >= 3

  const handleSubmit = () => {
    if (selectedCount >= 1) {
      onComplete()
    }
  }

  return (
    <div className="flex flex-col items-start w-full">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-4 h-[1px] bg-tc-lime" />
        <span className="font-body font-semibold text-[11px] tracking-[0.2em] text-tc-lime uppercase">
          Step 02
        </span>
      </div>

      <h1 className="font-display font-extrabold text-[28px] md:text-[34px] text-tc-white leading-[1.15] mb-3">
        What's your scene?
      </h1>

      <p className="font-body text-[15px] text-tc-muted mb-6 leading-relaxed">
        Pick up to 3 interests. We'll curate events for you.
      </p>

      <div className="grid grid-cols-2 gap-3 w-full">
        {INTERESTS.map((interest, i) => {
          const isSelected = interests.includes(interest.id)
          const isDisabled = isMaxReached && !isSelected
          const Icon = interest.icon

          return (
            <motion.button
              key={interest.id}
              type="button"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={!isDisabled ? { scale: 1.03 } : {}}
              whileTap={!isDisabled ? { scale: 0.97 } : {}}
              transition={{ delay: i * 0.04, duration: 0.3 }}
              onClick={() => !isDisabled && toggleInterest(interest.id)}
              className={`
                group flex items-center gap-3 px-4 py-3.5 rounded-xl border transition-all duration-200 text-left
                ${isSelected
                  ? 'bg-tc-lime/10 border-tc-lime text-tc-lime shadow-[0_0_16px_rgba(200,230,74,0.15)]'
                  : isDisabled
                    ? 'bg-tc-surface/50 border-tc-border/50 text-tc-muted/50 cursor-not-allowed'
                    : 'bg-tc-surface border-tc-border text-tc-muted hover:border-tc-lime/40 hover:text-tc-white'
                }
              `}
            >
              <motion.div
                className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors duration-200 ${isSelected ? 'bg-tc-lime/20' : 'bg-tc-raised group-hover:bg-tc-lime/15'}`}
                whileHover={{ scale: 1.15, rotate: 6 }}
                transition={{ type: 'spring', stiffness: 400, damping: 15 }}
              >
                <Icon
                  className={`w-4 h-4 transition-colors duration-200 ${isSelected ? 'text-tc-lime' : 'group-hover:text-tc-lime'}`}
                />
              </motion.div>
              <span
                className={`font-body font-medium text-[14px] ${isSelected ? 'text-tc-lime' : ''}`}
              >
                {interest.label}
              </span>
              {isSelected && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="ml-auto w-4 h-4 rounded-full bg-tc-lime flex items-center justify-center shrink-0"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-black" />
                </motion.div>
              )}
            </motion.button>
          )
        })}
      </div>

      <div className="mt-5 flex items-center justify-between w-full">
        <motion.p
          key={selectedCount}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="font-body text-[13px] text-tc-muted"
        >
          {selectedCount} / 3 selected
        </motion.p>
      </div>

      <div className="mt-8 w-full">
        <Button
          type="button"
          onClick={handleSubmit}
          disabled={selectedCount < 1}
          className="w-full md:w-auto"
        >
          Let's go →
        </Button>
      </div>
    </div>
  )
}
