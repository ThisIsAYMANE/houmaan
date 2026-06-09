import Link from 'next/link'
import { ArrowLeft, Sparkles } from 'lucide-react'

interface PlannedPageProps {
  title: string
  description?: string
}

export default function PlannedPage({ title, description }: PlannedPageProps) {
  return (
    <div className="min-h-[60vh] px-4 py-12">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-accent-primary/15">
            <Sparkles className="h-6 w-6 text-accent-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-text-primary">{title}</h1>
            <p className="mt-1 text-text-secondary">
              {description || 'Cette section est en cours de preparation.'}
            </p>
          </div>
        </div>

        <div className="rounded-lg border border-border-primary bg-bg-secondary p-6">
          <p className="text-text-secondary">
            Cette destination existe maintenant dans la navigation afin d'eviter une page 404.
            Le contenu complet pourra etre branche ici lorsque cette section sera prete.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-lg bg-accent-primary px-4 py-2 font-semibold text-white transition-colors hover:bg-accent-primary/90"
            >
              <ArrowLeft className="h-4 w-4" />
              Accueil
            </Link>
            <Link
              href="/casino"
              className="rounded-lg bg-bg-tertiary px-4 py-2 font-semibold text-text-primary transition-colors hover:bg-bg-primary"
            >
              Casino
            </Link>
            <Link
              href="/sports"
              className="rounded-lg bg-bg-tertiary px-4 py-2 font-semibold text-text-primary transition-colors hover:bg-bg-primary"
            >
              Sports
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
