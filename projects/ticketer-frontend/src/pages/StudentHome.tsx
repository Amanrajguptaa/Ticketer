import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronUp } from 'lucide-react'
import { useOnboardingStore } from '../store/onboardingStore'
import { listEvents } from '../api/events'
import { HomeHeader } from '../components/home/HomeHeader'
import { CategoryNav } from '../components/home/CategoryNav'
import { StudentHomeShimmer } from '../components/home/StudentHomeShimmer'
import { FeaturedEventFromApi } from '../components/home/FeaturedEventFromApi'
import { HappeningNow } from '../components/home/HappeningNow'
import { CategoryGrid } from '../components/home/CategoryGrid'
import { FeaturedCarousel } from '../components/home/FeaturedCarousel'
import { OrganiserRow } from '../components/home/OrganiserRow'
import { ForYouSection } from '../components/home/ForYouSection'
import { TicketChainPromo } from '../components/home/TicketChainPromo'
import { SearchResults } from '../components/home/SearchResults'
import { FreeEventsSection } from '../components/home/FreeEventsSection'
import { ThisWeekSection } from '../components/home/ThisWeekSection'
import { FloatingNav } from '../components/home/FloatingNav'

export default function StudentHome() {
  const searchQuery = useOnboardingStore((s) => s.searchQuery)
  const [activeCat, setActiveCat] = useState('all')
  const [showTop, setShowTop] = useState(false)
  const [eventsApiReady, setEventsApiReady] = useState(false)

  useEffect(() => {
    if (searchQuery) return
    let cancelled = false
    listEvents()
      .then(() => { if (!cancelled) setEventsApiReady(true) })
      .catch(() => { if (!cancelled) setEventsApiReady(true) })
    return () => { cancelled = true }
  }, [searchQuery])

  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 400)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    if (searchQuery) return
    const handleScrollTo = (e: CustomEvent<string>) => {
      const id = e.detail
      const element = document.getElementById(id)
      if (element) {
        const headerOffset = 140
        const elementPosition = element.getBoundingClientRect().top
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset
        window.scrollTo({ top: offsetPosition, behavior: 'smooth' })
      }
    }
    window.addEventListener('scrollToSection', handleScrollTo as EventListener)
    return () => window.removeEventListener('scrollToSection', handleScrollTo as EventListener)
  }, [searchQuery])

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' })

  return (
    <div className="min-h-screen bg-tc-bg relative">
      <HomeHeader />

      {searchQuery ? (
        <div className="pt-2">
          <SearchResults query={searchQuery} />
        </div>
      ) : !eventsApiReady ? (
        <>
          <div className="sticky top-14 z-30 bg-tc-bg/95 backdrop-blur-xl border-b border-tc-border/60 pb-2 pt-1 transition-all duration-300">
            <CategoryNav activeId={activeCat} onChange={setActiveCat} />
          </div>
          <StudentHomeShimmer />
        </>
      ) : (
        <>
          <div className="sticky top-14 z-30 bg-tc-bg/95 backdrop-blur-xl border-b border-tc-border/60 pb-2 pt-1 transition-all duration-300">
            <CategoryNav activeId={activeCat} onChange={setActiveCat} />
          </div>

          <div className="flex flex-col gap-12 pb-[80px] w-full md:max-w-3xl lg:max-w-5xl xl:max-w-6xl mx-auto md:pb-12 lg:pb-16 transition-all duration-300">
            <div id="spotlight">
              <FeaturedEventFromApi />
            </div>
            <div id="happening">
              <HappeningNow />
            </div>
            <div id="categories">
              <CategoryGrid />
            </div>
            <div id="featured">
              <FeaturedCarousel />
            </div>
            <div id="organisers">
              <OrganiserRow />
            </div>
            <div id="foryou">
              <ForYouSection />
            </div>
            <div id="promo">
              <TicketChainPromo />
            </div>
            <div id="free">
              <FreeEventsSection />
            </div>
            <div id="week">
              <ThisWeekSection />
            </div>
            <div className="h-20" aria-hidden />
          </div>
        </>
      )}

      <AnimatePresence>
        {showTop && (
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.25 }}
            onClick={scrollToTop}
            className="fixed bottom-20 left-1/2 -translate-x-1/2 z-40 flex items-center gap-1 px-3.5 py-2 rounded-full bg-tc-surface/90 backdrop-blur-lg border border-tc-border font-body font-medium text-[11px] text-tc-muted hover:text-tc-lime hover:border-tc-lime/30 transition-colors shadow-xl shadow-black/30"
          >
            <ChevronUp className="w-3.5 h-3.5" />
            Back to top
          </motion.button>
        )}
      </AnimatePresence>

      <FloatingNav />
    </div>
  )
}
