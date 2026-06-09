import { redirect } from 'next/navigation'

export default function SportsCategoryPage({ params }: { params: { sport: string } }) {
  if (params.sport === 'my-bets') {
    redirect('/bets')
  }

  redirect(`/sports?sport=${encodeURIComponent(params.sport)}`)
}
