import React from 'react'
import { motion } from 'framer-motion'
import { SearchX } from 'lucide-react'
import { events } from '../../data/mockData'
import { EventCard } from './EventCard'

interface SearchResultsProps {
  query: string
}

export const SearchResults = ({ query }: SearchResultsProps) => {
  const lowerQuery = query.toLowerCase().trim()
  if (!lowerQuery) return null

  const results = events.filter((e) => {
    const inTitle = e.title.toLowerCase().includes(lowerQuery)
    const inOrganiser = e.organiser.toLowerCase().includes(lowerQuery)
    const inVenue = e.venue.toLowerCase().includes(lowerQuery)
    const inTags = e.tags.some((t) => t.toLowerCase().includes(lowerQuery))
    return inTitle || inOrganiser || inVenue || inTags
  })

  return (
    <div className="w-full md:max-w-3xl lg:max-w-5xl xl:max-w-6xl mx-auto px-4 py-6 min-h-[60vh]">
      <h2 className="font-display font-bold text-[18px] text-tc-white mb-4">
        {results.length} result{results.length !== 1 ? 's' : ''} for &quot;{query}&quot;
      </h2>
      {results.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {results.map((event) => (
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
