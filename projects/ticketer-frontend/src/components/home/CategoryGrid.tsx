import React from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CalendarDays, Wrench, Sparkles, Headphones, Trophy, DoorOpen } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { events } from '../../data/mockData'
import { useOnboardingStore } from '../../store/onboardingStore'
import type { Event } from '../../data/mockData'

interface TileDef {
  id: string
  label: string
  icon: LucideIcon
  color: string
  match: (e: Event) => boolean
}

const TILES: TileDef[] = [
  { id: 'events', label: 'Events', icon: CalendarDays, color: '#C8E64A', match: () => true },
  { id: 'workshops', label: 'Workshops', icon: Wrench, color: '#FF6B35', match: (e) => e.category === 'workshops' },
  { id: 'fests', label: 'Fests', icon: Sparkles, color: '#F59E0B', match: (e) => e.category === 'cultural' },
  {
    id: 'dj-nights',
    label: 'DJ Nights',
    icon: Headphones,
    color: '#EC4899',
    match: (e) => e.subcategory.toLowerCase().includes('dj') || e.subcategory.toLowerCase().includes('electronic'),
  },
  { id: 'sports', label: 'Sports', icon: Trophy, color: '#3B82F6', match: (e) => e.category === 'sports' },
  { id: 'free-entry', label: 'Free Entry', icon: DoorOpen, color: '#00D4AA', match: (e) => e.isFree || e.price < 0.5 },
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
  return (
    <motion.div variants={containerVariants} initial="show" animate="show" className="w-full px-4 grid grid-cols-3 gap-2">
      {TILES.map((tile) => {
        const count = events.filter(tile.match).length
        const Icon = tile.icon
        return <CategoryTile key={tile.id} tile={tile} count={count} Icon={Icon} />
      })}
    </motion.div>
  )
}
