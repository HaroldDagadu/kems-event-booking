import React from 'react'
import { 
  CalendarDays, 
  Globe, 
  Mail, 
  MapPin, 
  Bookmark, 
  Heart,
  Bot,
  User, 
  LogOut 
} from 'lucide-react'

const Sidebar = ({ user, activeCategory, onCategoryChange, onCreateEvent, onLogout }) => {
  const navigationItems = [
    {
      id: 'all',
      label: 'Events for You',
      icon: CalendarDays,
      iconFill: true
    },
    {
      id: 'public',
      label: 'Public Events',
      icon: Globe,
      iconFill: false
    },
    {
      id: 'invited',
      label: 'Invited Events',
      icon: Mail,
      iconFill: false
    },
    {
      id: 'bookvenue',
      label: 'Book Venue',
      icon: MapPin,
      iconFill: false
    },
    {
      id: 'bookings',
      label: 'My Bookings',
      icon: Bookmark,
      iconFill: false
    },
    {
      id: 'saved',
      label: 'Saved Events',
      icon: Heart,
      iconFill: false
    },
    {
      id: 'evette',
      label: 'Evette',
      icon: Bot,
      iconFill: false,
      special: true
    }
  ]

  return (
    <div className="layout-content-container flex flex-col w-80">
      <div className="flex h-full min-h-[700px] flex-col justify-between bg-[#f8fbfa] p-4">
        <div className="flex flex-col gap-4">
          
          <div className="flex flex-col gap-2">
            {navigationItems.map((item) => {
              const Icon = item.icon
              const isActive = activeCategory === item.id
              
              return (
                <div
                  key={item.id}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                    item.special
                      ? isActive
                        ? 'bg-gradient-to-r from-pink-100 to-purple-100 border border-pink-200'
                        : 'hover:bg-gradient-to-r hover:from-pink-50 hover:to-purple-50 border border-transparent hover:border-pink-100'
                      : isActive 
                        ? 'bg-[#e8f2ec]' 
                        : 'hover:bg-[#e8f2ec]/50'
                  }`}
                  onClick={() => onCategoryChange(item.id)}
                >
                  <Icon 
                    size={24} 
                    className={item.special ? 'text-pink-600' : 'text-[#0e1a13]'}
                    fill={item.iconFill && isActive ? 'currentColor' : 'none'}
                  />
                  <p className={`text-sm font-medium leading-normal ${
                    item.special ? 'text-pink-600' : 'text-[#0e1a13]'
                  }`}>
                    {item.label}
                  </p>
                  {item.special && (
                    <span className="ml-auto text-xs bg-pink-200 text-pink-700 px-2 py-0.5 rounded-full font-medium">
                      AI
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        </div>
        
        <div className="flex flex-col gap-4">
          
          <div className="flex flex-col gap-1">
            {/* User Profile */}
            <div className="flex items-center gap-3 px-3 py-2">
              <User size={24} className="text-[#0e1a13]" />
              <p className="text-[#0e1a13] text-sm font-medium leading-normal">
                {user?.full_name || 'User'} ({user?.role || 'student'})
              </p>
            </div>
            
            {/* Logout */}
            <div 
              className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-[#e8f2ec]/50 rounded-lg transition-colors"
              onClick={onLogout}
            >
              <LogOut size={24} className="text-[#0e1a13]" />
              <p className="text-[#0e1a13] text-sm font-medium leading-normal">
                {user?.full_name?.split(' ').map(n => n[0]).join('') || 'U'} (Logout)
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Sidebar