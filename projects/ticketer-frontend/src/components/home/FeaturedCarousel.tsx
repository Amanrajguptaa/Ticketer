import React, { useRef, useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { useWallet } from '@txnlab/use-wallet-react'
import { listEvents, listMyTickets } from '../../api/events'
import type { Event as ApiEvent } from '../../api/events'
import { apiEventToMock } from '../../utils/eventAdapters'
import type { Event as MockEvent } from '../../data/mockData'
import { SectionLabel } from './SectionLabel'
import { EventCard } from './EventCard'
import { EmptyEventsSection } from './EmptyEventsSection'

export const FeaturedCarousel = () => {
  const { activeAddress } = useWallet()
  const scrollRef = useRef<HTMLDivElement>(null)
  const [activeIdx, setActiveIdx] = useState(0)
  const [apiEvents, setApiEvents] = useState<ApiEvent[]>([])
  const [myTicketEventIds, setMyTicketEventIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    const run = async () => {
      try {
        const [evts, tickets] = await Promise.all([
          listEvents(),
          activeAddress ? listMyTickets(activeAddress).catch(() => []) : Promise.resolve([]),
        ])
        if (!cancelled) {
          setApiEvents(evts)
          setMyTicketEventIds(new Set(tickets.map((t) => t.eventId)))
        }
      } catch {
        if (!cancelled) setApiEvents([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    run()
    return () => { cancelled = true }
  }, [activeAddress])

  const apiNotPurchased = apiEvents.filter((e) => !myTicketEventIds.has(e.id))
  const carouselEvents: MockEvent[] = apiNotPurchased.map(apiEventToMock)

  // When API events (not purchased) first appear, scroll to start so first card (API) is visible
  const prevApiNotPurchasedLen = useRef(0)
  useEffect(() => {
    if (apiNotPurchased.length > 0 && prevApiNotPurchasedLen.current === 0) {
      scrollRef.current?.scrollTo({ left: 0, behavior: 'auto' })
    }
    prevApiNotPurchasedLen.current = apiNotPurchased.length
  }, [apiNotPurchased.length])

  const handleScroll = useCallback(() => {
    const el = scrollRef.current
    if (!el || carouselEvents.length === 0) return
    const scrollLeft = el.scrollLeft
    const cardWidth = el.scrollWidth / carouselEvents.length
    const idx = Math.round(scrollLeft / cardWidth)
    setActiveIdx(Math.min(idx, carouselEvents.length - 1))
  }, [carouselEvents.length])

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    el.addEventListener('scroll', handleScroll, { passive: true })
    return () => el.removeEventListener('scroll', handleScroll)
  }, [handleScroll])

  // Show skeleton until API has loaded so first cards are API events (not purchased), not mock
  if (loading) {
    return (
      <section className="w-full">
        <SectionLabel label="In the Spotlight" />
        <div className="mt-3 flex gap-4 overflow-hidden px-4 mx-4">
          <div className="shrink-0 w-[calc(100%-32px)] max-w-[480px] h-[300px] md:h-[360px] rounded-2xl bg-tc-surface border border-tc-border animate-pulse" />
        </div>
      </section>
    )
  }

  if (carouselEvents.length === 0) {
    return (
      <section className="w-full">
        <SectionLabel label="In the Spotlight" />
        <div className="mt-3 px-4">
          <EmptyEventsSection
            variant="compact"
            title="No events in the spotlight yet"
            message="Events from organisers will appear here. Check back soon."
          />
        </div>
      </section>
    )
  }

  return (
    <section className="w-full">
      <SectionLabel label="In the Spotlight" />
      <div
        ref={scrollRef}
        className="mt-3 flex gap-4 overflow-x-auto px-4 mx-4 snap-x snap-mandatory scrollbar-none
          [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
      >
        {carouselEvents.map((event) => (
          <div
            key={event.id}
            className="snap-start shrink-0 w-[calc(100%-32px)] md:w-[calc(50%-16px)] lg:w-[calc(33.333%-16px)] max-w-[480px] md:max-w-none"
          >
            <EventCard event={event} variant="large" />
          </div>
        ))}
      </div>
      <div className="flex items-center justify-center gap-1.5 mt-3">
        {carouselEvents.map((_, i) => (
          <motion.div
            key={i}
            layout
            transition={{ type: 'spring', stiffness: 400, damping: 28 }}
            className={`h-1.5 rounded-full transition-colors duration-200 ${i === activeIdx ? 'w-5 bg-tc-lime' : 'w-1.5 bg-tc-dim'}`}
          />
        ))}
      </div>
    </section>
  )
}
