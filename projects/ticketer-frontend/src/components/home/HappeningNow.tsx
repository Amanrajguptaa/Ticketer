import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { listEvents } from '../../api/events'
import { apiEventToMock } from '../../utils/eventAdapters'
import type { Event } from '../../data/mockData'
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

const todayStart = new Date()
todayStart.setHours(0, 0, 0, 0)
const tomorrowEnd = new Date(todayStart)
tomorrowEnd.setDate(tomorrowEnd.getDate() + 2)

function isHappeningSoon(apiDate: string): boolean {
  const d = new Date(apiDate)
  return d >= todayStart && d <= tomorrowEnd
}

export const HappeningNow = () => {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    listEvents()
      .then((evts) => {
        if (cancelled) return
        const soon = evts
          .filter((e) => isHappeningSoon(e.date) && (e.ticketSupply - (e.ticketsSold ?? 0) > 0))
          .slice(0, 8)
          .map(apiEventToMock)
        setEvents(soon)
      })
      .catch(() => { if (!cancelled) setEvents([]) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  if (loading) {
    return (
      <div className="w-full">
        <div className="flex items-center justify-center gap-2 px-4 mb-1">
          <div className="h-[1px] bg-tc-border flex-1 max-w-[40px]" />
          <div className="h-3 w-24 rounded bg-tc-dim animate-pulse" />
          <div className="h-[1px] bg-tc-border flex-1 max-w-[40px]" />
        </div>
        <div className="mt-3 flex gap-3 overflow-hidden px-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="shrink-0 w-[160px] h-[200px] rounded-2xl bg-tc-surface border border-tc-border animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  if (events.length === 0) return null

  return (
    <div className="w-full">
      <div className="flex items-center justify-center gap-2 px-4 mb-1">
        <div className="h-[1px] bg-gradient-to-r from-transparent to-tc-border flex-1 max-w-[40px]" />
        <UrgencyPulse />
        <span className="font-body font-semibold text-[11px] tracking-[0.18em] text-tc-muted uppercase whitespace-nowrap select-none">
          Happening Soon
        </span>
        <UrgencyPulse />
        <div className="h-[1px] bg-gradient-to-l from-transparent to-tc-border flex-1 max-w-[40px]" />
      </div>
      <div
        className="mt-3 flex gap-3 overflow-x-auto px-4 scrollbar-none
          [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
      >
        {events.map((event) => (
          <EventCard key={event.id} event={event} variant="compact" />
        ))}
      </div>
    </div>
  )
}
