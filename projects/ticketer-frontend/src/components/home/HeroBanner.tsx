import React from 'react'
import { events } from '../../data/mockData'
import { EventCard } from './EventCard'

export const HeroBanner = () => {
  const featured = events.find((e) => e.isFeatured)
  if (!featured) return null
  return (
    <div className="w-full px-4">
      <EventCard event={featured} variant="hero" />
    </div>
  )
}
