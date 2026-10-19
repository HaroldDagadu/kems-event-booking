import React, { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { Button } from '../ui/Button'
import { ROUTES, USER_ROLES } from '../../utils/constants'
import { getUserInitials, getRoleBadgeColor } from '../../lib/utils'
import {
  Bars3Icon,
  XMarkIcon,
  ChevronDownIcon,
  UserIcon,
  ArrowRightOnRectangleIcon,
  Cog6ToothIcon,
  BellAlertIcon
} from "@heroicons/react/24/outline";

const navigationItems = {
  [USER_ROLES.STUDENT]: [
    { name: 'Dashboard', path: ROUTES.DASHBOARD, icon: '📊' },
    { name: 'Book Venue', path: ROUTES.BOOKING.CREATE, icon: '📅' },
    { name: 'My Bookings', path: ROUTES.BOOKING.STATUS, icon: '📋' },
    { name: 'Events for You', path: ROUTES.EVENTS.FOR_YOU, icon: '🎯' },
    { name: 'Public Events', path: ROUTES.EVENTS.PUBLIC, icon: '🌐' },
    { name: 'Invited Events', path: ROUTES.EVENTS.INVITED, icon: '📨' },
  ],
  [USER_ROLES.LECTURER]: [
    { name: 'Dashboard', path: ROUTES.DASHBOARD, icon: '📊' },
    { name: 'Book Venue', path: ROUTES.BOOKING.CREATE, icon: '📅' },
    { name: 'My Bookings', path: ROUTES.BOOKING.STATUS, icon: '📋' },
    { name: 'Events for You', path: ROUTES.EVENTS.FOR_YOU, icon: '🎯' },
    { name: 'Public Events', path: ROUTES.EVENTS.PUBLIC, icon: '🌐' },
    { name: 'Invited Events', path: ROUTES.EVENTS.INVITED, icon: '📨' },
  ],
  [USER_ROLES.REGISTRAR]: [
    { name: 'Dashboard', path: ROUTES.REGISTRAR.DASHBOARD, icon: '📊' },
    { name: 'Events', path: '/academic/dashboard', icon: '🎯' },

  ],
  [USER_ROLES.OUTSIDER]: [
    { name: 'Payment', path: '/payment', icon: '💳' },
  ]
}

function Navbar() {
  const { user, logout, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [openMenu, setOpenMenu] = useState(false)
  const [openNav, setOpenNav] = useState(false)

  React.useEffect(() => {
    window.addEventListener(
      "resize",
      () => window.innerWidth >= 960 && setOpenNav(false),
    );
  }, []);

  const handleLogout = async () => {
    await logout()
    navigate(ROUTES.LOGIN)
  }

  if (!isAuthenticated) {
    return null
  }

  const userNavItems = navigationItems[user?.role] || []
  const isRegistrar = user?.role === USER_ROLES.REGISTRAR

  // For registrar, use the existing RegistrarNavbar design
  if (isRegistrar) {
    return (
      <nav className="mx-auto max-w-screen-xl px-4 py-2 lg:px-8 lg:py-4 bg-white shadow-sm border-b border-gray-200">
        <div className="flex items-center justify-between text-blue-gray-900">
          <div className="flex items-center gap-4">
            <img 
              src="https://images.seeklogo.com/logo-png/35/1/kwame-nkrumah-university-of-science-technology-logo-png_seeklogo-350387.png"
              alt="KNUST Logo"
              className="h-12 w-auto"
            />
            <div>
              <h1 className="text-xl font-bold text-green-800">KEMS</h1>
              <p className="text-xs text-green-600">Registrar Portal</p>
            </div>
          </div>
          
          {/* Navigation Links for Registrar */}
          <div className="hidden lg:flex items-center space-x-6">
            {userNavItems.map((item) => {
              const isActive = location.pathname === item.path || 
                             (item.path !== ROUTES.REGISTRAR.DASHBOARD && location.pathname.startsWith(item.path))
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? "text-green-600 bg-green-50"
                      : "text-gray-700 hover:text-green-600 hover:bg-green-50"
                  }`}
                >
                  {item.name}
                </Link>
              )
            })}
          </div>
          
          <div className="hidden flex-wrap items-center gap-2 lg:flex">
            <Button variant="text" size="sm">
              <BellAlertIcon className="h-5 w-5" />
            </Button>
            
            <div className="relative">
              <Button
                size="sm"
                variant="outlined"
                className="hidden items-center gap-2 lg:flex"
                onClick={() => setOpenMenu(!openMenu)}
              >
                <UserIcon className="h-4 w-4" />
                {user?.full_name}
                <ChevronDownIcon
                  strokeWidth={2.5}
                  className={`h-3.5 w-3.5 transition-transform ${
                    openMenu ? "rotate-180" : ""
                  }`}
                />
              </Button>
              
              {openMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
                  <Link
                    to={ROUTES.PROFILE}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <UserIcon className="h-4 w-4" />
                    Profile
                  </Link>
                  <Link
                    to="#"
                    className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <Cog6ToothIcon className="h-4 w-4" />
                    Settings
                  </Link>
                  <hr className="my-2" />
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full text-left"
                  >
                    <ArrowRightOnRectangleIcon className="h-4 w-4" />
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
          
          <Button
            variant="text"
            className="lg:hidden"
            onClick={() => setOpenNav(!openNav)}
          >
            {openNav ? (
              <XMarkIcon className="h-6 w-6" strokeWidth={2} />
            ) : (
              <Bars3Icon className="h-6 w-6" strokeWidth={2} />
            )}
          </Button>
        </div>
        
        {/* Mobile Navigation for Registrar */}
        {openNav && (
          <div className="lg:hidden mt-4 pb-4">
            <div className="flex flex-col space-y-2">
              {userNavItems.map((item) => {
                const isActive = location.pathname === item.path || 
                               (item.path !== ROUTES.REGISTRAR.DASHBOARD && location.pathname.startsWith(item.path))
                
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive
                        ? "text-green-600 bg-green-50"
                        : "text-gray-700 hover:text-green-600 hover:bg-green-50"
                    }`}
                    onClick={() => setOpenNav(false)}
                  >
                    {item.name}
                  </Link>
                )
              })}
            </div>
            <div className="mt-4 pt-4 border-t border-gray-200">
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 w-full text-left rounded-md"
              >
                <ArrowRightOnRectangleIcon className="h-4 w-4" />
                Logout
              </button>
            </div>
          </div>
        )}
      </nav>
    )
  }

  // For students and lecturers, use a different design with navigation items in the navbar
  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
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

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            {userNavItems.map((item) => {
              const isActive = location.pathname === item.path || 
                             (item.path !== ROUTES.DASHBOARD && location.pathname.startsWith(item.path))
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? "text-green-600 bg-green-50"
                      : "text-gray-700 hover:text-green-600 hover:bg-green-50"
                  }`}
                >
                  <span className="text-lg">{item.icon}</span>
                  <span>{item.name}</span>
                </Link>
              )
            })}
          </div>

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

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button
              variant="text"
              onClick={() => setOpenNav(!openNav)}
            >
              {openNav ? (
                <XMarkIcon className="h-6 w-6" strokeWidth={2} />
              ) : (
                <Bars3Icon className="h-6 w-6" strokeWidth={2} />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {openNav && (
          <div className="md:hidden pb-4">
            <div className="flex flex-col space-y-2">
              {userNavItems.map((item) => {
                const isActive = location.pathname === item.path || 
                               (item.path !== ROUTES.DASHBOARD && location.pathname.startsWith(item.path))
                
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive
                        ? "text-green-600 bg-green-50"
                        : "text-gray-700 hover:text-green-600 hover:bg-green-50"
                    }`}
                    onClick={() => setOpenNav(false)}
                  >
                    <span className="text-lg">{item.icon}</span>
                    <span>{item.name}</span>
                  </Link>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}

export default Navbar 