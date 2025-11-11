"use client"

import { createContext, useContext, useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'

/**
 * App Context for maintaining state across page navigations
 * Prevents full page refreshes when navigating between routes
 */
const AppContext = createContext(undefined)

export function AppProvider({ children }) {
  const [appState, setAppState] = useState({
    isLoading: false,
    currentPage: null,
    previousPage: null,
  })
  const pathname = usePathname()

  useEffect(() => {
    setAppState(prev => ({
      ...prev,
      previousPage: prev.currentPage,
      currentPage: pathname,
    }))
  }, [pathname])

  const updateAppState = (updates) => {
    setAppState(prev => ({ ...prev, ...updates }))
  }

  return (
    <AppContext.Provider value={{ appState, updateAppState }}>
      {children}
    </AppContext.Provider>
  )
}

export function useAppContext() {
  const context = useContext(AppContext)
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider')
  }
  return context
}


