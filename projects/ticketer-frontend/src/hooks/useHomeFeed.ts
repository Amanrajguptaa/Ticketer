import { useMemo } from 'react'
import { useOnboardingStore } from '../store/onboardingStore'
import { events } from '../data/mockData'
import type { Event } from '../data/mockData'

const TODAY = new Date()
TODAY.setHours(0, 0, 0, 0)

function isWithinNextDays(isoDate: string, days: number): boolean {
  const d = new Date(isoDate + 'T00:00:00')
  d.setHours(0, 0, 0, 0)
  const diff = (d.getTime() - TODAY.getTime()) / (1000 * 60 * 60 * 24)
  return diff >= 0 && diff <= days
}

export function useHomeFeed(): {
  forYou: Event[]
  thisWeek: Event[]
  free: Event[]
} {
  const interests = useOnboardingStore((s) => s.formData.interests)

  return useMemo(() => {
    const interestSet = new Set(interests)

    // For You: events matching interests, then pad with trending (by sell-through)
    const forYou = [...events]
      .filter((e) => !e.isSoldOut && e.tags.some((t) => interestSet.has(t)))
      .sort((a, b) => b.soldTickets / b.totalTickets - a.soldTickets / a.totalTickets)
    const forYouIds = new Set(forYou.map((e) => e.id))
    const trending = [...events]
      .filter((e) => !e.isSoldOut && !forYouIds.has(e.id))
      .sort((a, b) => b.soldTickets / b.totalTickets - a.soldTickets / a.totalTickets)
    const forYouPadded = forYou.length >= 3 ? forYou : [...forYou, ...trending.slice(0, 3 - forYou.length)]

    // This week: next 7 days, sorted by date
    const thisWeek = [...events]
      .filter((e) => isWithinNextDays(e.date, 7))
      .sort((a, b) => a.date.localeCompare(b.date))

    // Free: isFree events
    const free = [...events].filter((e) => e.isFree && !e.isSoldOut).sort((a, b) => a.date.localeCompare(b.date))

    return { forYou: forYouPadded, thisWeek, free }
  }, [interests])
}
