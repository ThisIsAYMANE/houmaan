'use client'

import { useState, useEffect } from 'react'
import Header from './Header'
import Sidebar from './Sidebar'
import Footer from './Footer'

interface MainLayoutProps {
  children: React.ReactNode
}

export default function MainLayout({ children }: MainLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true) // Default to open on desktop
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false) // Collapsed state (icons only)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const toggleSidebar = () => {
    // On mobile, toggle open/close
    // On desktop, toggle collapsed/expanded
    if (isMobile) {
      setSidebarOpen(!sidebarOpen)
    } else {
      setSidebarCollapsed(!sidebarCollapsed)
    }
  }

  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden">
      <Header onMenuClick={toggleSidebar} />
      
      <div className="flex flex-1 pt-16 overflow-x-hidden">
        <Sidebar 
          isOpen={sidebarOpen} 
          isCollapsed={sidebarCollapsed}
          onClose={() => setSidebarOpen(false)} 
        />
        
        <div 
          className="flex-1 flex flex-col min-h-[calc(100vh-4rem)] transition-all duration-300 ease-in-out overflow-x-hidden min-w-0"
          style={{
            marginLeft: sidebarOpen 
              ? sidebarCollapsed 
                ? '5rem' // 80px (w-20)
                : '16rem' // 256px (w-64)
              : '0',
          }}
        >
          <main className="flex-1 w-full max-w-full overflow-x-hidden min-w-0">
            {children}
          </main>
          <Footer />
        </div>
      </div>
    </div>
  )
}

