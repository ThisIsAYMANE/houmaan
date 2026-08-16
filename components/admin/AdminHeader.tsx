'use client'

import { Bell, Search, User, Sun, Moon } from 'lucide-react'
import { useEffect, useState } from 'react'
import LanguageSwitcher from '@/components/layout/LanguageSwitcher'

export default function AdminHeader() {
  const [adminUser, setAdminUser] = useState<any>(null)
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')

  useEffect(() => {
    const userStr = localStorage.getItem('admin_user')
    if (userStr) {
      try {
        setAdminUser(JSON.parse(userStr))
      } catch (e) {
        console.error('Error parsing admin user:', e)
      }
    }
    // Issue #8 (Admin): Read saved theme
    const savedTheme = (localStorage.getItem('theme') as 'dark' | 'light') || 'dark'
    setTheme(savedTheme)
  }, [])

  // Issue #8 (Admin): Theme toggle — shared with main site via same localStorage key + .dark class
  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark'
    setTheme(newTheme)
    localStorage.setItem('theme', newTheme)
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }

  return (
    <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 h-16 flex items-center justify-between px-6 transition-colors">
      <div className="flex items-center space-x-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher..."
            className="pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500 w-64 transition-colors"
          />
        </div>
      </div>

      <div className="flex items-center space-x-3">
        {/* Issue #8 (Admin): Theme toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          title={theme === 'dark' ? 'Mode clair' : 'Mode sombre'}
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>

        {/* Issue #8 (Admin): Language switcher — reuses main site component */}
        <LanguageSwitcher />

        {/* Notifications */}
        <button className="relative p-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>

        {/* Admin user info */}
        <div className="flex items-center space-x-3">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {adminUser?.username || adminUser?.email || 'Admin'}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Administrateur</p>
          </div>
          <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0">
            <User className="w-5 h-5 text-white" />
          </div>
        </div>
      </div>
    </header>
  )
}
