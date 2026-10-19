import React from 'react'
import { useNavigate } from 'react-router-dom'
import { User, LogOut } from 'lucide-react'

const StudentNavbar = ({ user, onLogout }) => {
  const navigate = useNavigate()

  return (
    <nav className="w-full bg-white shadow-sm border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* KNUST Logo and Header */}
        <div className="flex items-center gap-4">
          <img 
            src="https://images.seeklogo.com/logo-png/35/1/kwame-nkrumah-university-of-science-technology-logo-png_seeklogo-350387.png"
            alt="KNUST Logo"
            className="h-12 w-auto"
          />
          <div>
            <h1 className="text-xl font-bold text-green-800">KEMS</h1>
            <p className="text-xs text-green-600">Academic Portal</p>
          </div>
        </div>

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
            onClick={onLogout}
            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </div>
    </nav>
  )
}

export default StudentNavbar