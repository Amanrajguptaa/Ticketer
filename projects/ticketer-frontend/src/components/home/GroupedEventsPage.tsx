import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, FilterX } from 'lucide-react'
import { useOnboardingStore } from '../../store/onboardingStore'
import { listEvents } from '../../api/events'
import { apiEventToMock } from '../../utils/eventAdapters'
import type { Event } from '../../data/mockData'
import { EventCard } from './EventCard'

const CATEGORY_TITLES: Record<string, string> = {
  'events': 'Events',
  'free-entry': 'Free Entry',
  'workshops': 'Workshops',
  'fests': 'Fests',
  'dj-nights': 'DJ Nights',
  'sports': 'Sports',
}

export const GroupedEventsPage = () => {
  const navigate = useNavigate()
  const selectedCategoryId = useOnboardingStore((s) => s.selectedCategoryId)
  const selectedOrganiserId = useOnboardingStore((s) => s.selectedOrganiserId)
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)

  const isCategoryView = !!selectedCategoryId
  const isOrganiserView = !!selectedOrganiserId

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    listEvents()
      .then((evts) => {
        if (cancelled) return
        let filtered = evts
        if (isOrganiserView) {
          filtered = evts.filter((e) => e.organizerAddress === selectedOrganiserId)
        } else if (isCategoryView) {
          if (selectedCategoryId === 'free-entry') {
            filtered = evts.filter((e) => parseFloat(e.priceAlgo) === 0)
          }
          // 'events' and others: show all (API has no category)
        }
        setEvents(filtered.map(apiEventToMock))
      })
      .catch(() => { if (!cancelled) setEvents([]) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [selectedCategoryId, selectedOrganiserId, isCategoryView, isOrganiserView])

  let title = 'Events'
  if (isOrganiserView) title = 'Organiser events'
  else if (isCategoryView) title = CATEGORY_TITLES[selectedCategoryId ?? ''] ?? 'Events'

  const handleBack = () => navigate('/student-home')

  return (
    <div className="min-h-screen bg-tc-bg pb-20 md:pb-24">
      <div className="sticky top-0 z-30 bg-tc-bg/80 backdrop-blur-xl border-b border-tc-border transition-all duration-300">
        <div className="max-w-3xl lg:max-w-5xl mx-auto px-4 md:px-6 h-16 md:h-[4.25rem] flex items-center gap-4">
          <motion.button
            type="button"
            whileTap={{ scale: 0.9 }}
            onClick={handleBack}
            className="w-10 h-10 md:w-11 md:h-11 rounded-full bg-tc-surface border border-tc-border flex items-center justify-center text-tc-white hover:border-tc-lime/30 transition-colors shrink-0"
          >
            <ArrowLeft className="w-5 h-5 md:w-5 md:h-5" />
          </motion.button>
          <h1 className="font-display font-bold text-[20px] md:text-[22px] lg:text-[24px] text-tc-white truncate">
            {title}
          </h1>
        </div>
      </div>

      <div className="max-w-3xl lg:max-w-5xl xl:max-w-6xl mx-auto px-4 md:px-6 py-6 md:py-8 lg:py-10">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5 lg:gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-[300px] rounded-2xl bg-tc-surface border border-tc-border animate-pulse" />
            ))}
          </div>
        ) : events.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5 lg:gap-6">
            {events.map((event) => (
              <EventCard key={event.id} event={event} variant="large" />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 md:py-28 text-center">
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-tc-surface border border-tc-border flex items-center justify-center mb-4 md:mb-5">
              <FilterX className="w-8 h-8 md:w-10 md:h-10 text-tc-muted" />
            </div>
            <h3 className="font-display font-bold text-[18px] md:text-[20px] text-tc-white mb-2 md:mb-3">
              No events found
            </h3>
            <p className="font-body text-[14px] md:text-[15px] text-tc-muted max-w-xs md:max-w-sm">
              {isOrganiserView
                ? 'This organiser has no events yet.'
                : 'No events match this category right now. Check back later.'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
