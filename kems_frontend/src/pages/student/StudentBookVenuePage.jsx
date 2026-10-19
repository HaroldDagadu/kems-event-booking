import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardBody, CardHeader, Typography, Button } from '@material-tailwind/react'
import { ArrowLeft, MapPin, Users, Clock, DollarSign } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../../contexts/ToastContext'
import { VenueCard } from '../../components/common/VenueCard'
import api from '../../services/api'

const StudentBookVenuePage = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { showToast } = useToast()
  const [venues, setVenues] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadVenues()
  }, [])

  const loadVenues = async () => {
    try {
      setLoading(true)
      const response = await api.get('/auditoriums/list/')
      setVenues(response.data || [])
    } catch (error) {
      console.error('Error loading venues:', error)
      showToast('Failed to load venues', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleBookVenue = (venue) => {
    navigate('/booking/create', { state: { selectedVenue: venue } })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8fbfa] flex items-center justify-center" style={{ fontFamily: '"Spline Sans", "Noto Sans", sans-serif' }}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
        <span className="ml-2 text-gray-600">Loading venues...</span>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f8fbfa] p-6" style={{ fontFamily: '"Spline Sans", "Noto Sans", sans-serif' }}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="text"
            className="flex items-center gap-2 text-[#0e1a13]"
            onClick={() => navigate('/academic/dashboard')}
          >
            <ArrowLeft size={20} />
            Back to Dashboard
          </Button>
        </div>

        <div className="mb-8">
          <Typography variant="h2" color="blue-gray" className="mb-2">
            Book a Venue
          </Typography>
          <Typography color="gray">
            Choose from our available venues for your event
          </Typography>
        </div>

        {/* Venues Grid */}
        {venues.length === 0 ? (
          <Card>
            <CardBody className="text-center py-12">
              <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <Typography variant="h5" color="blue-gray" className="mb-2">
                No venues available
              </Typography>
              <Typography color="gray">
                No venues are currently available for booking.
              </Typography>
            </CardBody>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {venues.map((venue) => (
              <VenueCard 
                key={venue.id}
                venue={venue}
                onAction={handleBookVenue}
                actionLabel={venue.is_active ? 'Book This Venue' : 'Not Available'}
                showPrice={true}
                user={user}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default StudentBookVenuePage