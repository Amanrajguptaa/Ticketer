import type { Event as ApiEvent } from '../api/events'
import type { Event as MockEvent } from '../data/mockData'

const PLACEHOLDER_IMAGE = 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&q=80'

/** Map API event to mock Event shape for EventCard and other UI that expect mock shape. */
export function apiEventToMock(api: ApiEvent): MockEvent {
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
