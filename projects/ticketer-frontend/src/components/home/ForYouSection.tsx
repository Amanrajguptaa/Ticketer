import React from 'react'
import { ArrowRight } from 'lucide-react'
import { useOnboardingStore } from '../../store/onboardingStore'
import { useHomeFeed } from '../../hooks/useHomeFeed'
import { SectionLabel } from './SectionLabel'
import { EventCard } from './EventCard'
import { EmptyEventsSection } from './EmptyEventsSection'

export const ForYouSection = () => {
  const name = useOnboardingStore((s) => s.formData.name)
  const { loading, forYou } = useHomeFeed()

  const firstName = name?.trim().split(/\s+/)[0] || 'You'

  if (loading) {
    return (
      <section className="w-full">
        <SectionLabel label={`Picked for you, ${firstName}`} />
        <div className="mt-3 flex gap-3 overflow-hidden px-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="shrink-0 w-[200px] h-[240px] rounded-2xl bg-tc-surface border border-tc-border animate-pulse" />
          ))}
        </div>
      </section>
    )
  }

  if (forYou.length === 0) {
    return (
      <section className="w-full">
        <SectionLabel label={`Picked for you, ${firstName}`} />
        <div className="mt-3 px-4">
          <EmptyEventsSection
            variant="compact"
            title="No events for you yet"
            message="When organisers add events, we'll show ones that match your vibe here."
          />
        </div>
      </section>
    )
  }

  return (
    <section className="w-full">
      <SectionLabel label={`Picked for you, ${firstName}`} />
      <div
        className="mt-3 flex gap-3 overflow-x-auto px-4 scrollbar-none
          [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
      >
        {forYou.map((event) => (
          <div key={event.id} className="relative shrink-0">
            <EventCard event={event} variant="medium" />
          </div>
        ))}
      </div>
      <div className="flex justify-center px-4 mt-3">
        <button type="button" className="flex items-center gap-1 font-body text-[12px] text-tc-lime hover:text-tc-lime/80 transition-colors">
          See all
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </section>
  )
}
