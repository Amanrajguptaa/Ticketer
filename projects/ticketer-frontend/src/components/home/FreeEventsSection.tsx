import React from 'react'
import { motion } from 'framer-motion'
import { useHomeFeed } from '../../hooks/useHomeFeed'
import { SectionLabel } from './SectionLabel'
import { EventCard } from './EventCard'

const MAX_ROWS = 4

export const FreeEventsSection = () => {
  const { free } = useHomeFeed()
  const visible = free.slice(0, MAX_ROWS)
  const hasMore = free.length > MAX_ROWS

  if (visible.length === 0) return null

  return (
    <section className="w-full">
      <SectionLabel label="Free Entry" />
      <div className="mt-3 px-4 flex flex-col">
        {visible.map((event, i) => (
          <motion.div
            key={event.id}
            whileHover={{ backgroundColor: 'rgba(20,20,20,0.6)' }}
            whileTap={{ scale: 0.99 }}
            className="rounded-xl transition-colors"
          >
            <EventCard event={event} variant="row" />
            {i < visible.length - 1 && <div className="mx-3 h-[1px] bg-tc-border/50" />}
          </motion.div>
        ))}
      </div>
      {hasMore && (
        <div className="flex justify-center mt-3">
          <motion.button
            whileHover={{ x: 2 }}
            whileTap={{ scale: 0.97 }}
            className="font-body font-medium text-[12px] text-tc-lime hover:text-tc-lime/80 transition-colors"
          >
            See all free events →
          </motion.button>
        </div>
      )}
    </section>
  )
}
