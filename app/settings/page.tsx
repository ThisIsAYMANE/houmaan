'use client'

import { useState } from 'react'
import { Settings as SettingsIcon, User, Shield, Bell, Globe, Moon, Sun } from 'lucide-react'
import LanguageModal from '@/components/settings/LanguageModal'
import ThemeToggle from '@/components/settings/ThemeToggle'
import { useAuthStore } from '@/stores/auth-store'

export default function SettingsPage() {
  const { user, isAuthenticated } = useAuthStore()
  const [showLanguageModal, setShowLanguageModal] = useState(false)
  const [currentLanguage, setCurrentLanguage] = useState('fr')
  const [currentCurrency, setCurrentCurrency] = useState('MAD')

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-text-primary mb-2">Paramètres</h1>
        <p className="text-text-secondary">
          Gérez vos préférences et paramètres de compte
        </p>
      </div>

      <div className="space-y-6">
        {/* Account Settings */}
        <section className="bg-background-secondary rounded-lg border border-background-elevated p-6">
          <div className="flex items-center gap-3 mb-6">
            <User className="w-5 h-5 text-accent-primary" />
            <h2 className="text-xl font-semibold text-text-primary">Compte</h2>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-background-elevated">
              <div>
                <p className="text-text-primary font-medium">Email</p>
                <p className="text-sm text-text-secondary">
                  {isAuthenticated && user ? user.email : 'Non connecté'}
                </p>
              </div>
              <button className="text-sm text-accent-primary hover:underline">
                Modifier
              </button>
            </div>

            <div className="flex items-center justify-between py-3 border-b border-background-elevated">
              <div>
                <p className="text-text-primary font-medium">Nom d'utilisateur</p>
                <p className="text-sm text-text-secondary">
                  {isAuthenticated && user?.username
                    ? user.username
                    : 'Non défini'}
                </p>
              </div>
              <button className="text-sm text-accent-primary hover:underline">
                Modifier
              </button>
            </div>

            <div className="flex items-center justify-between py-3">
              <div>
                <p className="text-text-primary font-medium">Mot de passe</p>
                <p className="text-sm text-text-secondary">••••••••</p>
              </div>
              <button className="text-sm text-accent-primary hover:underline">
                Modifier
              </button>
            </div>
          </div>
        </section>

        {/* Security Settings */}
        <section className="bg-background-secondary rounded-lg border border-background-elevated p-6">
          <div className="flex items-center gap-3 mb-6">
            <Shield className="w-5 h-5 text-accent-primary" />
            <h2 className="text-xl font-semibold text-text-primary">Sécurité</h2>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-background-elevated">
              <div>
                <p className="text-text-primary font-medium">Authentification à deux facteurs</p>
                <p className="text-sm text-text-secondary">
                  Ajoutez une couche de sécurité supplémentaire
                </p>
              </div>
              <button className="text-sm text-accent-primary hover:underline">
                Activer
              </button>
            </div>

            <div className="flex items-center justify-between py-3">
              <div>
                <p className="text-text-primary font-medium">Sessions actives</p>
                <p className="text-sm text-text-secondary">
                  Gérez vos sessions actives
                </p>
              </div>
              <button className="text-sm text-accent-primary hover:underline">
                Voir
              </button>
            </div>
          </div>
        </section>

        {/* Preferences */}
        <section className="bg-background-secondary rounded-lg border border-background-elevated p-6">
          <div className="flex items-center gap-3 mb-6">
            <Globe className="w-5 h-5 text-accent-primary" />
            <h2 className="text-xl font-semibold text-text-primary">Préférences</h2>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-background-elevated">
              <div>
                <p className="text-text-primary font-medium">Langue & Devise</p>
                <p className="text-sm text-text-secondary">
                  {currentLanguage === 'fr' ? 'Français' : 'English'} • {currentCurrency}
                </p>
              </div>
              <button
                onClick={() => setShowLanguageModal(true)}
                className="text-sm text-accent-primary hover:underline"
              >
                Modifier
              </button>
            </div>

            <div className="flex items-center justify-between py-3">
              <div>
                <p className="text-text-primary font-medium">Thème</p>
                <p className="text-sm text-text-secondary">
                  Mode sombre/clair
                </p>
              </div>
              <ThemeToggle />
            </div>
          </div>
        </section>

        {/* Notifications */}
        <section className="bg-background-secondary rounded-lg border border-background-elevated p-6">
          <div className="flex items-center gap-3 mb-6">
            <Bell className="w-5 h-5 text-accent-primary" />
            <h2 className="text-xl font-semibold text-text-primary">Notifications</h2>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-background-elevated">
              <div>
                <p className="text-text-primary font-medium">Notifications par email</p>
                <p className="text-sm text-text-secondary">
                  Recevez des notifications par email
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-background-elevated peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent-primary"></div>
              </label>
            </div>

            <div className="flex items-center justify-between py-3 border-b border-background-elevated">
              <div>
                <p className="text-text-primary font-medium">Notifications de bonus</p>
                <p className="text-sm text-text-secondary">
                  Recevez des notifications sur les nouveaux bonus
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-background-elevated peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent-primary"></div>
              </label>
            </div>

            <div className="flex items-center justify-between py-3">
              <div>
                <p className="text-text-primary font-medium">Notifications de paris</p>
                <p className="text-sm text-text-secondary">
                  Recevez des notifications sur vos paris
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-background-elevated peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent-primary"></div>
              </label>
            </div>
          </div>
        </section>

        {/* Responsible Gaming */}
        <section className="bg-background-secondary rounded-lg border border-background-elevated p-6">
          <div className="flex items-center gap-3 mb-6">
            <Shield className="w-5 h-5 text-accent-primary" />
            <h2 className="text-xl font-semibold text-text-primary">Jeu responsable</h2>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-background-elevated">
              <div>
                <p className="text-text-primary font-medium">Limites de dépôt</p>
                <p className="text-sm text-text-secondary">
                  Définir des limites de dépôt quotidiennes/mensuelles
                </p>
              </div>
              <button className="text-sm text-accent-primary hover:underline">
                Configurer
              </button>
            </div>

            <div className="flex items-center justify-between py-3">
              <div>
                <p className="text-text-primary font-medium">Auto-exclusion</p>
                <p className="text-sm text-text-secondary">
                  Temporairement désactiver votre compte
                </p>
              </div>
              <button className="text-sm text-accent-primary hover:underline">
                Configurer
              </button>
            </div>
          </div>
        </section>
      </div>

      <LanguageModal
        isOpen={showLanguageModal}
        onClose={() => setShowLanguageModal(false)}
        currentLanguage={currentLanguage}
        currentCurrency={currentCurrency}
        onLanguageChange={(lang) => {
          setCurrentLanguage(lang)
          // TODO: Save to API
        }}
        onCurrencyChange={(curr) => {
          setCurrentCurrency(curr)
          // TODO: Save to API
        }}
      />
    </div>
  )
}







