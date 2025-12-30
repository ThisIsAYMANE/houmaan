'use client'

import { useState } from 'react'
import { Download, FileText, Calendar } from 'lucide-react'

export default function ReportsPage() {
  const [dateRange, setDateRange] = useState({
    start: '',
    end: '',
  })

  const reports = [
    { id: 1, name: 'Rapport des utilisateurs', description: 'Liste complète des utilisateurs et leurs statistiques' },
    { id: 2, name: 'Rapport des paris', description: 'Détails de tous les paris effectués' },
    { id: 3, name: 'Rapport financier', description: 'Revenus, dépôts et retraits' },
    { id: 4, name: 'Rapport des jeux', description: 'Statistiques d\'utilisation des jeux' },
  ]

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Rapports</h1>
        <p className="text-gray-400 mt-2">Générer et télécharger des rapports</p>
      </div>

      {/* Date Range */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <div className="flex items-center gap-3 mb-4">
          <Calendar className="w-5 h-5 text-green-400" />
          <h2 className="text-xl font-bold text-white">Période</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Date de début
            </label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Date de fin
            </label>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
        </div>
      </div>

      {/* Reports List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {reports.map((report) => (
          <div
            key={report.id}
            className="bg-gray-800 rounded-lg p-6 border border-gray-700 hover:border-green-500 transition-colors"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                  <FileText className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">{report.name}</h3>
                  <p className="text-sm text-gray-400 mt-1">{report.description}</p>
                </div>
              </div>
            </div>
            <button className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2">
              <Download className="w-4 h-4" />
              Télécharger
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}




