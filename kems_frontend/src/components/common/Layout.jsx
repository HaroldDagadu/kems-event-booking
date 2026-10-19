import React from 'react'
import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'
import { useAuth } from '../../contexts/AuthContext'

function Layout() {
  const { loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-green-700">Loading KNUST Events Management System...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main className="p-6 bg-gray-50">
        <Outlet />
      </main>
    </div>
  )
}

export default Layout 