import React from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Bell } from 'lucide-react'

interface Notification {
  id: string
  type: 'alert' | 'event' | 'system'
  title: string
  message: string
  time: string
  read: boolean
}

const MOCK_NOTIFICATIONS: Notification[] = [
  { id: '1', type: 'event', title: 'Neon Nights is tomorrow!', message: "Don't forget your tickets for the biggest freshers event.", time: '2h ago', read: false },
  { id: '2', type: 'alert', title: 'Ticket low stock', message: 'Tickets for "Tech Summit 2025" are running out fast.', time: '5h ago', read: false },
  { id: '3', type: 'system', title: 'Welcome to TicketChain', message: 'Your account has been successfully created. Explore events now!', time: '1d ago', read: true },
]

interface NotificationsDialogProps {
  isOpen: boolean
  onClose: () => void
}

export const NotificationsDialog: React.FC<NotificationsDialogProps> = ({ isOpen, onClose }) => {
  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[999]"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="fixed inset-x-4 top-[20%] max-w-[400px] mx-auto z-[1000] bg-tc-surface border border-tc-border rounded-2xl shadow-2xl overflow-hidden"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-tc-border bg-tc-raised/50">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-tc-lime" />
                <span className="font-display font-bold text-[14px] text-tc-white">Notifications</span>
              </div>
              <button
                onClick={onClose}
                className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-tc-border/50 transition-colors"
              >
                <X className="w-3.5 h-3.5 text-tc-muted" />
              </button>
            </div>
            <div className="max-h-[60vh] overflow-y-auto p-2">
              {MOCK_NOTIFICATIONS.length > 0 ? (
                <div className="space-y-1">
                  {MOCK_NOTIFICATIONS.map((notif) => (
                    <div
                      key={notif.id}
                      className={`p-3 rounded-xl border transition-colors ${
                        notif.read ? 'bg-transparent border-transparent opacity-60' : 'bg-tc-raised/30 border-tc-border hover:bg-tc-raised/50'
                      }`}
                    >
                      <div className="flex gap-3">
                        <div
                          className={`mt-0.5 w-2 h-2 rounded-full shrink-0 ${
                            notif.type === 'alert' ? 'bg-tc-coral' : notif.type === 'event' ? 'bg-tc-lime' : 'bg-blue-400'
                          }`}
                        />
                        <div>
                          <h4 className="font-body font-bold text-[13px] text-tc-white leading-tight">{notif.title}</h4>
                          <p className="font-body text-[12px] text-tc-muted mt-0.5 leading-snug">{notif.message}</p>
                          <span className="inline-block mt-1.5 font-mono text-[10px] text-tc-muted/60">{notif.time}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center">
                  <p className="font-body text-[13px] text-tc-muted">No new notifications</p>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  )
}
