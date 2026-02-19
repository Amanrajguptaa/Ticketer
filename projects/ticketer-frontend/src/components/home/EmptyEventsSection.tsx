import React from 'react'
import { Calendar, Sparkles } from 'lucide-react'

interface EmptyEventsSectionProps {
  title?: string
  message?: string
  variant?: 'default' | 'compact'
}

export function EmptyEventsSection({
  title = 'No events yet',
  message = "When organisers add events, they'll show up here. Check back soon.",
  variant = 'default',
}: EmptyEventsSectionProps) {
  if (variant === 'compact') {
    return (
      <div className="rounded-2xl border border-tc-border bg-tc-surface/50 px-4 py-6 flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-tc-dim flex items-center justify-center shrink-0">
          <Calendar className="w-6 h-6 text-tc-muted" />
        </div>
        <div>
          <p className="font-body font-medium text-tc-white text-[14px]">{title}</p>
          <p className="font-body text-[12px] text-tc-muted mt-0.5">{message}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-tc-border bg-tc-surface/50 px-6 py-10 flex flex-col items-center justify-center text-center">
      <div className="w-16 h-16 rounded-2xl bg-tc-dim flex items-center justify-center mb-4">
        <Sparkles className="w-8 h-8 text-tc-lime/80" />
      </div>
      <h3 className="font-display font-bold text-[18px] text-tc-white mb-2">{title}</h3>
      <p className="font-body text-[14px] text-tc-muted max-w-[280px] leading-relaxed">{message}</p>
    </div>
  )
}
