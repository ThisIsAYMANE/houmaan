'use client'

import { useState, useEffect } from 'react'
import { RefreshCw, Database, Activity, TrendingUp, Settings, Plus } from 'lucide-react'

interface SyncStatus {
  totalMatches: number
  liveMatches: number
  upcomingMatches: number
  apiConfigured: boolean
}

export default function AdminSportsPage() {
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null)
  const [syncing, setSyncing] = useState(false)
  const [lastSync, setLastSync] = useState<string | null>(null)
  
  useEffect(() => {
    fetchSyncStatus()
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchSyncStatus, 30000)
    return () => clearInterval(interval)
  }, [])
  
  const fetchSyncStatus = async () => {
    try {
      const response = await fetch('/api/admin/sports/sync-status')
      const data = await response.json()
      setSyncStatus(data)
      if (data.lastSync) {
        setLastSync(data.lastSync)
      }
    } catch (error) {
      console.error('Error fetching sync status:', error)
    }
  }
  
  const handleManualSync = async () => {
    try {
      setSyncing(true)
      const response = await fetch('/api/admin/sports/sync', {
        method: 'POST',
      })
      const data = await response.json()
      
      alert(`Synchronisation terminée!\nMatchs synchronisés: ${data.matchesSynced}\nCotes synchronisées: ${data.oddsSynced}`)
      
      // Refresh status
      await fetchSyncStatus()
      setLastSync(new Date().toISOString())
    } catch (error) {
      console.error('Error syncing:', error)
      alert('Erreur lors de la synchronisation')
    } finally {
      setSyncing(false)
    }
  }
  
  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Gestion Sports</h1>
        <p className="text-gray-400">Synchronisation et gestion des données sportives</p>
      </div>
      
      {/* API Status Alert */}
      {syncStatus && !syncStatus.apiConfigured && (
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <Settings className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-yellow-500 mb-1">API Non Configurée</h3>
              <p className="text-sm text-gray-300 mb-2">
                L'API sportive n'est pas configurée. Les données affichées sont des données de test.
              </p>
              <p className="text-sm text-gray-400">
                Pour activer la synchronisation en temps réel, ajoutez votre clé API dans le fichier <code className="px-2 py-1 bg-gray-800 rounded">.env</code>:
              </p>
              <pre className="mt-2 p-3 bg-gray-900 rounded text-xs text-gray-300 overflow-x-auto">
                SPORTS_API_KEY=your-api-key-here{'\n'}
                SPORTS_API_URL=https://v3.football.api-sports.io
              </pre>
              <p className="text-xs text-gray-400 mt-2">
                Obtenez votre clé API: <a href="https://www.api-football.com/" target="_blank" rel="noopener noreferrer" className="text-green-500 hover:underline">API-Football</a> ou <a href="https://the-odds-api.com/" target="_blank" rel="noopener noreferrer" className="text-green-500 hover:underline">The Odds API</a>
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <Database className="w-8 h-8 text-blue-500" />
            <span className="text-3xl font-bold text-white">
              {syncStatus?.totalMatches || 0}
            </span>
          </div>
          <h3 className="text-gray-400 text-sm font-medium">Total Matchs</h3>
        </div>
        
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <Activity className="w-8 h-8 text-red-500" />
            <span className="text-3xl font-bold text-white">
              {syncStatus?.liveMatches || 0}
            </span>
          </div>
          <h3 className="text-gray-400 text-sm font-medium">Matchs en Direct</h3>
        </div>
        
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <TrendingUp className="w-8 h-8 text-green-500" />
            <span className="text-3xl font-bold text-white">
              {syncStatus?.upcomingMatches || 0}
            </span>
          </div>
          <h3 className="text-gray-400 text-sm font-medium">Matchs à Venir</h3>
        </div>
      </div>
      
      {/* Sync Controls */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-white mb-1">Synchronisation</h2>
            <p className="text-sm text-gray-400">
              {lastSync
                ? `Dernière synchronisation: ${new Date(lastSync).toLocaleString('fr-FR')}`
                : 'Aucune synchronisation récente'}
            </p>
          </div>
          <button
            onClick={handleManualSync}
            disabled={syncing || !syncStatus?.apiConfigured}
            className="px-6 py-3 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
          >
            <RefreshCw className={`w-5 h-5 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Synchronisation...' : 'Synchroniser'}
          </button>
        </div>
        
        {!syncStatus?.apiConfigured && (
          <div className="text-sm text-gray-400">
            La synchronisation manuelle est désactivée car l'API n'est pas configurée.
          </div>
        )}
      </div>
      
      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4">Actions Rapides</h3>
          <div className="space-y-3">
            <button className="w-full px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-left transition-colors flex items-center gap-3">
              <Plus className="w-5 h-5" />
              Ajouter un sport manuellement
            </button>
            <button className="w-full px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-left transition-colors flex items-center gap-3">
              <Settings className="w-5 h-5" />
              Configurer les cotes
            </button>
            <button className="w-full px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-left transition-colors flex items-center gap-3">
              <Database className="w-5 h-5" />
              Gérer les ligues
            </button>
          </div>
        </div>
        
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4">Configuration</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between py-2 border-b border-gray-700">
              <span className="text-gray-400">Synchronisation auto</span>
              <span className="text-white">
                {syncStatus?.apiConfigured ? 'Activée (30s)' : 'Désactivée'}
              </span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-700">
              <span className="text-gray-400">API Status</span>
              <span className={syncStatus?.apiConfigured ? 'text-green-500' : 'text-red-500'}>
                {syncStatus?.apiConfigured ? 'Connectée' : 'Non configurée'}
              </span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-gray-400">Mode</span>
              <span className="text-white">
                {syncStatus?.apiConfigured ? 'Production' : 'Développement (Mock)'}
              </span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Instructions */}
      <div className="mt-6 bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h3 className="text-lg font-semibold text-white mb-3">Comment activer la synchronisation en temps réel</h3>
        <ol className="space-y-2 text-sm text-gray-300">
          <li className="flex gap-2">
            <span className="text-green-500 font-bold">1.</span>
            <span>Créez un compte sur <a href="https://www.api-football.com/" target="_blank" rel="noopener noreferrer" className="text-green-500 hover:underline">API-Football</a> (100 requêtes/jour gratuites)</span>
          </li>
          <li className="flex gap-2">
            <span className="text-green-500 font-bold">2.</span>
            <span>Copiez votre clé API depuis le tableau de bord</span>
          </li>
          <li className="flex gap-2">
            <span className="text-green-500 font-bold">3.</span>
            <span>Ajoutez la clé dans votre fichier <code className="px-2 py-1 bg-gray-900 rounded">.env</code></span>
          </li>
          <li className="flex gap-2">
            <span className="text-green-500 font-bold">4.</span>
            <span>Redémarrez le serveur avec <code className="px-2 py-1 bg-gray-900 rounded">npm run dev</code></span>
          </li>
          <li className="flex gap-2">
            <span className="text-green-500 font-bold">5.</span>
            <span>Cliquez sur "Synchroniser" pour importer les matchs en cours</span>
          </li>
        </ol>
      </div>
    </div>
  )
}



