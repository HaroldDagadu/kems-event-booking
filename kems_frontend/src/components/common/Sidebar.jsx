import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { ROUTES, USER_ROLES } from '../../utils/constants'
import { cn } from '../../lib/utils'

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
    { name: 'Manage Bookings', path: ROUTES.REGISTRAR.BOOKINGS, icon: '📋' },
    { name: 'View Payments', path: ROUTES.REGISTRAR.PAYMENTS, icon: '💳' },
    { name: 'Manage Events', path: ROUTES.REGISTRAR.EVENTS, icon: '🎪' },
    { name: 'Calendar View', path: ROUTES.REGISTRAR.CALENDAR, icon: '📆' },
  ],
  [USER_ROLES.OUTSIDER]: [
    { name: 'Payment', path: '/payment', icon: '💳' },
  ]
}

function Sidebar() {
  const { user, isAuthenticated } = useAuth()
  const location = useLocation()

  if (!isAuthenticated || !user) {
    return null
  }

  const userNavItems = navigationItems[user.role] || []

  return (
    <aside className="kems-sidebar w-64 min-h-[calc(100vh-73px)]">
      <nav className="p-4">
        <div className="mb-6 p-3 bg-green-100 rounded-lg border border-green-200">
          <h3 className="text-sm font-semibold text-green-800">KNUST KEMS</h3>
          <p className="text-xs text-green-600">Events Management</p>
        </div>
        <ul className="space-y-2">
          {userNavItems.map((item) => {
            const isActive = location.pathname === item.path || 
                           (item.path !== ROUTES.DASHBOARD && location.pathname.startsWith(item.path))
            
            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={cn(
                    "flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                    isActive
                      ? "kems-nav-item-active"
                      : "kems-nav-item"
                  )}
                >
                  <span className="text-lg">{item.icon}</span>
                  <span>{item.name}</span>
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>
    </aside>
  )
}

export default Sidebar 