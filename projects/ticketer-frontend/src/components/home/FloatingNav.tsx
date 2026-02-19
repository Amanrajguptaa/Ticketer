import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Compass, Ticket, User } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

interface NavTab {
  id: string
  label: string
  icon: LucideIcon
}

const TABS: NavTab[] = [
  { id: 'explore', label: 'Explore', icon: Compass },
  { id: 'tickets', label: 'My Tickets', icon: Ticket },
  { id: 'profile', label: 'Profile', icon: User },
]

export const FloatingNav = () => {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('explore')
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const vv = window.visualViewport
    if (!vv) return
    const handleResize = () => setVisible(vv.height > window.innerHeight * 0.75)
    vv.addEventListener('resize', handleResize)
    return () => vv.removeEventListener('resize', handleResize)
  }, [])

  const handleTab = (id: string) => {
    setActiveTab(id)
    if (id === 'tickets') navigate('/my-tickets')
    if (id === 'profile') navigate('/profile')
  }

  if (!visible) return null

  return (
    <motion.nav
      initial={{ y: 80 }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', stiffness: 260, damping: 24, delay: 0.3 }}
      className="fixed bottom-0 left-0 right-0 z-50 pb-[env(safe-area-inset-bottom,0px)] bg-tc-surface/90 backdrop-blur-xl border-t border-tc-border/60"
    >
      <div className="flex items-center justify-around max-w-[480px] mx-auto h-16">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id
          const Icon = tab.icon
          return (
            <motion.button
              key={tab.id}
              onClick={() => handleTab(tab.id)}
              whileTap={{ scale: 0.9 }}
              className="relative flex flex-col items-center justify-center gap-0.5 w-16 h-full focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-tc-lime/40 rounded-lg"
            >
              <motion.div
                animate={isActive ? { y: [0, -3, 0] } : { y: 0 }}
                transition={isActive ? { type: 'spring', stiffness: 350, damping: 12, duration: 0.35 } : { duration: 0.15 }}
              >
                <Icon
                  className={`w-[22px] h-[22px] transition-colors duration-200 ${isActive ? 'text-tc-lime' : 'text-tc-muted'}`}
                  strokeWidth={isActive ? 2.2 : 1.6}
                />
              </motion.div>
              <span className={`font-body text-[10px] font-medium transition-colors duration-200 ${isActive ? 'text-tc-lime' : 'text-tc-muted'}`}>
                {tab.label}
              </span>
              <AnimatePresence>
                {isActive && (
                  <motion.div
                    layoutId="nav-dot"
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    className="absolute -bottom-0 w-1 h-1 rounded-full bg-tc-lime"
                  />
                )}
              </AnimatePresence>
            </motion.button>
          )
        })}
      </div>
    </motion.nav>
  )
}
