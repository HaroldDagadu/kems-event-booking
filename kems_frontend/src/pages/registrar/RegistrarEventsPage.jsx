import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../../contexts/ToastContext'
import { Calendar, Clock, MapPin, Users, Plus, Eye, Settings, Star, Heart, Bookmark } from 'lucide-react'
import EventCard from '../../components/student/EventCard'
import SearchBar from '../../components/student/SearchBar'
import api from '../../services/api'

const RegistrarEventsPage = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { showToast } = useToast()
  
  // State management
  const [events, setEvents] = useState([])
  const [filteredEvents, setFilteredEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Event categories for registrar
  const categories = [
    { id: 'all', name: 'All Events', icon: '🌟', description: 'All events in the system' },
    { id: 'public', name: 'Public Events', icon: '🌐', description: 'Open to everyone' },
    { id: 'invited', name: 'Invited Events', icon: '📨', description: 'By invitation only' },
    { id: 'for-you', name: 'For You', icon: '🎯', description: 'Personalized recommendations' },
    { id: 'manage', name: 'Manage Events', icon: '⚙️', description: 'Administrative controls' }
  ]

  useEffect(() => {
    loadEvents()
  }, [])

  useEffect(() => {
    filterEvents()
  }, [events, activeCategory, searchQuery])

  const loadEvents = async () => {
    try {
      setLoading(true)
      let response

      switch (activeCategory) {
        case 'for-you':
          response = await api.get('/events/for-you/')
          break
        case 'invited':
          response = await api.get('/events/invited/')
          break
        case 'public':
          response = await api.get('/events/public/')
          break
        case 'manage':
          response = await api.get('/registrar/events/all/')
          break
        default:
          response = await api.get('/events/')
      }

      setEvents(response.data || [])
    } catch (error) {
      console.error('Error loading events:', error)
      showToast('Failed to load events', 'error')
    } finally {
      setLoading(false)
    }
  }

  const filterEvents = () => {
    let filtered = [...events]

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(event =>
        event.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (event.venue && event.venue.name.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    }

    setFilteredEvents(filtered)
  }

  const handleCategoryChange = (categoryId) => {
    setActiveCategory(categoryId)
    
    // Special navigation for certain categories
    if (categoryId === 'for-you') {
      navigate('/registrar/events/for-you')
      return
    }
    if (categoryId === 'invited') {
      navigate('/registrar/events/invited')
      return
    }
    if (categoryId === 'manage') {
      navigate('/registrar/events/all')
      return
    }
  }

  const handleSearch = (query) => {
    setSearchQuery(query)
  }

  const handleCreateEvent = () => {
    navigate('/events/create')
  }

  const getEventStats = () => {
    return {
      total: events.length,
      upcoming: events.filter(e => new Date(e.date) > new Date()).length,
      public: events.filter(e => e.is_public).length,
      private: events.filter(e => !e.is_public).length
    }
  }

  const stats = getEventStats()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#f8fbfa]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
        <span className="ml-2 text-gray-600">Loading events...</span>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f8fbfa] p-6" style={{ fontFamily: '"Spline Sans", "Noto Sans", sans-serif' }}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-green-800 mb-2">Events Management</h1>
            <p className="text-gray-600">
              Manage and oversee all events in the KEMS system as Registrar
            </p>
          </div>
          <div className="flex gap-3 mt-4 lg:mt-0">
            <Button
              onClick={handleCreateEvent}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white"
            >
              <Plus size={16} />
              Create Event
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Events</p>
                  <p className="text-2xl font-bold text-green-800">{stats.total}</p>
                </div>
                <Calendar className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Upcoming</p>
                  <p className="text-2xl font-bold text-blue-800">{stats.upcoming}</p>
                </div>
                <Clock className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Public</p>
                  <p className="text-2xl font-bold text-purple-800">{stats.public}</p>
                </div>
                <Users className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Private</p>
                  <p className="text-2xl font-bold text-orange-800">{stats.private}</p>
                </div>
                <Eye className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Category Sidebar */}
          <div className="lg:w-64">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Event Categories</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {categories.map((category) => (
                    <Button
                      key={category.id}
                      variant={activeCategory === category.id ? "default" : "ghost"}
                      className={`w-full justify-start text-left h-auto p-3 ${
                        activeCategory === category.id
                          ? "bg-green-600 hover:bg-green-700 text-white"
                          : "hover:bg-green-50 text-gray-700"
                      }`}
                      onClick={() => handleCategoryChange(category.id)}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-lg">{category.icon}</span>
                        <div>
                          <div className="font-medium">{category.name}</div>
                          <div className={`text-xs ${
                            activeCategory === category.id ? "text-green-100" : "text-gray-500"
                          }`}>
                            {category.description}
                          </div>
                        </div>
                      </div>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {/* Search Bar */}
            <SearchBar onSearch={handleSearch} />

            {/* Events Grid */}
            {filteredEvents.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Events Found</h3>
                  <p className="text-gray-600 mb-4">
                    {searchQuery 
                      ? "No events match your search criteria."
                      : "No events available in this category."
                    }
                  </p>
                  {!searchQuery && (
                    <Button
                      onClick={handleCreateEvent}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      Create First Event
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredEvents.map(event => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default RegistrarEventsPage