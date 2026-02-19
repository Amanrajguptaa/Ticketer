import { useEffect, useState, useMemo } from 'react'
import { listEvents } from '../api/events'
import { apiEventToMock } from '../utils/eventAdapters'
import type { Event } from '../data/mockData'

const TODAY = new Date()
TODAY.setHours(0, 0, 0, 0)

function isWithinNextDays(isoDate: string, days: number): boolean {
  const d = new Date(isoDate)
  d.setHours(0, 0, 0, 0)
  const diff = (d.getTime() - TODAY.getTime()) / (1000 * 60 * 60 * 24)
  return diff >= 0 && diff <= days
}

export function useHomeFeed(): {
  loading: boolean
  forYou: Event[]
  thisWeek: Event[]
  free: Event[]
  apiEvents: import('../api/events').Event[]
} {
  const [apiEvents, setApiEvents] = useState<import('../api/events').Event[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    listEvents()
      .then((evts) => { if (!cancelled) setApiEvents(evts) })
      .catch(() => { if (!cancelled) setApiEvents([]) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  return useMemo(() => {
    const mapped = apiEvents.map(apiEventToMock)
    const forYou = [...mapped].filter((e) => !e.isSoldOut).slice(0, 8)
    const thisWeek = [...mapped]
      .filter((e) => isWithinNextDays(e.date, 7) && !e.isSoldOut)
      .sort((a, b) => a.date.localeCompare(b.date))
    const free = [...mapped].filter((e) => e.isFree && !e.isSoldOut).sort((a, b) => a.date.localeCompare(b.date))
    return { loading, forYou, thisWeek, free, apiEvents }
  }, [apiEvents, loading])
}
