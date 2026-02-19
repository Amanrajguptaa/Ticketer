import React from 'react'

interface CategoryNavProps {
  activeId: string
  onChange: (id: string) => void
}

interface Section {
  id: string
  label: string
}

const SECTIONS: Section[] = [
  { id: 'spotlight', label: 'Spotlight' },
  { id: 'happening', label: 'Happening Now' },
  { id: 'categories', label: 'Categories' },
  { id: 'featured', label: 'Featured' },
  { id: 'organisers', label: 'Organisers' },
  { id: 'foryou', label: 'For You' },
  { id: 'promo', label: 'Promo' },
  { id: 'free', label: 'Free Entry' },
  { id: 'week', label: 'This Week' },
]

export const CategoryNav = ({ activeId, onChange }: CategoryNavProps) => {
  const scrollToSection = (id: string) => {
    const el = document.getElementById(id)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      onChange(id)
    }
  }

  return (
    <div
      className="w-full overflow-x-auto px-4 pb-2 md:max-w-3xl lg:max-w-5xl xl:max-w-6xl mx-auto
        scrollbar-none [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] mb-4"
    >
      <div className="flex gap-2 w-max">
        {SECTIONS.map((section) => {
          const isActive = activeId === section.id
          return (
            <button
              key={section.id}
              onClick={() => scrollToSection(section.id)}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-full border font-body font-medium text-[11px] whitespace-nowrap transition-colors duration-200 shrink-0 ${
                isActive ? 'border-tc-lime bg-tc-lime/10 text-tc-white' : 'border-tc-border bg-tc-surface text-tc-muted hover:border-tc-lime/30 hover:text-tc-white'
              }`}
            >
              <span>{section.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
