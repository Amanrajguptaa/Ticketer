import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Bookmark } from 'lucide-react'
import type { Event } from '../../data/mockData'
import { organisers, categories } from '../../data/mockData'
import { useOnboardingStore } from '../../store/onboardingStore'

type CardVariant = 'hero' | 'large' | 'medium' | 'compact' | 'row'

interface EventCardProps {
  event: Event
  variant?: CardVariant
}

const VARIANT_STYLES: Record<CardVariant, string> = {
  hero: 'w-full h-[220px] md:h-[400px]',
  large: 'w-full h-[300px] md:h-[360px]',
  medium: 'w-[200px] h-[240px] shrink-0',
  compact: 'w-[160px] h-[200px] shrink-0',
  row: 'w-full h-[72px]',
}

const formatDate = (iso: string) => {
  const d = new Date(iso)
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

const getOrganiserName = (id: string) => organisers.find((o) => o.id === id)?.name ?? id

const getCategoryLabel = (catId: string) => categories.find((c) => c.id === catId)?.label ?? catId

const AvailabilityBar = ({ sold, total }: { sold: number; total: number }) => {
  const pct = Math.min((sold / total) * 100, 100)
  const isHot = pct > 85
  return (
    <div className="w-full h-[3px] bg-tc-dim rounded-full overflow-hidden">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.8, ease: 'easeOut', delay: 0.15 }}
        className={`h-full rounded-full ${isHot ? 'bg-tc-coral' : 'bg-tc-lime/70'}`}
      />
    </div>
  )
}

const UrgencyDot = () => (
  <span className="relative flex h-2 w-2">
    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-tc-coral opacity-75" />
    <span className="relative inline-flex rounded-full h-2 w-2 bg-tc-coral" />
  </span>
)

const RowLayout = ({
  event,
  bookmarked,
  toggleBookmark,
  onOpen,
}: {
  event: Event
  bookmarked: boolean
  toggleBookmark: () => void
  onOpen: () => void
}) => {
  const isNearSellout = event.soldTickets / event.totalTickets > 0.85
  return (
    <motion.div
      onClick={onOpen}
      whileTap={{ scale: 0.98 }}
      className="flex items-center gap-3 w-full h-[72px] bg-tc-surface border border-tc-border rounded-xl px-3 cursor-pointer group hover:border-tc-lime/30 transition-colors"
    >
      <div className="relative w-14 h-14 rounded-lg overflow-hidden shrink-0">
        <img
          src={event.coverImage}
          alt={event.title}
          className={`w-full h-full object-cover ${event.isSoldOut ? 'grayscale' : ''}`}
          loading="lazy"
        />
        {event.isSoldOut && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <span className="font-body font-bold text-[8px] tracking-[0.15em] text-tc-coral uppercase">Sold</span>
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-display font-bold text-[13px] text-tc-white truncate leading-snug">{event.title}</p>
        <div className="flex items-center gap-1.5 mt-0.5">
          {(event.isUrgent || isNearSellout) && <UrgencyDot />}
          <span className="font-body text-[11px] text-tc-muted truncate">
            {formatDate(event.date)} · {getOrganiserName(event.organiser)}
          </span>
        </div>
      </div>
      <div className="flex flex-col items-end gap-1 shrink-0">
        <span className="font-mono font-semibold text-[12px] text-tc-lime">
          {event.isFree ? 'FREE' : `${event.price} ALGO`}
        </span>
        <motion.button whileTap={{ scale: 1.3 }} onClick={(e) => { e.stopPropagation(); toggleBookmark() }} className="p-0.5">
          <Bookmark className={`w-3.5 h-3.5 transition-colors ${bookmarked ? 'fill-tc-lime text-tc-lime' : 'text-tc-muted'}`} />
        </motion.button>
      </div>
    </motion.div>
  )
}

export const EventCard = ({ event, variant = 'medium' }: EventCardProps) => {
  const navigate = useNavigate()
  const setSelectedEventId = useOnboardingStore((s) => s.setSelectedEventId)
  const [bookmarked, setBookmarked] = useState(false)
  const toggleBookmark = () => setBookmarked((p) => !p)

  const isNearSellout = event.soldTickets / event.totalTickets > 0.85
  const isCompact = variant === 'compact'

  const handleCardClick = () => {
    setSelectedEventId(event.id)
    navigate(`/event/${event.id}`)
  }

  if (variant === 'row') {
    return <RowLayout event={event} bookmarked={bookmarked} toggleBookmark={toggleBookmark} onOpen={handleCardClick} />
  }

  return (
    <motion.div
      onClick={handleCardClick}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className={`relative rounded-2xl overflow-hidden cursor-pointer group bg-tc-surface border border-tc-border hover:border-tc-lime/30 transition-colors ${VARIANT_STYLES[variant]}`}
    >
      <img
        src={event.coverImage}
        alt={event.title}
        className={`absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03] ${event.isSoldOut ? 'grayscale' : ''}`}
        loading="lazy"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
      <div className="absolute top-2.5 left-2.5 right-2.5 flex items-start justify-between z-10">
        <span className="px-2 py-0.5 rounded-full bg-black/50 backdrop-blur-sm font-body font-semibold text-[10px] uppercase tracking-wider text-tc-white border border-white/10">
          {getCategoryLabel(event.category)}
        </span>
        <motion.button
          whileTap={{ scale: 1.4 }}
          onClick={(e) => { e.stopPropagation(); toggleBookmark() }}
          className="w-7 h-7 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center border border-white/10 hover:border-tc-lime/40 transition-colors"
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={bookmarked ? 'filled' : 'empty'}
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 1.3, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 500, damping: 20 }}
            >
              <Bookmark className={`w-3.5 h-3.5 ${bookmarked ? 'fill-tc-lime text-tc-lime' : 'text-white/80'}`} />
            </motion.div>
          </AnimatePresence>
        </motion.button>
      </div>
      {event.isSoldOut && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
          <span className="font-display font-black text-[18px] tracking-[0.2em] text-tc-coral/90 uppercase border border-tc-coral/30 px-4 py-1.5 rounded-lg backdrop-blur-sm">
            Sold Out
          </span>
        </div>
      )}
      <div className="absolute bottom-0 left-0 right-0 p-3 z-10 flex flex-col gap-1.5">
        <h3 className={`font-display font-bold text-tc-white leading-snug ${isCompact ? 'text-[13px] line-clamp-2' : 'text-[15px] line-clamp-2'}`}>
          {event.title}
        </h3>
        {!isCompact && (
          <div className="flex items-center gap-1.5 text-tc-muted">
            <span className="font-body text-[11px] truncate">{getOrganiserName(event.organiser)}</span>
            <span className="text-[8px]">·</span>
            <span className="font-body text-[11px] whitespace-nowrap">{formatDate(event.date)}</span>
          </div>
        )}
        <div className="flex items-center justify-between">
          <span className="font-mono font-semibold text-[12px] text-tc-lime">
            {event.isFree ? 'FREE' : `${event.price} ALGO`}
          </span>
          {(event.isUrgent || isNearSellout) && !event.isSoldOut && (
            <div className="flex items-center gap-1">
              <UrgencyDot />
              <span className="font-body text-[10px] text-tc-coral font-medium">Filling fast</span>
            </div>
          )}
        </div>
        {!event.isSoldOut && <AvailabilityBar sold={event.soldTickets} total={event.totalTickets} />}
      </div>
    </motion.div>
  )
}
