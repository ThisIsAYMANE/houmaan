import { redirect } from 'next/navigation'

export default function CasinoCategoryPage({ params }: { params: { category: string } }) {
  redirect(`/casino?category=${encodeURIComponent(params.category)}`)
}
