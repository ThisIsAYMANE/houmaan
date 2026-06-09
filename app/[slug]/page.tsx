import PlannedPage from '@/components/layout/PlannedPage'

const pageTitles: Record<string, string> = {
  about: 'A propos',
  anniversary: 'Anniversaire',
  betting_info: 'Informations sur les paris',
  bingo: 'Bingo',
  blog: 'Blog',
  bonuses: 'Bonus',
  careers: 'Carrieres',
  chat: 'Chat en direct',
  contact: 'Contact',
  course: 'Course',
  faq: 'FAQ',
  forum: 'Forum',
  futures: 'Contrats a terme',
  haut_bas: 'Haut Bas',
  help: 'Centre d aide',
  lottery: 'Loterie',
  poker: 'Poker',
  press: 'Presse',
  privacy: 'Politique de confidentialite',
  promotions: 'Promotions',
  provably_fair: 'Jeux prouve-equitable',
  quests: 'Centre de quetes',
  referrals: 'Parrainage',
  responsible_gaming: 'Jeu responsable',
  terms: 'Conditions generales',
  vip: 'VIP Club',
}

function titleFromSlug(slug: string) {
  const key = slug.replace(/-/g, '_')
  if (pageTitles[key]) return pageTitles[key]

  return slug
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

export default function TopLevelPlannedPage({ params }: { params: { slug: string } }) {
  return <PlannedPage title={titleFromSlug(params.slug)} />
}
