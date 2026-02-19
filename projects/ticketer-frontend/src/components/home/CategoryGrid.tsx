import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CalendarDays, Wrench, Sparkles, Headphones, Trophy, DoorOpen } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { listEvents } from '../../api/events'
import { useOnboardingStore } from '../../store/onboardingStore'
import { EmptyEventsSection } from './EmptyEventsSection'

interface TileDef {
  id: string
  label: string
  icon: LucideIcon
  color: string
  getCount: (total: number, freeCount: number) => number
}

const TILES: TileDef[] = [
  { id: 'events', label: 'Events', icon: CalendarDays, color: '#C8E64A', getCount: (t) => t },
  { id: 'workshops', label: 'Workshops', icon: Wrench, color: '#FF6B35', getCount: () => 0 },
  { id: 'fests', label: 'Fests', icon: Sparkles, color: '#F59E0B', getCount: () => 0 },
  { id: 'dj-nights', label: 'DJ Nights', icon: Headphones, color: '#EC4899', getCount: () => 0 },
  { id: 'sports', label: 'Sports', icon: Trophy, color: '#3B82F6', getCount: () => 0 },
  { id: 'free-entry', label: 'Free Entry', icon: DoorOpen, color: '#00D4AA', getCount: (_, free) => free },
]

const containerVariants = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } }
const tileVariants = { hidden: { opacity: 0, scale: 0.9, y: 10 }, show: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' as const } } }

const CategoryTile = ({ tile, count, Icon }: { tile: TileDef; count: number; Icon: LucideIcon }) => {
  const navigate = useNavigate()
  const openCategory = useOnboardingStore((s) => s.openCategory)
  const handleClick = () => {
    openCategory(tile.id)
    navigate('/events/group')
  }
  return (
    <motion.button
      onClick={handleClick}
      variants={tileVariants}
      whileHover={{ scale: 1.03, borderColor: tile.color }}
      whileTap={{ scale: 0.97 }}
      className="relative h-[84px] w-full rounded-2xl bg-tc-surface border border-tc-border flex flex-col items-center justify-center gap-1 cursor-pointer transition-colors hover:bg-tc-raised group"
    >
      <motion.div whileHover={{ scale: 1.12 }} transition={{ type: 'spring', stiffness: 400, damping: 15 }}>
        <Icon className="w-6 h-6 transition-colors" style={{ color: tile.color }} strokeWidth={1.5} />
      </motion.div>
      <span className="font-body font-semibold text-[11px] text-tc-white leading-tight">{tile.label}</span>
      <span className="font-mono text-[10px] text-tc-muted">{count} {count === 1 ? 'event' : 'events'}</span>
    </motion.button>
  )
}

export const CategoryGrid = () => {
  const [total, setTotal] = useState(0)
  const [freeCount, setFreeCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    listEvents()
      .then((evts) => {
        if (cancelled) return
        setTotal(evts.length)
        setFreeCount(evts.filter((e) => parseFloat(e.priceAlgo) === 0).length)
      })
      .catch(() => { if (!cancelled) setTotal(0); setFreeCount(0) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  if (loading) {
    return (
      <div className="w-full px-4 grid grid-cols-3 gap-2">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="h-[84px] rounded-2xl bg-tc-surface border border-tc-border animate-pulse" />
        ))}
      </div>
    )
  }

  if (total === 0) {
    return (
      <div className="w-full px-4">
        <EmptyEventsSection
          variant="compact"
          title="No events to explore yet"
          message="When organisers add events, you can browse by category here."
        />
      </div>
    )
  }

  return (
    <motion.div variants={containerVariants} initial="show" animate="show" className="w-full px-4 grid grid-cols-3 gap-2">
      {TILES.map((tile) => {
        const count = tile.getCount(total, freeCount)
        const Icon = tile.icon
        return <CategoryTile key={tile.id} tile={tile} count={count} Icon={Icon} />
      })}
    </motion.div>
  )
}
