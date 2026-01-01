'use client'

import { useState } from 'react'
import { Plus, X } from 'lucide-react'

interface BetBuilderProps {
  matchId: string
  homeTeam: string
  awayTeam: string
  markets: Array<{
    id: string
    name: string
    type: string
    selections: Array<{
      id: string
      label: string
      odds: number
    }>
  }>
  onBuild?: (selections: Array<{ marketId: string; selectionId: string; odds: number }>) => void
}

export default function BetBuilder({
  matchId,
  homeTeam,
  awayTeam,
  markets,
  onBuild
}: BetBuilderProps) {
  const [selectedSelections, setSelectedSelections] = useState<
    Array<{ marketId: string; selectionId: string; label: string; odds: number }>
  >([])

  const handleSelectionClick = (
    marketId: string,
    selectionId: string,
    label: string,
    odds: number
  ) => {
    const existing = selectedSelections.find(
      s => s.marketId === marketId
    )

    if (existing) {
      // Replace existing selection in same market
      setSelectedSelections(prev =>
        prev.map(s =>
          s.marketId === marketId
            ? { marketId, selectionId, label, odds }
            : s
        )
      )
    } else {
      // Add new selection
      setSelectedSelections(prev => [...prev, { marketId, selectionId, label, odds }])
    }
  }

  const handleRemoveSelection = (marketId: string) => {
    setSelectedSelections(prev => prev.filter(s => s.marketId !== marketId))
  }

  const totalOdds = selectedSelections.reduce((acc, sel) => acc * sel.odds, 1)

  const handleBuild = () => {
    if (selectedSelections.length > 0) {
      onBuild?.(selectedSelections.map(s => ({
        marketId: s.marketId,
        selectionId: s.selectionId,
        odds: s.odds
      })))
    }
  }

  return (
    <div className="bg-bg-secondary rounded-lg border border-border-primary p-6">
      <h3 className="text-xl font-bold text-text-primary mb-4">Créateur de pari</h3>
      <p className="text-sm text-text-secondary mb-4">
        {homeTeam} vs {awayTeam}
      </p>

      {/* Selected Selections */}
      {selectedSelections.length > 0 && (
        <div className="bg-bg-tertiary rounded-lg p-4 mb-4">
          <h4 className="text-sm font-semibold text-text-primary mb-2">Sélections</h4>
          <div className="space-y-2">
            {selectedSelections.map((sel) => {
              const market = markets.find(m => m.id === sel.marketId)
              return (
                <div
                  key={sel.marketId}
                  className="flex items-center justify-between bg-bg-primary rounded p-2"
                >
                  <div>
                    <span className="text-xs text-text-secondary">{market?.name}:</span>
                    <span className="text-sm text-text-primary ml-2">{sel.label}</span>
                    <span className="text-sm font-bold text-text-primary ml-2">
                      ({sel.odds.toFixed(2)})
                    </span>
                  </div>
                  <button
                    onClick={() => handleRemoveSelection(sel.marketId)}
                    className="p-1 hover:bg-bg-tertiary rounded transition-colors"
                  >
                    <X className="w-4 h-4 text-text-secondary" />
                  </button>
                </div>
              )
            })}
          </div>
          <div className="mt-3 pt-3 border-t border-border-primary">
            <div className="flex items-center justify-between">
              <span className="text-sm text-text-secondary">Cotes combinées:</span>
              <span className="text-lg font-bold text-green-500">
                {totalOdds.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Markets */}
      <div className="space-y-4">
        {markets.map((market) => (
          <div key={market.id} className="bg-bg-tertiary rounded-lg p-4">
            <h4 className="font-semibold text-text-primary mb-3">{market.name}</h4>
            <div className="grid grid-cols-3 gap-2">
              {market.selections.map((selection) => {
                const isSelected = selectedSelections.some(
                  s => s.marketId === market.id && s.selectionId === selection.id
                )
                return (
                  <button
                    key={selection.id}
                    onClick={() =>
                      handleSelectionClick(
                        market.id,
                        selection.id,
                        selection.label,
                        selection.odds
                      )
                    }
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      isSelected
                        ? 'bg-accent-primary text-white'
                        : 'bg-bg-primary text-text-primary hover:bg-bg-secondary'
                    }`}
                  >
                    <div className="text-xs mb-1">{selection.label}</div>
                    <div className="text-sm font-bold">{selection.odds.toFixed(2)}</div>
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Build Button */}
      {selectedSelections.length > 0 && (
        <button
          onClick={handleBuild}
          className="w-full mt-6 px-6 py-3 bg-accent-primary text-white rounded-lg font-semibold hover:bg-accent-primary/90 transition-colors"
        >
          Ajouter au coupon
        </button>
      )}
    </div>
  )
}






import { useState } from 'react'
import { Plus, X } from 'lucide-react'

interface BetBuilderProps {
  matchId: string
  homeTeam: string
  awayTeam: string
  markets: Array<{
    id: string
    name: string
    type: string
    selections: Array<{
      id: string
      label: string
      odds: number
    }>
  }>
  onBuild?: (selections: Array<{ marketId: string; selectionId: string; odds: number }>) => void
}

export default function BetBuilder({
  matchId,
  homeTeam,
  awayTeam,
  markets,
  onBuild
}: BetBuilderProps) {
  const [selectedSelections, setSelectedSelections] = useState<
    Array<{ marketId: string; selectionId: string; label: string; odds: number }>
  >([])

  const handleSelectionClick = (
    marketId: string,
    selectionId: string,
    label: string,
    odds: number
  ) => {
    const existing = selectedSelections.find(
      s => s.marketId === marketId
    )

    if (existing) {
      // Replace existing selection in same market
      setSelectedSelections(prev =>
        prev.map(s =>
          s.marketId === marketId
            ? { marketId, selectionId, label, odds }
            : s
        )
      )
    } else {
      // Add new selection
      setSelectedSelections(prev => [...prev, { marketId, selectionId, label, odds }])
    }
  }

  const handleRemoveSelection = (marketId: string) => {
    setSelectedSelections(prev => prev.filter(s => s.marketId !== marketId))
  }

  const totalOdds = selectedSelections.reduce((acc, sel) => acc * sel.odds, 1)

  const handleBuild = () => {
    if (selectedSelections.length > 0) {
      onBuild?.(selectedSelections.map(s => ({
        marketId: s.marketId,
        selectionId: s.selectionId,
        odds: s.odds
      })))
    }
  }

  return (
    <div className="bg-bg-secondary rounded-lg border border-border-primary p-6">
      <h3 className="text-xl font-bold text-text-primary mb-4">Créateur de pari</h3>
      <p className="text-sm text-text-secondary mb-4">
        {homeTeam} vs {awayTeam}
      </p>

      {/* Selected Selections */}
      {selectedSelections.length > 0 && (
        <div className="bg-bg-tertiary rounded-lg p-4 mb-4">
          <h4 className="text-sm font-semibold text-text-primary mb-2">Sélections</h4>
          <div className="space-y-2">
            {selectedSelections.map((sel) => {
              const market = markets.find(m => m.id === sel.marketId)
              return (
                <div
                  key={sel.marketId}
                  className="flex items-center justify-between bg-bg-primary rounded p-2"
                >
                  <div>
                    <span className="text-xs text-text-secondary">{market?.name}:</span>
                    <span className="text-sm text-text-primary ml-2">{sel.label}</span>
                    <span className="text-sm font-bold text-text-primary ml-2">
                      ({sel.odds.toFixed(2)})
                    </span>
                  </div>
                  <button
                    onClick={() => handleRemoveSelection(sel.marketId)}
                    className="p-1 hover:bg-bg-tertiary rounded transition-colors"
                  >
                    <X className="w-4 h-4 text-text-secondary" />
                  </button>
                </div>
              )
            })}
          </div>
          <div className="mt-3 pt-3 border-t border-border-primary">
            <div className="flex items-center justify-between">
              <span className="text-sm text-text-secondary">Cotes combinées:</span>
              <span className="text-lg font-bold text-green-500">
                {totalOdds.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Markets */}
      <div className="space-y-4">
        {markets.map((market) => (
          <div key={market.id} className="bg-bg-tertiary rounded-lg p-4">
            <h4 className="font-semibold text-text-primary mb-3">{market.name}</h4>
            <div className="grid grid-cols-3 gap-2">
              {market.selections.map((selection) => {
                const isSelected = selectedSelections.some(
                  s => s.marketId === market.id && s.selectionId === selection.id
                )
                return (
                  <button
                    key={selection.id}
                    onClick={() =>
                      handleSelectionClick(
                        market.id,
                        selection.id,
                        selection.label,
                        selection.odds
                      )
                    }
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      isSelected
                        ? 'bg-accent-primary text-white'
                        : 'bg-bg-primary text-text-primary hover:bg-bg-secondary'
                    }`}
                  >
                    <div className="text-xs mb-1">{selection.label}</div>
                    <div className="text-sm font-bold">{selection.odds.toFixed(2)}</div>
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Build Button */}
      {selectedSelections.length > 0 && (
        <button
          onClick={handleBuild}
          className="w-full mt-6 px-6 py-3 bg-accent-primary text-white rounded-lg font-semibold hover:bg-accent-primary/90 transition-colors"
        >
          Ajouter au coupon
        </button>
      )}
    </div>
  )
}







