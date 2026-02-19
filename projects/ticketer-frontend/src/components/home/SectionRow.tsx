import React from 'react'
import { SectionLabel } from './SectionLabel'

interface SectionRowProps {
  title: string
  showSeeAll?: boolean
  onSeeAll?: () => void
  children: React.ReactNode
}

export const SectionRow = ({ title, showSeeAll, onSeeAll, children }: SectionRowProps) => {
  return (
    <section className="w-full">
      <SectionLabel label={title} showSeeAll={showSeeAll} onSeeAll={onSeeAll} />
      <div
        className="mt-3 flex gap-3 overflow-x-auto px-4 scrollbar-none
          [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
      >
        {children}
      </div>
    </section>
  )
}
