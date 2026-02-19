import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Bookmark } from 'lucide-react'
import { listEvents } from '../../api/events'
import { useOnboardingStore } from '../../store/onboardingStore'
import { SectionLabel } from './SectionLabel'
import { EmptyEventsSection } from './EmptyEventsSection'

const COLORS = ['#C8E64A', '#00D4AA', '#FF6B35', '#F59E0B', '#EC4899', '#3B82F6', '#8B5CF6']

function initialsFromAddress(addr: string): string {
  if (!addr || addr.length < 4) return '??'
  return addr.slice(2, 4).toUpperCase()
}

export const OrganiserRow = () => {
  const navigate = useNavigate()
  const openOrganiser = useOnboardingStore((s) => s.openOrganiser)
  const [tappedId, setTappedId] = useState<string | null>(null)
  const [organisers, setOrganisers] = useState<{ id: string; initials: string; count: number; color: string }[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    listEvents()
      .then((evts) => {
        if (cancelled) return
        const byAddr: Record<string, number> = {}
        for (const e of evts) {
          byAddr[e.organizerAddress] = (byAddr[e.organizerAddress] ?? 0) + 1
        }
        const list = Object.entries(byAddr)
          .map(([addr, count], i) => ({
            id: addr,
            initials: initialsFromAddress(addr),
            count,
            color: COLORS[i % COLORS.length],
          }))
          .slice(0, 12)
        setOrganisers(list)
      })
      .catch(() => { if (!cancelled) setOrganisers([]) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  const handleTap = (id: string) => {
    setTappedId(id)
    openOrganiser(id)
    navigate('/events/group')
    setTimeout(() => setTappedId(null), 150)
  }

  if (loading) {
    return (
      <section className="w-full">
        <SectionLabel label="Active on Campus" />
        <div className="mt-3 px-4 grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-x-4 gap-y-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="w-[68px] h-[68px] rounded-full bg-tc-surface border border-tc-border animate-pulse mx-auto" />
          ))}
        </div>
      </section>
    )
  }

  if (organisers.length === 0) {
    return (
      <section className="w-full">
        <SectionLabel label="Active on Campus" />
        <div className="mt-3 px-4">
          <EmptyEventsSection
            variant="compact"
            title="No organisers yet"
            message="When organisers create events, they'll appear here."
          />
        </div>
      </section>
    )
  }

  return (
    <section className="w-full">
      <SectionLabel label="Active on Campus" />
      <div className="mt-3 px-4 grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-x-4 gap-y-6 md:gap-y-8">
        {organisers.map((org) => {
          const isTapped = tappedId === org.id
          return (
            <motion.button
              key={org.id}
              onClick={() => handleTap(org.id)}
              whileTap={{ scale: 0.95 }}
              className="flex flex-col items-center gap-1.5 relative"
            >
              <div className="relative w-[68px] h-[68px]">
                <div
                  className="w-full h-full rounded-full flex items-center justify-center"
                  style={{
                    background: `linear-gradient(135deg, ${org.color}33, ${org.color}15)`,
                    border: `1.5px solid ${org.color}40`,
                  }}
                >
                  <span className="font-display font-bold text-[18px]" style={{ color: org.color }}>
                    {org.initials}
                  </span>
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-tc-raised border border-tc-border flex items-center justify-center">
                  <Bookmark className="w-2.5 h-2.5 text-tc-muted" />
                </div>
                {isTapped && (
                  <motion.div
                    initial={{ scale: 1, opacity: 0.4 }}
                    animate={{ scale: 1.8, opacity: 0 }}
                    transition={{ duration: 0.4, ease: 'easeOut' }}
                    className="absolute inset-0 rounded-full pointer-events-none"
                    style={{ border: `2px solid ${org.color}` }}
                  />
                )}
              </div>
              <span className="font-body font-semibold text-[11px] text-tc-white leading-tight text-center line-clamp-1 w-full">
                Organiser
              </span>
              <span className="font-mono text-[10px] text-tc-muted -mt-0.5">{org.count} {org.count === 1 ? 'event' : 'events'}</span>
            </motion.button>
          )
        })}
      </div>
    </section>
  )
}
