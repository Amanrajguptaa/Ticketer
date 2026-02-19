import React, { useMemo } from 'react'
import { motion } from 'framer-motion'
import { useHomeFeed } from '../../hooks/useHomeFeed'
import type { Event } from '../../data/mockData'
import { SectionLabel } from './SectionLabel'
import { EventCard } from './EventCard'

const MAX_DAYS = 3

const groupByDay = (events: Event[]) => {
  const groups: Record<string, Event[]> = {}
  for (const e of events) {
    (groups[e.date] ??= []).push(e)
  }
  return Object.entries(groups)
}

const dayLabel = (iso: string) => {
  const eventDate = new Date(iso + 'T00:00:00')
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  if (eventDate.getTime() === today.getTime()) return 'Today'
  if (eventDate.getTime() === tomorrow.getTime()) return 'Tomorrow'
  return eventDate.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' }).toUpperCase()
}

export const ThisWeekSection = () => {
  const { loading, thisWeek } = useHomeFeed()
  const dayGroups = useMemo(() => groupByDay(thisWeek).slice(0, MAX_DAYS), [thisWeek])

  if (loading) {
    return (
      <section className="w-full">
        <SectionLabel label="This Week" />
        <div className="mt-3 px-4 flex flex-col gap-5">
          {[1, 2].map((i) => (
            <div key={i}>
              <div className="h-3 w-20 rounded bg-tc-dim animate-pulse mb-2" />
              <div className="flex flex-col gap-2">
                <div className="h-[72px] rounded-xl bg-tc-surface border border-tc-border animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </section>
    )
  }

  if (dayGroups.length === 0) return null

  return (
    <section className="w-full">
      <SectionLabel label="This Week" />
      <div className="mt-3 px-4 flex flex-col gap-5">
        {dayGroups.map(([date, events]) => (
          <div key={date}>
            <p className="font-body font-semibold text-[10px] tracking-[0.18em] text-tc-muted uppercase mb-2">
              {dayLabel(date)}
            </p>
            <div className="flex flex-col gap-2">
              {events.map((event) => (
                <EventCard key={event.id} event={event} variant="row" />
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="flex justify-center mt-4">
        <motion.button
          type="button"
          whileHover={{ x: 2 }}
          whileTap={{ scale: 0.97 }}
          className="font-body font-medium text-[12px] text-tc-lime hover:text-tc-lime/80 transition-colors"
        >
          View full calendar →
        </motion.button>
      </div>
    </section>
  )
}
