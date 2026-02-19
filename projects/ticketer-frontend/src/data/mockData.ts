// ── src/data/mockData.ts ──
// Static mock data for the student home feed.
// Tags align with onboarding interest IDs:
//   music | tech | sports | comedy | art | film | gaming | food | dance | sports2

import type { LucideIcon } from 'lucide-react'
import {
  Ticket,
  Music,
  Code,
  Theater,
  Wrench,
  Trophy,
  Gamepad2,
  DoorOpen,
} from 'lucide-react'

// ─── Types ───────────────────────────────────────────────────────────

export interface Event {
  id: string
  title: string
  category: string
  subcategory: string
  organiser: string // Organiser.id
  venue: string
  date: string // ISO 8601 date
  time: string // 24-h "HH:mm"
  price: number // ALGO
  priceINR: number
  totalTickets: number
  soldTickets: number
  coverImage: string
  isFeatured: boolean
  isFree: boolean
  isSoldOut: boolean
  isUrgent: boolean
  tags: string[]
  description: string
}

export interface Organiser {
  id: string
  name: string
  initials: string
  eventsCount: number
  accentColor: string
}

export interface Category {
  id: string
  label: string
  icon: LucideIcon
  color: string // design-system hex
}

// ─── Organisers ──────────────────────────────────────────────────────

export const organisers: Organiser[] = [
  {
    id: 'cultural-committee',
    name: 'Cultural Committee',
    initials: 'CC',
    eventsCount: 14,
    accentColor: '#C8E64A', // tc-lime
  },
  {
    id: 'devclub',
    name: 'DevClub',
    initials: 'DC',
    eventsCount: 9,
    accentColor: '#00D4AA', // tc-teal
  },
  {
    id: 'design-society',
    name: 'Design Society',
    initials: 'DS',
    eventsCount: 6,
    accentColor: '#FF6B35', // tc-coral
  },
  {
    id: 'gaming-society',
    name: 'Gaming Society',
    initials: 'GS',
    eventsCount: 5,
    accentColor: '#8B5CF6',
  },
  {
    id: 'ecell',
    name: 'E-Cell',
    initials: 'EC',
    eventsCount: 7,
    accentColor: '#F59E0B',
  },
  {
    id: 'lit-club',
    name: 'Lit Club',
    initials: 'LC',
    eventsCount: 4,
    accentColor: '#EC4899',
  },
]

// ─── Categories ──────────────────────────────────────────────────────

export const categories: Category[] = [
  { id: 'all', label: 'All Events', icon: Ticket, color: '#C8E64A' }, // tc-lime
  { id: 'music', label: 'Music', icon: Music, color: '#EC4899' }, // pink
  { id: 'tech', label: 'Tech & Hack', icon: Code, color: '#00D4AA' }, // tc-teal
  { id: 'cultural', label: 'Cultural', icon: Theater, color: '#F59E0B' }, // amber
  { id: 'workshops', label: 'Workshops', icon: Wrench, color: '#FF6B35' }, // tc-coral
  { id: 'sports', label: 'Sports', icon: Trophy, color: '#3B82F6' }, // blue
  { id: 'gaming', label: 'Gaming', icon: Gamepad2, color: '#8B5CF6' }, // violet
  { id: 'free', label: 'Free Entry', icon: DoorOpen, color: '#10B981' }, // emerald
]

// ─── Events ──────────────────────────────────────────────────────────

