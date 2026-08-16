'use client'

import { useState, useEffect } from 'react'
import { Save, Bell, Shield, Globe, CreditCard, Database, RotateCcw } from 'lucide-react'
import toast from 'react-hot-toast'

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    siteName: 'Shartbandee',
    siteUrl: 'https://shartbandee.com',
    maintenanceMode: false,
    registrationEnabled: true,
    emailNotifications: true,
    smsNotifications: false,
    currency: 'EUR',
    language: 'fr',
    timezone: 'Africa/Casablanca',
    minDeposit: 20,
    maxDeposit: 100000,
    minWithdrawal: 20,
    maxWithdrawal: 50000,
  })
  const [loading, setLoading] = useState(false)
  const [initialLoad, setInitialLoad] = useState(true)

  // Phase 2B: Load real settings from DB on mount
  useEffect(() => {
    const token = localStorage.getItem('admin_session_token')
    fetch('/api/admin/settings', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => {
        if (d.success && d.data) {
          const s = d.data
          setSettings(prev => ({
            ...prev,
            siteName: s.site_name ?? prev.siteName,
            siteUrl: s.site_url ?? prev.siteUrl,
            maintenanceMode: s.maintenance_mode === 'true',
            registrationEnabled: s.registration_enabled !== 'false',
            currency: s.default_currency ?? prev.currency,
            language: s.default_language ?? prev.language,
            timezone: s.timezone ?? prev.timezone,
            minDeposit: Number(s.min_deposit ?? prev.minDeposit),
            maxDeposit: Number(s.max_deposit ?? prev.maxDeposit),
            minWithdrawal: Number(s.min_withdrawal ?? prev.minWithdrawal),
            maxWithdrawal: Number(s.max_withdrawal ?? prev.maxWithdrawal),
          }))
        }
      })
      .catch(() => {})
      .finally(() => setInitialLoad(false))
  }, [])

  // Phase 2B: Real API save
  const handleSave = async () => {
    if (settings.maintenanceMode) {
      const confirmed = window.confirm(
        '⚠️ Mode maintenance\n\nTous les utilisateurs non-administrateurs seront bloqués. Confirmer ?'
      )
      if (!confirmed) return
    }
    setLoading(true)
    try {
      const token = localStorage.getItem('admin_session_token')
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          site_name: settings.siteName,
          site_url: settings.siteUrl,
          maintenance_mode: String(settings.maintenanceMode),
          registration_enabled: String(settings.registrationEnabled),
          default_currency: settings.currency,
          default_language: settings.language,
          timezone: settings.timezone,
          min_deposit: String(settings.minDeposit),
          max_deposit: String(settings.maxDeposit),
          min_withdrawal: String(settings.minWithdrawal),
          max_withdrawal: String(settings.maxWithdrawal),
        }),
      })
      if (res.ok) {
        toast.success('Paramètres sauvegardés')
        // Re-fetch from server to update UI with confirmed values
        const refreshRes = await fetch('/api/admin/settings', { headers: { Authorization: `Bearer ${token}` } })
        const refreshData = await refreshRes.json()
        if (refreshData.success && refreshData.data) {
          const s = refreshData.data
          setSettings(prev => ({
            ...prev,
            siteName: s.site_name ?? prev.siteName,
            siteUrl: s.site_url ?? prev.siteUrl,
            maintenanceMode: s.maintenance_mode === 'true',
            registrationEnabled: s.registration_enabled !== 'false',
            currency: s.default_currency ?? prev.currency,
            language: s.default_language ?? prev.language,
            timezone: s.timezone ?? prev.timezone,
            minDeposit: Number(s.min_deposit ?? prev.minDeposit),
            maxDeposit: Number(s.max_deposit ?? prev.maxDeposit),
            minWithdrawal: Number(s.min_withdrawal ?? prev.minWithdrawal),
            maxWithdrawal: Number(s.max_withdrawal ?? prev.maxWithdrawal),
          }))
        }
      }
      else toast.error('Erreur lors de la sauvegarde')
    } catch {
      toast.error('Erreur réseau')
    } finally {
      setLoading(false)
    }
  }

  if (initialLoad) {
    return <div className="flex items-center justify-center h-64 text-gray-400">Chargement des paramètres...</div>
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Paramètres</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Gérer les paramètres de la plateforme</p>
        </div>
        <button
          onClick={handleSave}
          disabled={loading}
          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {loading ? 'Sauvegarde...' : 'Enregistrer'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Settings */}
        <div className="lg:col-span-2 space-y-6">
          {/* General Settings */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3 mb-6">
              <Globe className="w-5 h-5 text-green-400" />
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Paramètres généraux</h2>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Nom du site
                </label>
                <input
                  type="text"
                  value={settings.siteName}
                  onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  URL du site
                </label>
                <input
                  type="text"
                  value={settings.siteUrl}
                  onChange={(e) => setSettings({ ...settings, siteUrl: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Mode maintenance
                  </label>
                  <p className="text-xs text-gray-400">Désactiver l'accès public au site</p>
                </div>
                <button
                  onClick={() => setSettings({ ...settings, maintenanceMode: !settings.maintenanceMode })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.maintenanceMode ? 'bg-red-600' : 'bg-gray-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.maintenanceMode ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Inscriptions activées
                  </label>
                  <p className="text-xs text-gray-400">Permettre les nouvelles inscriptions</p>
                </div>
                <button
                  onClick={() => setSettings({ ...settings, registrationEnabled: !settings.registrationEnabled })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.registrationEnabled ? 'bg-green-600' : 'bg-gray-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.registrationEnabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Financial Settings */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center gap-3 mb-6">
              <CreditCard className="w-5 h-5 text-green-400" />
              <h2 className="text-xl font-bold text-white">Paramètres financiers</h2>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Dépôt minimum (MAD)
                </label>
                <input
                  type="number"
                  value={settings.minDeposit}
                  onChange={(e) => setSettings({ ...settings, minDeposit: Number(e.target.value) })}
                  className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Dépôt maximum (MAD)
                </label>
                <input
                  type="number"
                  value={settings.maxDeposit}
                  onChange={(e) => setSettings({ ...settings, maxDeposit: Number(e.target.value) })}
                  className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Retrait minimum (MAD)
                </label>
                <input
                  type="number"
                  value={settings.minWithdrawal}
                  onChange={(e) => setSettings({ ...settings, minWithdrawal: Number(e.target.value) })}
                  className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Retrait maximum (MAD)
                </label>
                <input
                  type="number"
                  value={settings.maxWithdrawal}
                  onChange={(e) => setSettings({ ...settings, maxWithdrawal: Number(e.target.value) })}
                  className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>
          </div>

          {/* Notifications */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center gap-3 mb-6">
              <Bell className="w-5 h-5 text-green-400" />
              <h2 className="text-xl font-bold text-white">Notifications</h2>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Notifications par email
                  </label>
                  <p className="text-xs text-gray-400">Envoyer des notifications par email</p>
                </div>
                <button
                  onClick={() => setSettings({ ...settings, emailNotifications: !settings.emailNotifications })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.emailNotifications ? 'bg-green-600' : 'bg-gray-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.emailNotifications ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Notifications SMS
                  </label>
                  <p className="text-xs text-gray-400">Envoyer des notifications par SMS</p>
                </div>
                <button
                  onClick={() => setSettings({ ...settings, smsNotifications: !settings.smsNotifications })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.smsNotifications ? 'bg-green-600' : 'bg-gray-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.smsNotifications ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Stats */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h3 className="text-lg font-bold text-white mb-4">Statistiques rapides</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-400">Utilisateurs actifs</span>
                <span className="text-white font-medium">1,234</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Revenus aujourd'hui</span>
                <span className="text-green-400 font-medium">45,000 EUR</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Paris en attente</span>
                <span className="text-yellow-400 font-medium">23</span>
              </div>
            </div>
          </div>

          {/* System Info */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center gap-3 mb-4">
              <Database className="w-5 h-5 text-green-400" />
              <h3 className="text-lg font-bold text-white">Informations système</h3>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Version</span>
                <span className="text-white">1.0.0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Base de données</span>
                <span className="text-white">SQLite</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Statut</span>
                <span className="text-green-400">Opérationnel</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}










