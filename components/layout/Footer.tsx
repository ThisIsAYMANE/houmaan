'use client'

import Link from 'next/link'
import { Facebook, Twitter, Instagram, Youtube, Send } from 'lucide-react'

const footerLinks = {
  casino: [
    { label: 'Lobby', href: '/casino' },
    { label: 'boz Originaux', href: '/casino/boz-originaux' },
    { label: 'BC Exclusif', href: '/casino/bc-exclusif' },
    { label: 'Jeux populaires', href: '/casino/popular' },
    { label: 'Machines à sous', href: '/casino/slots' },
    { label: 'Casino en direct', href: '/casino/live' },
  ],
  sports: [
    { label: 'Football', href: '/sports/football' },
    { label: 'Basketball', href: '/sports/basketball' },
    { label: 'Tennis', href: '/sports/tennis' },
    { label: 'eFootball', href: '/sports/efootball' },
    { label: 'Tous les sports', href: '/sports' },
  ],
  assistance: [
    { label: 'Centre d\'aide', href: '/help' },
    { label: 'Contactez-nous', href: '/contact' },
    { label: 'FAQ', href: '/faq' },
    { label: 'Chat en direct', href: '/chat' },
  ],
  legal: [
    { label: 'Conditions générales', href: '/terms' },
    { label: 'Politique de confidentialité', href: '/privacy' },
    { label: 'Responsable Jeu d\'argent', href: '/responsible-gaming' },
    { label: 'Jeux prouvé-équitable', href: '/provably-fair' },
  ],
  about: [
    { label: 'À propos', href: '/about' },
    { label: 'Blog', href: '/blog' },
    { label: 'Carrières', href: '/careers' },
    { label: 'Presse', href: '/press' },
  ],
}

const socialLinks = [
  { icon: Facebook, href: '#', label: 'Facebook' },
  { icon: Twitter, href: '#', label: 'Twitter' },
  { icon: Instagram, href: '#', label: 'Instagram' },
  { icon: Youtube, href: '#', label: 'YouTube' },
  { icon: Send, href: '#', label: 'Telegram' },
]