export const events: Event[] = [
  {
    id: 'evt-music-fest',
    title: 'Echoes — Campus Music Festival',
    category: 'music',
    subcategory: 'Live Performance',
    organiser: 'cultural-committee',
    venue: 'Open Air Theatre',
    date: '2026-02-21',
    time: '18:00',
    price: 2.5,
    priceINR: 499,
    totalTickets: 500,
    soldTickets: 440,
    coverImage: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800&q=80',
    isFeatured: true,
    isFree: false,
    isSoldOut: false,
    isUrgent: true,
    tags: ['music', 'dance', 'art'],
    description:
      'Experience the biggest campus music festival of the year! Echoes brings you a night of electrifying performances, top-tier DJs, and an unforgettable atmosphere. Join thousands of students for a celebration of music, dance, and culture under the stars.',
  },
  {
    id: 'evt-hackathon',
    title: 'HackNova 3.0 — 36-Hour Hackathon',
    category: 'tech',
    subcategory: 'Hackathon',
    organiser: 'devclub',
    venue: 'Innovation Lab',
    date: '2026-02-22',
    time: '09:00',
    price: 0,
    priceINR: 0,
    totalTickets: 200,
    soldTickets: 178,
    coverImage: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800&q=80',
    isFeatured: true,
    isFree: true,
    isSoldOut: false,
    isUrgent: true,
    tags: ['tech'],
    description:
      'HackNova is back! Join us for a 36-hour coding marathon where innovation meets execution. Build real-world solutions, compete for exciting prizes, and network with industry experts. Food, swag, and caffeine provided!',
  },
  {
    id: 'evt-dj-night',
    title: 'Neon Drop — DJ Night ft. DJ Rave',
    category: 'music',
    subcategory: 'DJ / Electronic',
    organiser: 'cultural-committee',
    venue: 'Auditorium',
    date: '2026-02-23',
    time: '20:00',
    price: 3.0,
    priceINR: 599,
    totalTickets: 400,
    soldTickets: 120,
    coverImage: 'https://images.unsplash.com/photo-1571266028243-e4733b0f0bb0?w=800&q=80',
    isFeatured: false,
    isFree: false,
    isSoldOut: false,
    isUrgent: false,
    tags: ['music', 'dance'],
    description:
      'Get ready to drop the beat! Neon Drop features DJ Rave spinning the latest EDM and House tracks. A night of non-stop dancing and high-energy vibes awaits you.',
  },
  {
    id: 'evt-design-workshop',
    title: 'Pixels & Grids — Figma Masterclass',
    category: 'workshops',
    subcategory: 'Design',
    organiser: 'design-society',
    venue: 'Workshop Hall B',
    date: '2026-02-20',
    time: '14:00',
    price: 0.4,
    priceINR: 79,
    totalTickets: 60,
    soldTickets: 58,
    coverImage: 'https://images.unsplash.com/photo-1581291518633-83b4eef1d2fd?w=800&q=80',
    isFeatured: false,
    isFree: false,
    isSoldOut: false,
    isUrgent: true,
    tags: ['art', 'tech'],
    description:
      'Master the art of UI/UX design with our comprehensive Figma workshop. Learn from industry pros about auto-layout, components, and prototyping. Perfect for beginners and intermediate designers.',
  },
  {
    id: 'evt-open-mic',
    title: 'Unscripted — Open Mic Night',
    category: 'cultural',
    subcategory: 'Comedy & Poetry',
    organiser: 'lit-club',
    venue: 'Café Stage',
    date: '2026-02-21',
    time: '19:30',
    price: 0,
    priceINR: 0,
    totalTickets: 80,
    soldTickets: 42,
    coverImage: 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=800&q=80',
    isFeatured: false,
    isFree: true,
    isSoldOut: false,
    isUrgent: false,
    tags: ['comedy', 'music', 'art'],
    description:
      'Take the stage and express yourself! Unscripted is an open mic night for poetry, stand-up comedy, and acoustic music. Come perform or just enjoy the local talent in a cozy atmosphere.',
  },
  {
    id: 'evt-startup-pitch',
    title: 'LaunchPad — Startup Pitch Day',
    category: 'tech',
    subcategory: 'Entrepreneurship',
    organiser: 'ecell',
    venue: 'Seminar Hall A',
    date: '2026-02-24',
    time: '10:00',
    price: 0,
    priceINR: 0,
    totalTickets: 150,
    soldTickets: 65,
    coverImage: 'https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=800&q=80',
    isFeatured: true,
    isFree: true,
    isSoldOut: false,
    isUrgent: false,
    tags: ['tech'],
    description:
      'Witness the next big thing! Student entrepreneurs pitch their innovative startup ideas to a panel of judges and investors. Network with like-minded individuals and get inspired.',
  },
  {
    id: 'evt-gaming-tournament',
    title: 'Frag Fest — Valorant Championship',
    category: 'gaming',
    subcategory: 'Esports',
    organiser: 'gaming-society',
    venue: 'Gaming Arena',
    date: '2026-02-22',
    time: '11:00',
    price: 1.0,
    priceINR: 199,
    totalTickets: 128,
    soldTickets: 128,
    coverImage: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&q=80',
    isFeatured: true,
    isFree: false,
    isSoldOut: true,
    isUrgent: false,
    tags: ['gaming', 'tech'],
    description:
      'The ultimate Valorant showdown! Teams battle it out for glory and cash prizes. Watch the live stream or come to the arena to cheer for your favorite squad.',
  },
  {
    id: 'evt-cultural-fest',
    title: 'Riviera — Annual Cultural Fest',
    category: 'cultural',
    subcategory: 'Multi-Event',
    organiser: 'cultural-committee',
    venue: 'Main Ground',
    date: '2026-02-25',
    time: '16:00',
    price: 5.0,
    priceINR: 999,
    totalTickets: 1000,
    soldTickets: 870,
    coverImage: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800&q=80',
    isFeatured: true,
    isFree: false,
    isSoldOut: false,
    isUrgent: true,
    tags: ['music', 'dance', 'art', 'comedy', 'food'],
    description:
      'Riviera is the grandest cultural fest of the year. Four days of non-stop fun, events, competitions, star nights, and food stalls. A celebration of life and art you cannot miss!',
  },
]
