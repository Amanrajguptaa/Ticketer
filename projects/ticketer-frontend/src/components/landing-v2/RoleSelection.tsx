import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Ticket, Mic2, ScanLine, ArrowRight } from 'lucide-react'
import type { OnboardingRole } from '../../types/onboarding'

interface RoleSelectionProps {
  onSelect: (role: OnboardingRole) => void
}

const ROLES = [
  {
    id: 'student' as const,
    name: 'Student',
    description: 'Discover events, buy tickets, flex your collection',
    icon: Ticket,
  },
  {
    id: 'organiser' as const,
    name: 'Organiser',
    description: 'Create events, sell tickets, get paid on-chain',
    icon: Mic2,
  },
  {
    id: 'guard' as const,
    name: 'Gate Guard',
    description: 'Scan tickets, verify entry, keep the vibe clean',
    icon: ScanLine,
  },
]

export const RoleSelection = ({ onSelect }: RoleSelectionProps) => {
  const [hoveredRole, setHoveredRole] = useState<string | null>(null)
  const [selectedRole, setSelectedRole] = useState<string | null>(null)

  const handleSelect = (role: OnboardingRole) => {
    setSelectedRole(role)
    setTimeout(() => {
      onSelect(role)
    }, 600)
  }

  return (
    <div className="min-h-screen flex flex-col items-center bg-tc-bg px-6 py-12 relative overflow-hidden">
      <div
        className="absolute inset-0 opacity-[0.07] pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(to right, #C8E64A 1px, transparent 1px), linear-gradient(to bottom, #C8E64A 1px, transparent 1px)`,
          backgroundSize: '32px 32px',
        }}
      />

      <motion.h2
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="font-display font-black text-[28px] tracking-[-0.02em] leading-none bg-gradient-to-r from-tc-lime via-white to-tc-lime bg-clip-text text-transparent z-10"
      >
        ticketer
      </motion.h2>

      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="max-w-6xl w-full flex flex-col items-center mt-6 flex-1"
      >
        <div className="text-center mb-8">
          <h1 className="font-display font-bold text-[32px] md:text-[42px] text-tc-white leading-tight">
            I am a
          </h1>
          <div className="relative flex flex-col items-center mt-0">
            <div className="h-10 flex items-center justify-center min-w-[200px]">
              <AnimatePresence mode="wait">
                {hoveredRole && (
                  <motion.span
                    key={hoveredRole}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2 }}
                    className="font-display font-bold text-[32px] md:text-[42px] text-tc-lime px-4"
                  >
                    {hoveredRole}
                  </motion.span>
                )}
              </AnimatePresence>
            </div>
            <motion.div
              className="h-[2px] rounded-full mt-1"
              animate={{
                width: hoveredRole ? 200 : 160,
                backgroundColor: hoveredRole ? '#C8E64A' : '#2A2A2A',
              }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
            />
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-6 w-full justify-center">
          {ROLES.map((role, index) => {
            const isHovered = hoveredRole === role.name
            const isDimmed = hoveredRole && hoveredRole !== role.name
            const isSelected = selectedRole === role.id
            const Icon = role.icon

            return (
              <motion.div
                key={role.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{
                  opacity: isDimmed ? 0.5 : 1,
                  y: 0,
                  scale: isSelected ? [1, 1.06, 0] : 1,
                }}
                transition={{
                  delay: index * 0.1,
                  duration: isSelected ? 0.3 : 0.5,
                }}
                onMouseEnter={() => setHoveredRole(role.name)}
                onMouseLeave={() => setHoveredRole(null)}
                onClick={() => handleSelect(role.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    handleSelect(role.id)
                  }
                }}
                className={`
                  relative w-full md:w-[280px] h-auto md:h-[220px] p-6 md:p-6
                  bg-tc-surface border border-tc-border rounded-2xl cursor-pointer
                  transition-all duration-300 flex flex-col items-start md:items-start group
                  ${isHovered ? 'border-tc-lime shadow-[0_0_32px_rgba(200,230,74,0.25)] scale-[1.02]' : ''}
                `}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-tc-lime-dim flex items-center justify-center rounded-lg shrink-0">
                    <Icon className="w-5 h-5 text-tc-lime" />
                  </div>
                  <h3 className="font-display font-bold text-[20px] text-tc-white">
                    {role.name}
                  </h3>
                </div>

                <p className="font-body font-normal text-sm text-tc-muted leading-relaxed">
                  {role.description}
                </p>

                <div className="mt-auto pt-3 flex w-full justify-end">
                  <motion.div
                    animate={{
                      opacity: isHovered ? 1 : 0,
                      x: isHovered ? 0 : -4,
                    }}
                    transition={{ duration: 0.2 }}
                  >
                    <ArrowRight className="w-5 h-5 text-tc-lime" />
                  </motion.div>
                </div>

                {isSelected && (
                  <motion.div
                    className="absolute inset-0 bg-tc-lime rounded-2xl pointer-events-none"
                    initial={{ scale: 0, opacity: 0.3 }}
                    animate={{ scale: 6, opacity: 0 }}
                    transition={{ duration: 0.6 }}
                  />
                )}
              </motion.div>
            )
          })}
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-16 font-body text-[12px] text-tc-muted"
        >
          You can switch roles anytime from settings
        </motion.p>
      </motion.div>
    </div>
  )
}
