'use client'

import { Bell, Search, User } from 'lucide-react'
import { useEffect, useState } from 'react'

export default function AdminHeader() {
  const [adminUser, setAdminUser] = useState<any>(null)

  useEffect(() => {
    const userStr = localStorage.getItem('admin_user')
    if (userStr) {
      try {
        setAdminUser(JSON.parse(userStr))
      } catch (e) {
        console.error('Error parsing admin user:', e)
      }
    }
  }, [])

  return (
    <header className="bg-gray-800 border-b border-gray-700 h-16 flex items-center justify-between px-6">
      <div className="flex items-center space-x-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher..."
            className="pl-10 pr-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500 w-64"
          />
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <button className="relative p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>

        <div className="flex items-center space-x-3">
          <div className="text-right">
            <p className="text-sm font-medium text-white">
              {adminUser?.username || adminUser?.email || 'Admin'}
            </p>
            <p className="text-xs text-gray-400">Administrateur</p>
          </div>
          <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center">
            <User className="w-5 h-5 text-white" />
          </div>
        </div>
      </div>
    </header>
  )
}










