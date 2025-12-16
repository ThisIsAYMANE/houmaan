'use client'

export default function BCJetonCard() {
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-background-elevated rounded-md border border-accent-primary/20">
      <div className="w-6 h-6 bg-accent-primary rounded-full flex items-center justify-center">
        <span className="text-background-primary text-xs font-bold">BC</span>
      </div>
      <div className="flex flex-col">
        <span className="text-xs text-text-secondary">BC Jeton</span>
        <span className="text-sm font-semibold text-accent-primary">0.00</span>
      </div>
    </div>
  )
}

