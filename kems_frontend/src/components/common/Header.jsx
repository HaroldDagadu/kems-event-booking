import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { Button } from '../ui/Button'
import { ROUTES } from '../../utils/constants'
import { getUserInitials, getRoleBadgeColor } from '../../lib/utils'

function Header() {
  const { user, logout, isAuthenticated } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate(ROUTES.LOGIN)
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <header className="kems-header">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo and Title */}
          <div className="flex items-center space-x-4">
            <Link to={ROUTES.DASHBOARD} className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center shadow-md">
                <span className="text-white font-bold text-lg">KNUST</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-green-800">KEMS</h1>
                <p className="text-xs text-green-600">Events Management System</p>
              </div>
            </Link>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center space-x-6">
            <Link 
              to={ROUTES.DASHBOARD} 
              className="kems-nav-item"
            >
              Dashboard
            </Link>
            {user?.role !== 'outsider' && (
              <>
                <Link 
                  to={ROUTES.BOOKING.CREATE} 
                  className="kems-nav-item"
                >
                  Book Venue
                </Link>
                <Link 
                  to={ROUTES.EVENTS.FOR_YOU} 
                  className="kems-nav-item"
                >
                  Events
                </Link>
              </>
            )}
          </nav>

          {/* User Profile and Actions */}
          <div className="flex items-center space-x-4">
            {/* User Info */}
            <div className="flex items-center space-x-3">
              <div className="hidden sm:block text-right">
                <p className="text-sm font-medium text-green-800">{user?.full_name}</p>
                <div className="flex items-center justify-end">
                  <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${getRoleBadgeColor(user?.role)}`}>
                    {user?.role}
                  </span>
                </div>
              </div>
              
              {/* Avatar */}
              <Link 
                to={ROUTES.PROFILE}
                className="w-10 h-10 bg-green-600 text-white rounded-full flex items-center justify-center font-medium hover:bg-green-700 transition-colors shadow-md"
              >
                {getUserInitials(user?.full_name)}
              </Link>
            </div>

            {/* Logout Button */}
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleLogout}
              className="border-green-300 text-green-700 hover:bg-green-50"
            >
              Logout
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header 