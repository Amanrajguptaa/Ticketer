import React, { useMemo } from 'react'
import { ArrowRight } from 'lucide-react'
import { useOnboardingStore } from '../../store/onboardingStore'
import { useHomeFeed } from '../../hooks/useHomeFeed'
import { events } from '../../data/mockData'
import { SectionLabel } from './SectionLabel'
import { EventCard } from './EventCard'

const MIN_CARDS = 3

export const ForYouSection = () => {
  const name = useOnboardingStore((s) => s.formData.name)
  const interests = useOnboardingStore((s) => s.formData.interests)
  const { forYou } = useHomeFeed()

  const { cards, padded } = useMemo(() => {
    if (forYou.length >= MIN_CARDS) return { cards: forYou, padded: false }
    const forYouIds = new Set(forYou.map((e) => e.id))
    const trending = [...events]
      .filter((e) => !forYouIds.has(e.id) && !e.isSoldOut)
      .sort((a, b) => b.soldTickets / b.totalTickets - a.soldTickets / a.totalTickets)
    const padCount = MIN_CARDS - forYou.length
    return { cards: [...forYou, ...trending.slice(0, padCount)], padded: true }
  }, [forYou])

  const firstName = name?.trim().split(/\s+/)[0] || 'You'
  const interestSet = new Set(interests)

  return (
    <section className="w-full">
      <SectionLabel label={`Picked for you, ${firstName}`} />
      <div
        className="mt-3 flex gap-3 overflow-x-auto px-4 scrollbar-none
          [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
      >
        {cards.map((event) => {
          const isMatch = event.tags.some((t) => interestSet.has(t))
          return (
            <div key={event.id} className="relative shrink-0">
              {isMatch && (
                <div className="absolute top-2 left-2 z-20 px-1.5 py-0.5 rounded-md bg-tc-lime/20 backdrop-blur-sm border border-tc-lime/30">
                  <span className="font-body font-bold text-[9px] tracking-[0.1em] text-tc-lime uppercase">✦ For You</span>
                </div>
              )}
              <EventCard event={event} variant="medium" />
            </div>
          )
        })}
      </div>
      {padded && (
        <p className="px-4 mt-2 font-body text-[11px] text-tc-muted">Based on your interests + what's trending</p>
      )}
      <div className="flex justify-center px-4 mt-3">
        <button className="flex items-center gap-1 font-body text-[12px] text-tc-lime hover:text-tc-lime/80 transition-colors">
          See all
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </section>
  )
}
