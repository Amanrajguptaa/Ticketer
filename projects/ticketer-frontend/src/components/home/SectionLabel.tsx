import React from 'react'
import { motion } from 'framer-motion'

interface SectionLabelProps {
  label: string
  showSeeAll?: boolean
  onSeeAll?: () => void
}

export const SectionLabel = ({ label, showSeeAll, onSeeAll }: SectionLabelProps) => {
  return (
    <div className="flex items-center gap-3 w-full px-4">
      <div className="h-[1px] bg-gradient-to-r from-transparent to-tc-border flex-1 max-w-[32px]" />
      <span className="font-body font-semibold text-[11px] tracking-[0.18em] text-tc-muted uppercase whitespace-nowrap select-none">
        {label}
      </span>
      {showSeeAll ? (
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="h-[1px] bg-gradient-to-r from-tc-border to-transparent flex-1" />
          <motion.button
            onClick={onSeeAll}
            whileHover={{ x: 2 }}
            whileTap={{ scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            className="font-body font-medium text-[12px] text-tc-lime whitespace-nowrap select-none hover:text-tc-lime/80 transition-colors"
          >
            See all →
          </motion.button>
        </div>
      ) : (
        <div className="h-[1px] bg-gradient-to-l from-transparent to-tc-border flex-1" />
      )}
    </div>
  )
}
