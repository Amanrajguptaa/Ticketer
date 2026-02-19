import React, { useRef, useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { useWallet } from '@txnlab/use-wallet-react'
import { events } from '../../data/mockData'
import type { Event as MockEvent } from '../../data/mockData'
import { listEvents, listMyTickets } from '../../api/events'
import type { Event as ApiEvent } from '../../api/events'
import { SectionLabel } from './SectionLabel'
import { EventCard } from './EventCard'

const PLACEHOLDER_IMAGE = 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&q=80'

/** Map API event to mock Event shape so EventCard can render it. */
function apiEventToMock(api: ApiEvent): MockEvent {
  const d = new Date(api.date)
  const dateStr = d.toISOString().slice(0, 10)
  const timeStr = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  const sold = api.ticketsSold ?? 0
  const remaining = api.ticketSupply - sold
  const price = parseFloat(api.priceAlgo)
  return {
    id: api.id,
    title: api.name,
    category: 'Event',
    subcategory: 'On sale',
    organiser: api.organizerAddress,
    venue: api.venue,
    date: dateStr,
    time: timeStr,
    price,
    priceINR: Math.round(price * 90),
    totalTickets: api.ticketSupply,
    soldTickets: sold,
    coverImage: api.coverImageUrl || PLACEHOLDER_IMAGE,
    isFeatured: true,
    isFree: price === 0,
    isSoldOut: remaining <= 0,
    isUrgent: remaining > 0 && remaining <= 20,
    tags: [],
    description: '',
  }
}

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

  const mockFeatured = events.filter((e) => e.isFeatured)
  const apiNotPurchased = apiEvents.filter((e) => !myTicketEventIds.has(e.id))
  const carouselEvents: MockEvent[] = [
    ...apiNotPurchased.map(apiEventToMock),
    ...mockFeatured,
  ]

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

  if (carouselEvents.length === 0) return null

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