export default function Footer() {
  return (
    <footer className="bg-background-secondary border-t border-background-elevated mt-auto">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-8">
          {/* Casino Column */}
          <div>
            <h3 className="text-text-primary font-semibold mb-4">Casino</h3>
            <ul className="space-y-2">
              {footerLinks.casino.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-text-secondary hover:text-accent-primary transition-colors text-sm"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Sports Column */}
          <div>
            <h3 className="text-text-primary font-semibold mb-4">Sports</h3>
            <ul className="space-y-2">
              {footerLinks.sports.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-text-secondary hover:text-accent-primary transition-colors text-sm"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Assistance Column */}
          <div>
            <h3 className="text-text-primary font-semibold mb-4">Assistance</h3>
            <ul className="space-y-2">
              {footerLinks.assistance.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-text-secondary hover:text-accent-primary transition-colors text-sm"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal Column */}
          <div>
            <h3 className="text-text-primary font-semibold mb-4">Légal</h3>
            <ul className="space-y-2">
              {footerLinks.legal.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-text-secondary hover:text-accent-primary transition-colors text-sm"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* About Column */}
          <div>
            <h3 className="text-text-primary font-semibold mb-4">À propos</h3>
            <ul className="space-y-2">
              {footerLinks.about.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-text-secondary hover:text-accent-primary transition-colors text-sm"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Social Media & Copyright */}
        <div className="border-t border-background-elevated pt-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Social Media */}
            <div className="flex items-center gap-4">
              {socialLinks.map((social) => {
                const Icon = social.icon
                return (
                  <a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 hover:bg-background-elevated rounded-md transition-colors"
                    aria-label={social.label}
                  >
                    <Icon className="w-5 h-5 text-text-secondary hover:text-accent-primary transition-colors" />
                  </a>
                )
              })}
            </div>

            {/* Copyright */}
            <div className="text-text-secondary text-sm text-center md:text-right">
              <p>© 2025 boz.Topol. Tous droits réservés.</p>
              <p className="mt-1">Jeu responsable - 18+</p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}


import Link from 'next/link'
import { Facebook, Twitter, Instagram, Youtube, Send } from 'lucide-react'

const footerLinks = {
  casino: [
    { label: 'Lobby', href: '/casino' },
    { label: 'boz Originaux', href: '/casino/boz-originaux' },
    { label: 'BC Exclusif', href: '/casino/bc-exclusif' },
    { label: 'Jeux populaires', href: '/casino/popular' },
    { label: 'Machines à sous', href: '/casino/slots' },
    { label: 'Casino en direct', href: '/casino/live' },
  ],
  sports: [
    { label: 'Football', href: '/sports/football' },
    { label: 'Basketball', href: '/sports/basketball' },
    { label: 'Tennis', href: '/sports/tennis' },
    { label: 'eFootball', href: '/sports/efootball' },
    { label: 'Tous les sports', href: '/sports' },
  ],
  assistance: [
    { label: 'Centre d\'aide', href: '/help' },
    { label: 'Contactez-nous', href: '/contact' },
    { label: 'FAQ', href: '/faq' },
    { label: 'Chat en direct', href: '/chat' },
  ],
  legal: [
    { label: 'Conditions générales', href: '/terms' },
    { label: 'Politique de confidentialité', href: '/privacy' },
    { label: 'Responsable Jeu d\'argent', href: '/responsible-gaming' },
    { label: 'Jeux prouvé-équitable', href: '/provably-fair' },
  ],
  about: [
    { label: 'À propos', href: '/about' },
    { label: 'Blog', href: '/blog' },
    { label: 'Carrières', href: '/careers' },
    { label: 'Presse', href: '/press' },
  ],
}

const socialLinks = [
  { icon: Facebook, href: '#', label: 'Facebook' },
  { icon: Twitter, href: '#', label: 'Twitter' },
  { icon: Instagram, href: '#', label: 'Instagram' },
  { icon: Youtube, href: '#', label: 'YouTube' },
  { icon: Send, href: '#', label: 'Telegram' },
]

export default function Footer() {
  return (
    <footer className="bg-background-secondary border-t border-background-elevated mt-auto">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-8">
          {/* Casino Column */}
          <div>
            <h3 className="text-text-primary font-semibold mb-4">Casino</h3>
            <ul className="space-y-2">
              {footerLinks.casino.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-text-secondary hover:text-accent-primary transition-colors text-sm"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Sports Column */}
          <div>
            <h3 className="text-text-primary font-semibold mb-4">Sports</h3>
            <ul className="space-y-2">
              {footerLinks.sports.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-text-secondary hover:text-accent-primary transition-colors text-sm"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Assistance Column */}
          <div>
            <h3 className="text-text-primary font-semibold mb-4">Assistance</h3>
            <ul className="space-y-2">
              {footerLinks.assistance.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-text-secondary hover:text-accent-primary transition-colors text-sm"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal Column */}
          <div>
            <h3 className="text-text-primary font-semibold mb-4">Légal</h3>
            <ul className="space-y-2">
              {footerLinks.legal.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-text-secondary hover:text-accent-primary transition-colors text-sm"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* About Column */}
          <div>
            <h3 className="text-text-primary font-semibold mb-4">À propos</h3>
            <ul className="space-y-2">
              {footerLinks.about.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-text-secondary hover:text-accent-primary transition-colors text-sm"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Social Media & Copyright */}
        <div className="border-t border-background-elevated pt-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Social Media */}
            <div className="flex items-center gap-4">
              {socialLinks.map((social) => {
                const Icon = social.icon
                return (
                  <a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 hover:bg-background-elevated rounded-md transition-colors"
                    aria-label={social.label}
                  >
                    <Icon className="w-5 h-5 text-text-secondary hover:text-accent-primary transition-colors" />
                  </a>
                )
              })}
            </div>

            {/* Copyright */}
            <div className="text-text-secondary text-sm text-center md:text-right">
              <p>© 2025 boz.Topol. Tous droits réservés.</p>
              <p className="mt-1">Jeu responsable - 18+</p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

