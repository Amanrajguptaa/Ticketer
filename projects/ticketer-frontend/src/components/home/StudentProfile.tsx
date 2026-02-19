import React from 'react'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  User,
  Mail,
  Tag,
  LogOut,
  ChevronRight,
  Shield,
  Bell,
  Wallet,
  HelpCircle,
} from 'lucide-react'
import { useOnboardingStore } from '../../store/onboardingStore'
import { categories } from '../../data/mockData'

interface StudentProfileProps {
  onBack: () => void
  onSignOut?: () => void
}

const getInitials = (name: string) => {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/)
  return parts.length >= 2 ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase() : parts[0].slice(0, 2).toUpperCase()
}

const SettingsRow = ({
  icon: Icon,
  label,
  sublabel,
  danger,
  onClick,
}: {
  icon: React.FC<{ className?: string }>
  label: string
  sublabel?: string
  danger?: boolean
  onClick?: () => void
}) => (
  <button
    onClick={onClick}
    type="button"
    className={`w-full flex items-center gap-3 px-4 md:px-6 py-3.5 md:py-4 transition-colors ${
      danger ? 'hover:bg-red-500/5 active:bg-red-500/10' : 'hover:bg-tc-raised/60 active:bg-tc-raised'
    }`}
  >
    <div
      className={`w-8 h-8 md:w-9 md:h-9 rounded-lg flex items-center justify-center shrink-0 ${
        danger ? 'bg-red-500/10' : 'bg-tc-raised border border-tc-border'
      }`}
    >
      <Icon className={`w-4 h-4 md:w-5 md:h-5 ${danger ? 'text-red-400' : 'text-tc-muted'}`} />
    </div>
    <div className="flex-1 text-left min-w-0">
      <p className={`font-body text-[13px] md:text-[14px] font-medium ${danger ? 'text-red-400' : 'text-tc-white'}`}>{label}</p>
      {sublabel && <p className="font-body text-[11px] md:text-xs text-tc-muted mt-0.5">{sublabel}</p>}
    </div>
    {!danger && <ChevronRight className="w-4 h-4 md:w-5 md:h-5 text-tc-muted/50 shrink-0" />}
  </button>
)

export const StudentProfile: React.FC<StudentProfileProps> = ({ onBack, onSignOut }) => {
  const formData = useOnboardingStore((s) => s.formData)
  const { name, email, interests } = formData

  const initials = getInitials(name)

  const interestLabels = interests.map((id: string) => {
    const cat = categories.find((c) => c.id === id)
    return cat?.label ?? id
  })

  return (
    <div className="min-h-screen bg-tc-bg">
      <div className="sticky top-0 z-40 bg-tc-bg/80 backdrop-blur-xl border-b border-tc-border/60">
        <div className="flex items-center gap-3 px-4 md:px-6 h-14 md:h-16 max-w-2xl mx-auto">
          <motion.button
            type="button"
            whileTap={{ scale: 0.92 }}
            onClick={onBack}
            className="w-8 h-8 md:w-9 md:h-9 flex items-center justify-center rounded-full bg-tc-raised border border-tc-border hover:border-tc-lime/30 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 md:w-5 md:h-5 text-tc-muted" />
          </motion.button>
          <span className="font-display font-bold text-[16px] md:text-[18px] text-tc-white">Profile</span>
        </div>
      </div>

      <div className="max-w-[480px] md:max-w-2xl mx-auto pb-10 md:pb-16 px-4 md:px-6">
        <div className="flex flex-col items-center pt-8 md:pt-12 pb-6 md:pb-8">
          <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-tc-lime-dim border-2 border-tc-lime/40 flex items-center justify-center mb-3 md:mb-4">
            <span className="font-display font-black text-[28px] md:text-[32px] text-tc-lime">{initials}</span>
          </div>
          <h2 className="font-display font-bold text-[20px] md:text-[24px] text-tc-white">{name || 'Student'}</h2>
          <p className="font-body text-[13px] md:text-[14px] text-tc-muted mt-0.5">{email || 'No email set'}</p>
          <div className="mt-2 px-3 py-1 md:px-4 md:py-1.5 rounded-full bg-tc-lime/10 border border-tc-lime/20">
            <span className="font-mono text-[11px] md:text-[12px] text-tc-lime tracking-wider">STUDENT</span>
          </div>
        </div>

        <div className="rounded-2xl md:rounded-xl bg-tc-surface border border-tc-border overflow-hidden mb-4 md:mb-6">
          <div className="flex items-start gap-3 px-4 md:px-6 py-3.5 md:py-4 border-b border-tc-border">
            <User className="w-4 h-4 md:w-5 md:h-5 text-tc-muted mt-0.5 shrink-0" />
            <div>
              <p className="font-body text-[11px] md:text-xs text-tc-muted uppercase tracking-wider">Name</p>
              <p className="font-body font-medium text-[14px] md:text-[15px] text-tc-white mt-0.5">{name || '—'}</p>
            </div>
          </div>
          <div className="flex items-start gap-3 px-4 md:px-6 py-3.5 md:py-4 border-b border-tc-border">
            <Mail className="w-4 h-4 md:w-5 md:h-5 text-tc-muted mt-0.5 shrink-0" />
            <div>
              <p className="font-body text-[11px] md:text-xs text-tc-muted uppercase tracking-wider">Email</p>
              <p className="font-body font-medium text-[14px] md:text-[15px] text-tc-white mt-0.5">{email || '—'}</p>
            </div>
          </div>
          <div className="flex items-start gap-3 px-4 md:px-6 py-3.5 md:py-4">
            <Tag className="w-4 h-4 md:w-5 md:h-5 text-tc-muted mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="font-body text-[11px] md:text-xs text-tc-muted uppercase tracking-wider mb-2">Interests</p>
              {interestLabels.length > 0 ? (
                <div className="flex flex-wrap gap-1.5 md:gap-2">
                  {interestLabels.map((label: string) => (
                    <span
                      key={label}
                      className="px-2.5 py-1 md:px-3 md:py-1.5 rounded-full bg-tc-lime/10 border border-tc-lime/20 font-body text-[11px] md:text-xs font-medium text-tc-lime"
                    >
                      {label}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="font-body text-[13px] md:text-[14px] text-tc-muted">No interests set</p>
              )}
            </div>
          </div>
        </div>

        <div className="rounded-2xl md:rounded-xl bg-tc-surface border border-tc-border overflow-hidden mb-4 md:mb-6 divide-y divide-tc-border">
          <SettingsRow icon={Bell} label="Notifications" sublabel="Manage event alerts" />
          <SettingsRow icon={Wallet} label="Wallet" sublabel="Connect Algorand wallet" />
          <SettingsRow icon={Shield} label="Privacy" sublabel="Control your data" />
          <SettingsRow icon={HelpCircle} label="Help & Support" />
        </div>

        <div className="rounded-2xl md:rounded-xl bg-tc-surface border border-red-500/20 overflow-hidden">
          <SettingsRow
            icon={LogOut}
            label="Sign out"
            danger
            onClick={() => onSignOut?.()}
          />
        </div>

        <p className="text-center font-mono text-[10px] md:text-xs text-tc-muted/40 mt-6 md:mt-8">TicketChain v0.1.0 · Algorand Testnet</p>
      </div>
    </div>
  )
}
