import React from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { User, LogOut } from 'lucide-react'
import { ROUTES, USER_ROLES } from '../../utils/constants'

function StudentLayout() {
  const { user, loading, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    try {
      await logout()
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

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
      {/* Navbar - Different for Registrar vs Students/Lecturers */}
      <nav className="mx-auto max-w-screen-xl px-4 py-2 lg:px-8 lg:py-4 bg-white shadow-sm border-b border-gray-200">
        <div className="flex items-center justify-between text-blue-gray-900">
          {/* KNUST Logo and Branding */}
          <div className="flex items-center gap-4">
            <img 
              src="https://images.seeklogo.com/logo-png/35/1/kwame-nkrumah-university-of-science-technology-logo-png_seeklogo-350387.png"
              alt="KNUST Logo"
              className="h-12 w-auto"
            />
            <div>
              <h1 className="text-xl font-bold text-green-800">KEMS</h1>
              <p className="text-xs text-green-600">
                {user?.role === USER_ROLES.REGISTRAR ? 'Academic Events Portal' : 'Academic Portal'}
              </p>
            </div>
          </div>
          
          {/* Registrar Navigation Links */}
          {user?.role === USER_ROLES.REGISTRAR && (
            <div className="flex items-center space-x-6">
              <button
                onClick={() => navigate(ROUTES.REGISTRAR.DASHBOARD)}
                className="px-3 py-2 rounded-md text-sm font-medium transition-colors text-gray-700 hover:text-green-600 hover:bg-green-50"
              >
                Dashboard
              </button>
              <button
                onClick={() => navigate('/academic/dashboard')}
                className="px-3 py-2 rounded-md text-sm font-medium transition-colors text-green-600 bg-green-50"
              >
                Events
              </button>
            </div>
          )}
          
          {/* User Actions */}
          <div className="flex items-center gap-4">
            {/* User Info */}
            <div className="flex items-center gap-3">
              <User size={20} className="text-gray-600" />
              <div className="text-sm">
                <p className="font-medium text-gray-900">
                  {user?.full_name || 'Student'}
                </p>
                <p className="text-gray-500 capitalize">
                  {user?.role || 'student'}
                </p>
              </div>
            </div>
            
            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogOut size={16} />
              Logout
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main>
        <Outlet />
      </main>
    </div>
  )
}

export default StudentLayout