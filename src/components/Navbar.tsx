'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'

const LINKS = [
  { href: '/', label: 'Home' },
  { href: '/study-area', label: 'Study Area' },
  { href: '/map', label: 'Map' },
  { href: '/analyze', label: 'Analyze' },
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/data-sources', label: 'Data Sources' },
  { href: '/report', label: 'Report' },
  { href: '/about', label: 'About' },
]

function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2.5">
      <svg width="30" height="30" viewBox="0 0 32 32" fill="none" aria-hidden>
        <path
          d="M16 3C16 3 6.5 13.5 6.5 20a9.5 9.5 0 0 0 19 0C25.5 13.5 16 3 16 3Z"
          fill="url(#g1)"
          stroke="#67e8f9"
          strokeWidth="1.4"
        />
        <path d="M11 20.5h10M12 24h8" stroke="#04101f" strokeWidth="1.8" strokeLinecap="round" />
        <defs>
          <linearGradient id="g1" x1="6" y1="4" x2="26" y2="30">
            <stop stopColor="#22d3ee" />
            <stop offset="1" stopColor="#2563eb" />
          </linearGradient>
        </defs>
      </svg>
      <span className="text-lg font-bold tracking-tight text-white">
        AquaSense <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">AI</span>
      </span>
    </Link>
  )
}

export default function Navbar() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  const linkCls = (href: string) => {
    const active = href === '/' ? pathname === '/' : pathname.startsWith(href)
    return `rounded-lg px-3 py-2 text-sm font-medium transition ${
      active ? 'bg-cyan-400/10 text-cyan-300' : 'text-slate-300 hover:bg-white/5 hover:text-white'
    }`
  }

  return (
    <header className="sticky top-0 z-[1200] border-b border-white/10 bg-abyss/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Logo />
        <nav className="hidden items-center gap-1 lg:flex">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} className={linkCls(l.href)}>
              {l.label}
            </Link>
          ))}
        </nav>
        <button
          className="rounded-lg border border-white/15 p-2 text-slate-300 lg:hidden"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
          </svg>
        </button>
      </div>
      {open && (
        <nav className="border-t border-white/10 px-4 pb-4 pt-2 lg:hidden">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} className={`block ${linkCls(l.href)}`} onClick={() => setOpen(false)}>
              {l.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  )
}
