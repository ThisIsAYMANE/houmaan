'use client'

import { useEffect, useState, useCallback } from 'react'
import { Trophy, Zap, Gift, Clock, ChevronRight, Info, CheckCircle, XCircle, Star } from 'lucide-react'
import ActiveBonusCard, { BonusData } from '@/components/bonuses/ActiveBonusCard'
import WelcomeBonusModal from '@/components/bonuses/WelcomeBonusModal'
import AdBanner from '@/components/layout/AdBanner'
import toast from 'react-hot-toast'

// ── Bonus offer cards data ─────────────────────────────────────────────────

const BONUS_OFFERS = [
  {
    id: 'welcome',
    icon: Trophy,
    title: 'Bonus de Bienvenue',
    subtitle: '100% jusqu\'à 100$ + 50 Tours Gratuits',
    description: 'Doublez votre premier dépôt jusqu\'à 100$ et recevez 50 tours gratuits sur nos meilleures machines.',
    color: 'from-yellow-500 to-amber-600',
    terms: [
      'Dépôt minimum : 20$',
      'Mise requise : 35× le bonus uniquement',
      'Jeux éligibles : Machines à sous (100%)',
      'Jeux exclus : Blackjack, Roulette, Poker (0%)',
      'Mise max pendant bonus : 5$/tour',
      'Validité : 7 jours',
      '50 tours gratuits : 10/jour × 5 jours',
    ],
    badge: 'Premier dépôt',
    badgeColor: 'bg-yellow-500',
  },
  {
    id: 'cashback',
    icon: Zap,
    title: 'Cashback Hebdomadaire',
    subtitle: 'Jusqu\'à 10% de remboursement chaque semaine',
    description: 'Récupérez jusqu\'à 150$ en cashback chaque lundi sur vos pertes nettes de la semaine.',
    color: 'from-blue-500 to-cyan-600',
    terms: [
      'Taux : 10% des pertes nettes en argent réel',
      'Plafond : 150$ par semaine',
      'Mise requise : 5×',
      'Validité : 72 heures après crédit',
      'Crédité chaque lundi à 00:00 UTC',
      'Bonus-fonds exclus du calcul',
    ],
    badge: 'Hebdomadaire',
    badgeColor: 'bg-blue-500',
  },
  {
    id: 'bet_and_get',
    icon: Gift,
    title: 'Pari & Gagnez',
    subtitle: 'Pariez 25$, Obtenez 10$ en paris offerts',
    description: 'Placez un pari perdant de 25$+ à cote -200 ou plus et recevez automatiquement 10$ en paris gratuits.',
    color: 'from-purple-500 to-pink-600',
    terms: [
      'Mise min : 25$ sur un seul pari',
      'Cote min : -200 (décimal ≥ 1.50)',
      'Déclencheur : pari perdant uniquement',
      'La mise n\'est pas retournée en cas de victoire',
      'Bonus offert : 10$ en pari gratuit',
      'Une seule utilisation',
    ],
    badge: 'Sports',
    badgeColor: 'bg-purple-500',
  },
]

// ── Component ──────────────────────────────────────────────────────────────

