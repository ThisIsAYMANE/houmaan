import { redirect } from 'next/navigation'

const categoryMap: Record<string, string> = {
  'jeux-populaires': 'popular',
}

export default function GamesIndexPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>
}) {
  const params = new URLSearchParams()
  const rawCategory = valueOf(searchParams.category)
  const rawSearch = valueOf(searchParams.search)
  const rawProvider = valueOf(searchParams.provider)
  const recent = valueOf(searchParams.recent)

  if (rawCategory) {
    params.set('category', categoryMap[rawCategory] || rawCategory)
  }

  if (recent === 'true') {
    params.set('category', 'recent')
  }

  if (rawSearch) {
    params.set('search', rawSearch)
  }

  if (rawProvider) {
    params.set('provider', rawProvider)
  }

  const query = params.toString()
  redirect(query ? `/casino?${query}` : '/casino')
}

function valueOf(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}
