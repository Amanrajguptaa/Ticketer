import React from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, FilterX } from 'lucide-react'
import { useOnboardingStore } from '../../store/onboardingStore'
import { events, categories, organisers } from '../../data/mockData'
import { EventCard } from './EventCard'

export const GroupedEventsPage = () => {
  const navigate = useNavigate()
  const selectedCategoryId = useOnboardingStore((s) => s.selectedCategoryId)
  const selectedOrganiserId = useOnboardingStore((s) => s.selectedOrganiserId)

  const isCategoryView = !!selectedCategoryId
  const isOrganiserView = !!selectedOrganiserId

  let title = 'Events'
  let filteredEvents = events

  if (isCategoryView) {
    const category = categories.find((c) => c.id === selectedCategoryId)
    switch (selectedCategoryId) {
      case 'all':
      case 'events':
        title = selectedCategoryId === 'events' ? 'Events' : 'All Events'
        filteredEvents = events
        break
      case 'fests':
        title = 'Fests'
        filteredEvents = events.filter((e) => e.category === 'cultural')
        break
      case 'dj-nights':
        title = 'DJ Nights'
        filteredEvents = events.filter(
          (e) =>
            e.subcategory.toLowerCase().includes('dj') || e.subcategory.toLowerCase().includes('electronic')
        )
        break
      case 'free-entry':
        title = 'Free Entry'
        filteredEvents = events.filter((e) => e.isFree)
        break
      default:
        title = category?.label ?? selectedCategoryId ?? 'Events'
        filteredEvents = events.filter((e) => e.category === selectedCategoryId)
    }
  } else if (isOrganiserView) {
    const organiser = organisers.find((o) => o.id === selectedOrganiserId)
    title = organiser?.name ?? 'Organiser Events'
    filteredEvents = events.filter((e) => e.organiser === selectedOrganiserId)
  }

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
        {filteredEvents.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5 lg:gap-6">
            {filteredEvents.map((event) => (
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
              We couldn't find any events matching this category at the moment.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
