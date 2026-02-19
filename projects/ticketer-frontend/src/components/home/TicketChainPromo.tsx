import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Ticket, ArrowRight } from 'lucide-react'

const STORAGE_KEY = 'tc-promo-dismissed'

export const TicketChainPromo = () => {
  const [dismissed, setDismissed] = useState(true)

  useEffect(() => {
    setDismissed(localStorage.getItem(STORAGE_KEY) === '1')
  }, [])

  const handleDismiss = () => {
    setDismissed(true)
    localStorage.setItem(STORAGE_KEY, '1')
  }

  return (
    <AnimatePresence>
      {!dismissed && (
        <motion.div
          initial={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -60 }}
          transition={{ duration: 0.3, ease: 'easeIn' }}
          className="w-full px-4"
        >
          <div className="relative overflow-hidden rounded-2xl border border-tc-lime/20 bg-gradient-to-br from-tc-raised via-tc-surface to-tc-bg p-5">
            <div className="absolute -top-12 -right-12 w-32 h-32 bg-tc-lime/5 rounded-full blur-2xl pointer-events-none" />
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded-md bg-tc-lime/15 flex items-center justify-center">
                <Ticket className="w-3.5 h-3.5 text-tc-lime" />
              </div>
              <span className="font-body font-semibold text-[10px] tracking-[0.15em] text-tc-lime uppercase">
                Why TicketChain?
              </span>
            </div>
            <h3 className="font-display font-bold text-[18px] text-tc-white leading-snug mb-1.5">
              Your tickets can't be faked.
            </h3>
            <p className="font-body text-[13px] text-tc-muted leading-relaxed mb-4">
              Every ticket is an NFT on Algorand. Screenshot it all you want — it won't get you in.
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={handleDismiss}
                className="px-4 py-2 rounded-lg bg-tc-raised border border-tc-border font-body font-medium text-[12px] text-tc-muted hover:text-tc-white hover:border-tc-lime/30 transition-colors"
              >
                Got it
              </button>
              <motion.button
                whileHover={{ x: 2 }}
                className="flex items-center gap-1 font-body font-medium text-[12px] text-tc-lime hover:text-tc-lime/80 transition-colors"
              >
                Learn more
                <ArrowRight className="w-3.5 h-3.5" />
              </motion.button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