export default function BonusesPage() {
  const [activeBonuses, setActiveBonuses] = useState<BonusData[]>([])
  const [claimedHistory, setClaimedHistory] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'available' | 'active' | 'history'>('available')
  const [welcomeModalOpen, setWelcomeModalOpen] = useState(false)
  const [expandedOffer, setExpandedOffer] = useState<string | null>(null)

  const fetchBonuses = useCallback(async () => {
    try {
      const token = localStorage.getItem('auth_token')
      if (!token) { setLoading(false); return }

      const res = await fetch('/api/bonuses/active', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setActiveBonuses(data.bonuses ?? [])
        if (data.bonuses?.length > 0) setActiveTab('active')
      }
    } catch {}
    setLoading(false)
  }, [])

  useEffect(() => { fetchBonuses() }, [fetchBonuses])

  const handleForfeit = async (bonusId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir abandonner ce bonus ? Votre solde bonus sera perdu.')) return
    try {
      const token = localStorage.getItem('auth_token')
      const res = await fetch('/api/bonuses/forfeit', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ bonusId }),
      })
      if (res.ok) {
        toast.success('Bonus abandonné.')
        fetchBonuses()
      } else {
        const d = await res.json()
        toast.error(d.error ?? 'Erreur')
      }
    } catch {
      toast.error('Erreur réseau')
    }
  }

  const tabs = [
    { id: 'available', label: 'Disponibles', count: BONUS_OFFERS.length },
    { id: 'active', label: 'Actifs', count: activeBonuses.length },
    { id: 'history', label: 'Historique', count: claimedHistory.length },
  ] as const

  return (
    <div className="min-h-screen bg-background-primary">
      {/* Bonuses Banner Carousel */}
      <div className="px-4 pt-4">
        <AdBanner context="bonuses" />
      </div>

      {/* Hero */}
      <div className="relative overflow-hidden bg-gradient-to-br from-yellow-900/40 via-background-primary to-purple-900/30 border-b border-background-elevated">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(234,179,8,0.15),transparent_60%)]" />
        <div className="relative max-w-5xl mx-auto px-4 py-12 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-yellow-500/20 border border-yellow-500/40 text-yellow-400 text-xs font-semibold mb-4">
            <Star className="w-3.5 h-3.5" />
            Promotions Exclusives
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-text-primary mb-3">
            Vos <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-amber-500">Bonus</span>
          </h1>
          <p className="text-text-secondary max-w-md mx-auto">
            Profitez de nos offres exclusives — bonus de bienvenue, cashback hebdomadaire et paris gratuits.
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Tabs */}
        <div className="flex bg-background-elevated rounded-xl p-1 mb-8 gap-1">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                activeTab === tab.id
                  ? 'bg-accent-primary text-white shadow'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className={`w-5 h-5 rounded-full text-xs flex items-center justify-center ${
                  activeTab === tab.id ? 'bg-white/20' : 'bg-background-primary'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Available Bonuses Tab */}
        {activeTab === 'available' && (
          <div className="space-y-6">
            {BONUS_OFFERS.map(offer => {
              const Icon = offer.icon
              const isExpanded = expandedOffer === offer.id
              return (
                <div key={offer.id} className="bg-background-secondary rounded-2xl border border-background-elevated overflow-hidden">
                  {/* Header */}
                  <div className={`bg-gradient-to-r ${offer.color} p-5 flex items-center gap-4`}>
                    <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`${offer.badgeColor} text-white text-xs font-bold px-2 py-0.5 rounded-full`}>
                          {offer.badge}
                        </span>
                      </div>
                      <h2 className="font-bold text-white text-lg leading-tight">{offer.title}</h2>
                      <p className="text-white/80 text-sm">{offer.subtitle}</p>
                    </div>
                  </div>

                  {/* Body */}
                  <div className="p-5 space-y-4">
                    <p className="text-text-secondary text-sm">{offer.description}</p>

                    {/* Expandable T&Cs */}
                    <button
                      onClick={() => setExpandedOffer(isExpanded ? null : offer.id)}
                      className="flex items-center gap-2 text-accent-primary text-sm font-medium hover:opacity-80 transition-opacity"
                    >
                      <Info className="w-4 h-4" />
                      {isExpanded ? 'Masquer les conditions' : 'Voir les conditions'}
                      <ChevronRight className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                    </button>

                    {isExpanded && (
                      <ul className="space-y-2 pl-2">
                        {offer.terms.map(term => (
                          <li key={term} className="flex items-start gap-2 text-sm text-text-secondary">
                            <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                            {term}
                          </li>
                        ))}
                      </ul>
                    )}

                    {/* CTA */}
                    {offer.id === 'welcome' && (
                      <button
                        onClick={() => setWelcomeModalOpen(true)}
                        className={`w-full py-3 rounded-xl bg-gradient-to-r ${offer.color} text-white font-bold hover:opacity-90 transition-opacity`}
                      >
                        Déposer & Activer
                      </button>
                    )}
                    {offer.id === 'cashback' && (
                      <div className="flex items-center gap-2 p-3 bg-blue-500/10 border border-blue-500/30 rounded-xl text-sm text-blue-400">
                        <Zap className="w-4 h-4 flex-shrink-0" />
                        Automatiquement crédité chaque lundi selon votre activité de la semaine.
                      </div>
                    )}
                    {offer.id === 'bet_and_get' && (
                      <a
                        href="/sports"
                        className={`w-full py-3 rounded-xl bg-gradient-to-r ${offer.color} text-white font-bold hover:opacity-90 transition-opacity flex items-center justify-center gap-2`}
                      >
                        <Gift className="w-4 h-4" />
                        Parier maintenant
                      </a>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Active Bonuses Tab */}
        {activeTab === 'active' && (
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-12 text-text-secondary">Chargement...</div>
            ) : activeBonuses.length === 0 ? (
              <div className="text-center py-16">
                <Trophy className="w-12 h-12 text-text-secondary mx-auto mb-3 opacity-30" />
                <p className="text-text-secondary font-medium">Aucun bonus actif</p>
                <p className="text-text-secondary text-sm mt-1">Réclamez un bonus dans l'onglet "Disponibles"</p>
                <button onClick={() => setActiveTab('available')} className="mt-4 px-5 py-2.5 rounded-xl bg-accent-primary text-white text-sm font-semibold hover:opacity-90 transition-opacity">
                  Voir les offres
                </button>
              </div>
            ) : (
              activeBonuses.map(bonus => (
                <ActiveBonusCard key={bonus.id} bonus={bonus} onForfeit={handleForfeit} />
              ))
            )}
          </div>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <div className="text-center py-16">
            <Clock className="w-12 h-12 text-text-secondary mx-auto mb-3 opacity-30" />
            <p className="text-text-secondary font-medium">Aucun historique de bonus</p>
            <p className="text-text-secondary text-sm mt-1">Vos bonus complétés et expirés apparaîtront ici</p>
          </div>
        )}
      </div>

      {/* Welcome Bonus Modal */}
      <WelcomeBonusModal
        isOpen={welcomeModalOpen}
        onClose={() => setWelcomeModalOpen(false)}
        bonusAmount={100}
        wageringRequirement={3500}
        freeSpins={50}
        maxBetLimit={5}
        expiresAt={new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()}
        onStartPlaying={() => window.location.href = '/casino'}
      />
    </div>
  )
}
