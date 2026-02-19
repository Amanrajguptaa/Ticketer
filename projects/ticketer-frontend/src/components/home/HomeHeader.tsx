import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate, useLocation } from 'react-router-dom'
import { MapPin, Bell, Search, X } from 'lucide-react'
import { useOnboardingStore } from '../../store/onboardingStore'
import { NotificationsDialog } from './NotificationsDialog'

const getInitials = (name: string) => {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/)
  return parts.length >= 2 ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase() : parts[0].slice(0, 2).toUpperCase()
}

export const HomeHeader = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const formData = useOnboardingStore((s) => s.formData)
  const setPhase = useOnboardingStore((s) => s.setPhase)
  const searchQuery = useOnboardingStore((s) => s.searchQuery)
  const setSearchQuery = useOnboardingStore((s) => s.setSearchQuery)
  const name = formData.name
  const initials = getInitials(name)

  const isStudentHome = location.pathname === '/student-home'
  const handleProfileClick = () => {
    if (isStudentHome) navigate('/profile')
    else setPhase('profile')
  }

  const [scrolled, setScrolled] = useState(false)
  const [searchFocused, setSearchFocused] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)

  const handleClear = () => setSearchQuery('')

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <>
      <motion.header
        className={`sticky top-0 z-40 w-full transition-colors duration-300 ${
          scrolled ? 'bg-tc-bg/80 backdrop-blur-xl border-b border-tc-border/60' : 'bg-transparent border-b border-transparent'
        }`}
      >
        <div className="flex items-center justify-between px-4 h-14 w-full md:max-w-3xl lg:max-w-5xl xl:max-w-6xl mx-auto transition-all duration-300">
          <AnimatePresence mode="wait" initial={false}>
            {scrolled ? (
              <motion.div
                key="search-compact"
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 200, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 28 }}
                className="overflow-hidden"
              >
                <div className="flex items-center gap-2 bg-tc-raised border border-tc-border rounded-lg px-2.5 py-1.5">
                  <Search className="w-3.5 h-3.5 text-tc-muted shrink-0" />
                  <input
                    type="text"
                    placeholder="Search…"
                    className="bg-transparent font-body text-[12px] text-tc-white placeholder:text-tc-muted outline-none w-full"
                  />
                </div>
              </motion.div>
            ) : (
              <motion.button
                key="location"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="flex items-center gap-1.5 group cursor-default"
              >
                <MapPin className="w-4 h-4 text-tc-lime" />
                <span className="font-body font-semibold text-[13px] text-tc-white">Your Campus</span>
              </motion.button>
            )}
          </AnimatePresence>
          <div className="flex items-center gap-3">
            <motion.button
              onClick={() => setShowNotifications(true)}
              whileTap={{ scale: 0.9 }}
              className="relative w-8 h-8 flex items-center justify-center rounded-full bg-tc-raised border border-tc-border hover:border-tc-lime/30 transition-colors cursor-pointer"
            >
              <Bell className="w-4 h-4 text-tc-muted" />
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-tc-coral ring-2 ring-tc-bg pointer-events-none" />
            </motion.button>
            <motion.button
              onClick={handleProfileClick}
              whileTap={{ scale: 0.9 }}
              className="w-8 h-8 rounded-full bg-tc-lime-dim border border-tc-lime/30 flex items-center justify-center cursor-pointer hover:bg-tc-lime/20 transition-colors"
            >
              <span className="font-body font-bold text-[11px] text-tc-lime">{initials}</span>
            </motion.button>
          </div>
        </div>
      </motion.header>
      <div className="w-full px-4 pt-2 pb-3 md:pt-4 md:pb-6 md:max-w-3xl lg:max-w-5xl xl:max-w-6xl mx-auto transition-all duration-300">
        <motion.div
          animate={
            searchFocused || searchQuery
              ? { borderColor: 'rgba(200,230,74,0.5)', boxShadow: '0 0 20px rgba(200,230,74,0.08)' }
              : { borderColor: 'rgba(30,30,30,1)', boxShadow: '0 0 0px transparent' }
          }
          transition={{ duration: 0.2 }}
          className="flex items-center gap-2.5 bg-tc-raised border rounded-xl px-3.5 py-2.5 relative"
        >
          <Search className="w-4 h-4 text-tc-muted shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search events, workshops, fests..."
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            className="bg-transparent font-body text-[13px] text-tc-white placeholder:text-tc-muted outline-none w-full pr-6"
          />
          {searchQuery && (
            <button
              onClick={handleClear}
              className="absolute right-3 p-1 rounded-full hover:bg-white/10 text-tc-muted hover:text-white transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </motion.div>
      </div>
      <NotificationsDialog isOpen={showNotifications} onClose={() => setShowNotifications(false)} />
    </>
  )
}
