import React from 'react'
import { motion } from 'framer-motion'
import { events } from '../../data/mockData'
import { EventCard } from './EventCard'

const UrgencyPulse = () => (
  <span className="relative flex h-2 w-2 shrink-0">
    <motion.span
      animate={{ scale: [1, 1.3, 1] }}
      transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
      className="absolute inline-flex h-full w-full rounded-full bg-tc-coral opacity-75"
    />
    <span className="relative inline-flex rounded-full h-2 w-2 bg-tc-coral" />
  </span>
)

export const HappeningNow = () => {
  const urgentEvents = events.filter(
    (e) => !e.isSoldOut && (e.isUrgent || e.soldTickets / e.totalTickets > 0.85)
  )
  if (urgentEvents.length === 0) return null
  return (
    <div className="w-full">
      <div className="flex items-center justify-center gap-2 px-4 mb-1">
        <div className="h-[1px] bg-gradient-to-r from-transparent to-tc-border flex-1 max-w-[40px]" />
        <UrgencyPulse />
        <span className="font-body font-semibold text-[11px] tracking-[0.18em] text-tc-muted uppercase whitespace-nowrap select-none">
          Happening Tonight
        </span>
        <UrgencyPulse />
        <div className="h-[1px] bg-gradient-to-l from-transparent to-tc-border flex-1 max-w-[40px]" />
      </div>
      <div
        className="mt-3 flex gap-3 overflow-x-auto px-4 scrollbar-none
          [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
      >
        {urgentEvents.map((event) => (
          <EventCard key={event.id} event={event} variant="compact" />
        ))}
      </div>
    </div>
  )
}
