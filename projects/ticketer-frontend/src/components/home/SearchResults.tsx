import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { SearchX } from 'lucide-react'
import { listEvents } from '../../api/events'
import { apiEventToMock } from '../../utils/eventAdapters'
import type { Event } from '../../data/mockData'
import { EventCard } from './EventCard'

interface SearchResultsProps {
  query: string
}

export const SearchResults = ({ query }: SearchResultsProps) => {
  const lowerQuery = query.toLowerCase().trim()
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!lowerQuery) {
      setEvents([])
      setLoading(false)
      return
    }
    let cancelled = false
    setLoading(true)
    listEvents()
      .then((evts) => {
        if (cancelled) return
        const filtered = evts.filter((e) => {
          const inName = e.name.toLowerCase().includes(lowerQuery)
          const inVenue = e.venue.toLowerCase().includes(lowerQuery)
          const inOrganiser = e.organizerAddress.toLowerCase().includes(lowerQuery)
          return inName || inVenue || inOrganiser
        })
        setEvents(filtered.map(apiEventToMock))
      })
      .catch(() => { if (!cancelled) setEvents([]) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [lowerQuery])

  if (!lowerQuery) return null

  if (loading) {
    return (
      <div className="w-full md:max-w-3xl lg:max-w-5xl xl:max-w-6xl mx-auto px-4 py-6 min-h-[60vh]">
        <div className="h-6 w-48 rounded bg-tc-dim animate-pulse mb-4" />
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-[300px] rounded-2xl bg-tc-surface border border-tc-border animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="w-full md:max-w-3xl lg:max-w-5xl xl:max-w-6xl mx-auto px-4 py-6 min-h-[60vh]">
      <h2 className="font-display font-bold text-[18px] text-tc-white mb-4">
        {events.length} result{events.length !== 1 ? 's' : ''} for &quot;{query}&quot;
      </h2>
      {events.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {events.map((event) => (
            <EventCard key={event.id} event={event} variant="large" />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center opacity-70">
          <SearchX className="w-12 h-12 text-tc-muted mb-4" />
          <p className="font-body text-[14px] text-tc-muted">No events found matching &quot;{query}&quot;</p>
        </div>
      )}
    </div>
  )
}
