import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Bookmark, ArrowRight } from 'lucide-react'
import { organisers } from '../../data/mockData'
import { useOnboardingStore } from '../../store/onboardingStore'
import { SectionLabel } from './SectionLabel'

export const OrganiserRow = () => {
  const navigate = useNavigate()
  const openOrganiser = useOnboardingStore((s) => s.openOrganiser)
  const [tappedId, setTappedId] = useState<string | null>(null)

  const handleTap = (id: string) => {
    setTappedId(id)
    openOrganiser(id)
    navigate('/events/group')
    setTimeout(() => setTappedId(null), 150)
  }

  const visible = organisers.slice(0, 12)

  return (
    <section className="w-full">
      <SectionLabel label="Active on Campus" />
      <div className="mt-3 px-4 grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-x-4 gap-y-6 md:gap-y-8">
        {visible.map((org) => {
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
                    background: `linear-gradient(135deg, ${org.accentColor}33, ${org.accentColor}15)`,
                    border: `1.5px solid ${org.accentColor}40`,
                  }}
                >
                  <span className="font-display font-bold text-[18px]" style={{ color: org.accentColor }}>
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
                    style={{ border: `2px solid ${org.accentColor}` }}
                  />
                )}
              </div>
              <span className="font-body font-semibold text-[11px] text-tc-white leading-tight text-center line-clamp-1 w-full">
                {org.name}
              </span>
              <span className="font-mono text-[10px] text-tc-muted -mt-0.5">{org.eventsCount} events</span>
            </motion.button>
          )
        })}
      </div>
      <div className="flex justify-center px-4 mt-3">
        <button className="flex items-center gap-1 font-body text-[12px] text-tc-lime hover:text-tc-lime/80 transition-colors">
          See all
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </section>
  )
}
