import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import { Label } from '../../components/ui/Label'
import { useBooking } from '../../hooks/useBooking'
import { Loader2, Building2, User, Calendar, MapPin, Clock, Users, ArrowLeft, Check, ChevronLeft, ChevronRight, Expand } from 'lucide-react'

// Navbar Component
function BookingNavbar() {
  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 rounded-xl shadow-lg overflow-hidden">
              <img 
                src="https://images.seeklogo.com/logo-png/35/1/kwame-nkrumah-university-of-science-technology-logo-png_seeklogo-350387.png"
                alt="KNUST Logo"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Booking Page</h1>
              <p className="text-sm text-gray-600">KNUST Events Management System</p>
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}

// Validation Schema
const outsiderBookingSchema = z.object({
  // Event details
  event_name: z.string().min(1, "Event name is required"),
  purpose: z.string().min(10, "Purpose must be at least 10 characters"),
  desired_date: z.string().min(1, "Date is required"),
  start_time: z.string().min(1, "Start time is required"),
  end_time: z.string().min(1, "End time is required"),
  event_type: z.enum(['public', 'private'], { required_error: "Please select event type" }),
  
  // Organization details
  organization_name: z.string().min(1, "Organization name is required"),
  organization_address: z.string().optional(),
  organization_email: z.string().email().optional().or(z.literal("")),
  organization_contact: z.string().optional(),
  organization_website: z.string().optional().or(z.literal("")).refine((val) => {
    if (!val || val === "") return true;
    // Allow domain.com, www.domain.com, or full URLs
    const domainRegex = /^(?:https?:\/\/)?(?:www\.)?[a-zA-Z0-9-]+\.[a-zA-Z]{2,}(?:\/.*)?$/;
    return domainRegex.test(val);
  }, {
    message: "Please enter a valid website (e.g., domain.com or www.domain.com)"
  }),
  
  // Requester details
  requester_full_name: z.string().min(1, "Full name is required"),
  requester_position: z.string().min(1, "Position is required"),
  requester_email: z.string().email("Valid email is required"),
  requester_contact: z.string().min(1, "Contact number is required"),
}).refine((data) => {
  if (data.start_time && data.end_time) {
    return data.start_time < data.end_time
  }
  return true
}, {
  message: "End time must be after start time",
  path: ["end_time"],
})

// Component for Image Modal
function ImageModal({ images, currentIndex, isOpen, onClose, onPrevious, onNext }) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50" onClick={onClose}>
      <div className="relative max-w-4xl max-h-full p-4" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-white bg-black bg-opacity-50 rounded-full p-2 hover:bg-opacity-75 z-10"
        >
          ✕
        </button>
        
        <img
          src={images[currentIndex]?.image}
          alt={images[currentIndex]?.caption || 'Venue image'}
          className="max-w-full max-h-[80vh] object-contain"
        />
        
        {images.length > 1 && (
          <>
            <button
              onClick={onPrevious}
              className="absolute left-2 top-1/2 transform -translate-y-1/2 text-white bg-black bg-opacity-50 rounded-full p-2 hover:bg-opacity-75"
            >
              <ChevronLeft size={24} />
            </button>
            <button
              onClick={onNext}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-white bg-black bg-opacity-50 rounded-full p-2 hover:bg-opacity-75"
            >
              <ChevronRight size={24} />
            </button>
          </>
        )}
        
        {images[currentIndex]?.caption && (
          <div className="absolute bottom-2 left-2 right-2 text-white bg-black bg-opacity-50 p-2 rounded">
            {images[currentIndex].caption}
          </div>
        )}
      </div>
    </div>
  )
}

// Component for Auditorium Selection Cards
function AuditoriumCard({ auditorium, onSelect, onContinue, isSelected }) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [isModalOpen, setIsModalOpen] = useState(false)
  
  // Use actual venue images or fallback to placeholder
  const placeholderImage = `https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=250&fit=crop&auto=format&q=80`
  const venueImages = auditorium.images && auditorium.images.length > 0 
    ? auditorium.images.sort((a, b) => (b.is_primary === true) - (a.is_primary === true))
    : [{ image: placeholderImage, caption: auditorium.name }]
  
  const nextImage = (e) => {
    e.stopPropagation()
    setCurrentImageIndex((prev) => (prev + 1) % venueImages.length)
  }
  
  const previousImage = (e) => {
    e.stopPropagation()
    setCurrentImageIndex((prev) => (prev - 1 + venueImages.length) % venueImages.length)
  }
  
  const openModal = (e) => {
    e.stopPropagation()
    setIsModalOpen(true)
  }
  
  const closeModal = () => {
    setIsModalOpen(false)
  }
  
  const nextModalImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % venueImages.length)
  }
  
  const previousModalImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + venueImages.length) % venueImages.length)
  }
  
  const handleContinue = (e) => {
    e.stopPropagation()
    onContinue()
  }
  
  return (
    <>
      <Card 
        className={`transition-all duration-300 hover:shadow-lg ${
          isSelected 
            ? 'ring-2 ring-blue-500 shadow-xl md:col-span-2 lg:col-span-3' 
            : 'cursor-pointer hover:shadow-md'
        }`}
        onClick={!isSelected ? () => onSelect(auditorium) : undefined}
      >
        <div className="relative">
          <img 
            src={venueImages[currentImageIndex]?.image} 
            alt={auditorium.name}
            className={`w-full object-cover rounded-t-lg ${
              isSelected ? 'h-64 md:h-80' : 'h-48'
            }`}
          />
          
          {/* Image Navigation Arrows - only show if multiple images */}
          {venueImages.length > 1 && (
            <>
              <button
                onClick={previousImage}
                className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white rounded-full p-1 hover:bg-opacity-75 transition-opacity"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                onClick={nextImage}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white rounded-full p-1 hover:bg-opacity-75 transition-opacity"
              >
                <ChevronRight size={20} />
              </button>
            </>
          )}
          
          {/* Expand button */}
          <button
            onClick={openModal}
            className="absolute bottom-2 right-2 bg-black bg-opacity-50 text-white rounded-full p-1 hover:bg-opacity-75 transition-opacity"
          >
            <Expand size={16} />
          </button>
          
          {/* Image indicators - only show if multiple images */}
          {venueImages.length > 1 && (
            <div className="absolute bottom-2 left-2 flex gap-1">
              {venueImages.map((_, index) => (
                <div
                  key={index}
                  className={`w-2 h-2 rounded-full cursor-pointer ${
                    index === currentImageIndex ? 'bg-white' : 'bg-white bg-opacity-50'
                  }`}
                  onClick={(e) => {
                    e.stopPropagation()
                    setCurrentImageIndex(index)
                  }}
                />
              ))}
            </div>
          )}
          
          {isSelected && (
            <div className="absolute top-4 right-4 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium">
              ✓ Selected
            </div>
          )}
        </div>
        
        <CardContent className={isSelected ? 'p-6' : 'p-4'}>
          <div className={isSelected ? 'grid grid-cols-1 lg:grid-cols-2 gap-6' : ''}>
            {/* Basic Info */}
            <div>
              <h3 className={`font-bold mb-2 ${isSelected ? 'text-2xl' : 'text-lg'}`}>
                {auditorium.name}
              </h3>
              <p className={`text-gray-600 mb-3 ${isSelected ? 'text-base' : 'text-sm line-clamp-2'}`}>
                {auditorium.description}
              </p>
              
              {!isSelected && (
                <div className="flex justify-between items-center">
                  <div className="text-lg font-bold text-black">
                    ₵{auditorium.outsider_price}
                  </div>
                  <Button size="sm" variant="outline">
                    Select
                  </Button>
                </div>
              )}
            </div>
            
            {/* Extended Details - only shown when selected */}
            {isSelected && (
              <div className="space-y-4">
                {/* Venue Details */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Capacity */}
                  {auditorium.capacity && (
                    <div className="bg-blue-50 p-4 rounded-lg text-center">
                      <Users className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                      <div className="text-xs text-gray-600 mb-1">Capacity</div>
                      <div className="text-blue-600 font-bold text-lg">{auditorium.capacity}</div>
                    </div>
                  )}
                  
                  {/* Location */}
                  {auditorium.location && (
                    <div className="bg-green-50 p-4 rounded-lg text-center">
                      <MapPin className="w-6 h-6 text-green-600 mx-auto mb-2" />
                      <div className="text-xs text-gray-600 mb-1">Location</div>
                      <div className="text-green-600 font-bold text-sm">{auditorium.location}</div>
                    </div>
                  )}
                  
                  {/* Price */}
                  <div className="bg-orange-50 p-4 rounded-lg text-center">
                    <div className="w-6 h-6 text-orange-600 mx-auto mb-2 font-bold text-xl">₵</div>
                    <div className="text-xs text-gray-600 mb-1">Price</div>
                    <div className="text-orange-600 font-bold text-lg">₵{auditorium.outsider_price}</div>
                  </div>
                </div>
                
                {/* Facilities */}
                {auditorium.facilities && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-2">Facilities</h4>
                    <p className="text-sm text-gray-600">{auditorium.facilities}</p>
                  </div>
                )}
                
                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <Button 
                    onClick={handleContinue}
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                  >
                    Continue to Booking Form
                    <ArrowLeft className="w-4 h-4 ml-2 rotate-180" />
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={(e) => {
                      e.stopPropagation()
                      onSelect(null)
                    }}
                    className="px-6"
                  >
                    Change
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      
      {/* Image Modal */}
      <ImageModal
        images={venueImages}
        currentIndex={currentImageIndex}
        isOpen={isModalOpen}
        onClose={closeModal}
        onPrevious={previousModalImage}
        onNext={nextModalImage}
      />
    </>
  )
}

// Component for Auditorium Selection View
function AuditoriumSelection({ auditoriums, selectedAuditorium, onAuditoriumSelect, onContinue, isLoading }) {
  // Ensure auditoriums is always an array
  const safeAuditoriums = Array.isArray(auditoriums) ? auditoriums : []
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-yellow-50">
      <BookingNavbar />
      <div className="max-w-6xl mx-auto p-6">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Choose Your Venue</h1>
          <p className="text-gray-600">Select an auditorium for your organization's event</p>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-black" />
            <span className="ml-2 text-gray-600">Loading auditoriums...</span>
          </div>
        ) : safeAuditoriums.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Building2 className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">No Auditoriums Available</h3>
            <p className="text-gray-600">There are currently no auditoriums available for booking.</p>
            <Button 
              onClick={() => window.location.reload()} 
              className="mt-4"
            >
              Refresh Page
            </Button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {safeAuditoriums.map(auditorium => (
                <AuditoriumCard
                  key={auditorium.id}
                  auditorium={auditorium}
                  onSelect={onAuditoriumSelect}
                  onContinue={onContinue}
                  isSelected={selectedAuditorium?.id === auditorium.id}
                />
              ))}
            </div>

            {/* Removed separate details card - now integrated into individual cards */}
            {false && selectedAuditorium && (
              <Card className="max-w-4xl mx-auto">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="w-6 h-6 text-green-600" />
                    Selected Venue Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Venue Header */}
                  <div className="text-center">
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">{selectedAuditorium.name}</h3>
                    {selectedAuditorium.description && (
                      <p className="text-gray-600 text-lg">{selectedAuditorium.description}</p>
                    )}
                  </div>

                  {/* Venue Details Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Capacity */}
                    {selectedAuditorium.capacity && (
                      <div className="bg-blue-50 p-6 rounded-lg text-center">
                        <Users className="w-8 h-8 text-blue-600 mx-auto mb-3" />
                        <div className="font-semibold text-gray-900 mb-1">Capacity</div>
                        <div className="text-blue-600 font-bold text-xl">{selectedAuditorium.capacity} seats</div>
                      </div>
                    )}

                    {/* Location */}
                    {selectedAuditorium.location && (
                      <div className="bg-green-50 p-6 rounded-lg text-center">
                        <MapPin className="w-8 h-8 text-green-600 mx-auto mb-3" />
                        <div className="font-semibold text-gray-900 mb-1">Location</div>
                        <div className="text-green-600 font-bold text-lg">{selectedAuditorium.location}</div>
                      </div>
                    )}

                    {/* Price */}
                    <div className="bg-orange-50 p-6 rounded-lg text-center">
                      <div className="w-8 h-8 text-orange-600 mx-auto mb-3 font-bold text-2xl">₵</div>
                      <div className="font-semibold text-gray-900 mb-1">Booking Price</div>
                      <div className="text-orange-600 font-bold text-xl">₵{selectedAuditorium.outsider_price}</div>
                    </div>
                  </div>

                  {/* Additional Information */}
                  {(selectedAuditorium.amenities || selectedAuditorium.features) && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-gray-900 mb-2">Additional Information</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {selectedAuditorium.amenities && (
                          <div>
                            <span className="text-sm font-medium text-gray-700">Amenities:</span>
                            <p className="text-sm text-gray-600">{selectedAuditorium.amenities}</p>
                          </div>
                        )}
                        {selectedAuditorium.features && (
                          <div>
                            <span className="text-sm font-medium text-gray-700">Features:</span>
                            <p className="text-sm text-gray-600">{selectedAuditorium.features}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Action Button */}
                  <div className="text-center">
                    <Button onClick={onContinue} size="lg" className="bg-green-600 hover:bg-green-700 text-white px-8 py-3">
                      Continue to Booking Form
                      <ArrowLeft className="w-4 h-4 ml-2 rotate-180" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  )
}

// Venue Image Gallery Component
function VenueImageGallery({ venue, showTitle = true }) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [isModalOpen, setIsModalOpen] = useState(false)
  
  const placeholderImage = `https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=250&fit=crop&auto=format&q=80`
  const venueImages = venue.images && venue.images.length > 0 
    ? venue.images.sort((a, b) => (b.is_primary === true) - (a.is_primary === true))
    : [{ image: placeholderImage, caption: venue.name }]
  
  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % venueImages.length)
  }
  
  const previousImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + venueImages.length) % venueImages.length)
  }
  
  const openModal = () => {
    setIsModalOpen(true)
  }
  
  const closeModal = () => {
    setIsModalOpen(false)
  }
  
  const nextModalImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % venueImages.length)
  }
  
  const previousModalImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + venueImages.length) % venueImages.length)
  }
  
  return (
    <>
      <div className="w-full">
        {showTitle && (
          <h3 className="text-lg font-semibold mb-4 text-center">{venue.name} - Images</h3>
        )}
        
        <div className="relative h-64 md:h-80 lg:h-96 rounded-lg overflow-hidden">
          <img 
            src={venueImages[currentImageIndex]?.image} 
            alt={venue.name}
            className="w-full h-full object-cover"
          />
          
          {/* Navigation Arrows - only show if multiple images */}
          {venueImages.length > 1 && (
            <>
              <button
                onClick={previousImage}
                className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white rounded-full p-2 hover:bg-opacity-75 transition-opacity"
              >
                <ChevronLeft size={24} />
              </button>
              <button
                onClick={nextImage}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white rounded-full p-2 hover:bg-opacity-75 transition-opacity"
              >
                <ChevronRight size={24} />
              </button>
            </>
          )}
          
          {/* Expand button */}
          <button
            onClick={openModal}
            className="absolute bottom-4 right-4 bg-black bg-opacity-50 text-white rounded-full p-2 hover:bg-opacity-75 transition-opacity"
          >
            <Expand size={20} />
          </button>
          
          {/* Image indicators - only show if multiple images */}
          {venueImages.length > 1 && (
            <div className="absolute bottom-4 left-4 flex gap-2">
              {venueImages.map((_, index) => (
                <div
                  key={index}
                  className={`w-3 h-3 rounded-full cursor-pointer transition-all ${
                    index === currentImageIndex ? 'bg-white' : 'bg-white bg-opacity-50'
                  }`}
                  onClick={() => setCurrentImageIndex(index)}
                />
              ))}
            </div>
          )}
          
          {/* Image caption */}
          {venueImages[currentImageIndex]?.caption && (
            <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-3">
              <p className="text-center text-sm">{venueImages[currentImageIndex].caption}</p>
            </div>
          )}
        </div>
        
        {venueImages.length > 1 && (
          <div className="flex justify-center mt-4">
            <p className="text-sm text-gray-600">
              Image {currentImageIndex + 1} of {venueImages.length}
            </p>
          </div>
        )}
      </div>
      
      {/* Image Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50" onClick={closeModal}>
          <div className="relative max-w-5xl max-h-full p-4" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={closeModal}
              className="absolute top-2 right-2 text-white bg-black bg-opacity-50 rounded-full p-2 hover:bg-opacity-75 z-10"
            >
              ✕
            </button>
            
            <img
              src={venueImages[currentImageIndex]?.image}
              alt={venueImages[currentImageIndex]?.caption || 'Venue image'}
              className="max-w-full max-h-[85vh] object-contain"
            />
            
            {venueImages.length > 1 && (
              <>
                <button
                  onClick={previousModalImage}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white bg-black bg-opacity-50 rounded-full p-3 hover:bg-opacity-75"
                >
                  <ChevronLeft size={28} />
                </button>
                <button
                  onClick={nextModalImage}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white bg-black bg-opacity-50 rounded-full p-3 hover:bg-opacity-75"
                >
                  <ChevronRight size={28} />
                </button>
              </>
            )}
            
            {venueImages[currentImageIndex]?.caption && (
              <div className="absolute bottom-4 left-4 right-4 text-white bg-black bg-opacity-50 p-3 rounded text-center">
                {venueImages[currentImageIndex].caption}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}

function OutsiderBookingPage() {
  const [currentStep, setCurrentStep] = useState('selection') // 'selection', 'form', 'success'
  const [selectedAuditorium, setSelectedAuditorium] = useState(null)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  
  const {
    isLoading,
    auditoriums,
    fetchAuditoriums,
    submitOutsiderBooking,
  } = useBooking()
  
  const { register, handleSubmit, formState: { errors }, reset, setValue } = useForm({
    resolver: zodResolver(outsiderBookingSchema)
  })

  // Fetch auditoriums on component mount
  useEffect(() => {
    fetchAuditoriums()
  }, [])

  // Mock data for testing - remove this when API is ready
  const mockAuditoriums = [
    {
      id: 1,
      name: "Main Auditorium",
      description: "Large auditorium with 500 seating capacity, perfect for major events and conferences. Features state-of-the-art audio-visual equipment and comfortable seating.",
      outsider_price: "500.00",
      insider_price: "150.00"
    },
    {
      id: 2,
      name: "Engineering Auditorium", 
      description: "Specialized auditorium for technical presentations and engineering events. Equipped with advanced projection systems and flexible seating arrangements.",
      outsider_price: "300.00",
      insider_price: "100.00"
    },
    {
      id: 3,
      name: "Science Complex Auditorium",
      description: "Modern auditorium designed for scientific presentations and academic events. Features interactive displays and excellent acoustics.",
      outsider_price: "400.00",
      insider_price: "120.00"
    }
  ]

  // Use mock data if API fails or returns empty
  const displayAuditoriums = auditoriums && auditoriums.length > 0 ? auditoriums : mockAuditoriums

  // Debug logging
  console.log('auditoriums from API:', auditoriums)
  console.log('displayAuditoriums:', displayAuditoriums)

  const handleAuditoriumSelect = (auditorium) => {
    setSelectedAuditorium(auditorium)
  }

  const handleContinueToForm = () => {
    setCurrentStep('form')
  }

  const handleBackToSelection = () => {
    setCurrentStep('selection')
  }

  // Helper function to process website URL
  const processWebsiteUrl = (url) => {
    if (!url || url === "") return ""
    // If URL doesn't start with http:// or https://, add https://
    if (!/^https?:\/\//i.test(url)) {
      return `https://${url}`
    }
    return url
  }

  const onSubmit = async (data) => {
    // Calculate duration_hours from start_time and end_time
    let duration_hours = 0
    if (data.start_time && data.end_time) {
      const [startHours, startMinutes] = data.start_time.split(':').map(Number)
      const [endHours, endMinutes] = data.end_time.split(':').map(Number)
      
      const startTotalMinutes = startHours * 60 + startMinutes
      const endTotalMinutes = endHours * 60 + endMinutes
      
      duration_hours = (endTotalMinutes - startTotalMinutes) / 60
    }

    // Process website URL
    const processedData = {
      ...data,
      organization_website: processWebsiteUrl(data.organization_website)
    }
    
    // Add selected venue and calculated duration to form data
    const formDataWithVenue = {
      ...processedData,
      venue: selectedAuditorium.id,
      duration_hours: duration_hours
    }
    
    const result = await submitOutsiderBooking(formDataWithVenue)
    
    if (result.success) {
      setSubmitSuccess(true)
      setCurrentStep('success')
      reset()
    }
  }

  const getMinDate = () => {
    const today = new Date()
    return today.toISOString().split('T')[0]
  }

  // Success View
  if (currentStep === 'success') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-yellow-50">
        <BookingNavbar />
        <div className="max-w-2xl mx-auto p-6">
          <Card className="text-center">
            <CardHeader>
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <Check className="w-8 h-8 text-black" />
              </div>
              <CardTitle className="text-2xl text-black">Booking Request Submitted!</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-lg text-gray-700">
                Your booking request for <strong>{selectedAuditorium?.name}</strong> has been submitted successfully.
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left">
                <h4 className="font-semibold text-black mb-2">📧 Email Notifications</h4>
                <div className="text-sm text-black space-y-1">
                  <p>• You will receive email notifications for all actions taken on your booking</p>
                  <p>• This includes approval/denial status, payment instructions, and updates</p>
                  <p>• If approved, you'll receive temporary login credentials to complete payment</p>
                </div>
              </div>
              <p className="text-gray-600">
                Our registrar team will review your request and respond within 1-2 business days.
              </p>
              <div className="pt-4">
                <Button 
                  onClick={() => {
                    setCurrentStep('selection')
                    setSelectedAuditorium(null)
                    setSubmitSuccess(false)
                  }}
                  className="mr-4"
                >
                  Submit Another Booking
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => window.location.href = '/'}
                >
                  Return to Home
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Auditorium Selection View
  if (currentStep === 'selection') {
    return (
      <AuditoriumSelection
        auditoriums={displayAuditoriums}
        selectedAuditorium={selectedAuditorium}
        onAuditoriumSelect={handleAuditoriumSelect}
        onContinue={handleContinueToForm}
        isLoading={isLoading}
      />
    )
  }

  // Booking Form View
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-yellow-50">
      <BookingNavbar />
      <div className="max-w-4xl mx-auto p-6">
        {/* Header with back button and selected venue */}
        <div className="mb-8">
          <Button 
            variant="outline" 
            onClick={handleBackToSelection}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Venue Selection
          </Button>
          
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Complete Your Booking</h1>
            <p className="text-gray-600">Fill in the details for your event at <strong>{selectedAuditorium?.name}</strong></p>
          </div>
        </div>

        {/* Venue Images */}
        {selectedAuditorium?.images && selectedAuditorium.images.length > 0 && (
          <Card className="mb-6">
            <CardContent className="pt-6">
              <VenueImageGallery 
                venue={selectedAuditorium}
                showTitle={false}
              />
            </CardContent>
          </Card>
        )}

        {/* Selected Venue Summary */}
        <Card className="mb-6 border-green-200">
          <CardContent className="pt-6">
            <div className="text-center mb-4">
              <h3 className="text-xl font-bold text-gray-900 mb-1">{selectedAuditorium?.name}</h3>
              <p className="text-gray-600">{selectedAuditorium?.description}</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              {/* Capacity */}
              {selectedAuditorium?.capacity && (
                <div className="text-center">
                  <Users className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                  <div className="text-sm text-gray-600">Capacity</div>
                  <div className="font-bold text-blue-600 text-lg">{selectedAuditorium.capacity} seats</div>
                </div>
              )}

              {/* Location */}
              {selectedAuditorium?.location && (
                <div className="text-center">
                  <MapPin className="w-6 h-6 text-green-600 mx-auto mb-2" />
                  <div className="text-sm text-gray-600">Location</div>
                  <div className="font-bold text-green-600">{selectedAuditorium.location}</div>
                </div>
              )}

              {/* Price */}
              <div className="text-center">
                <div className="w-6 h-6 text-orange-600 mx-auto mb-2 font-bold text-xl">₵</div>
                <div className="text-sm text-gray-600">Booking Price</div>
                <div className="font-bold text-orange-600 text-lg">₵{selectedAuditorium?.outsider_price}</div>
              </div>
            </div>

            <div className="text-center text-sm text-gray-600 bg-green-50 p-3 rounded-lg">
              <span className="font-medium text-green-800">Selected Venue:</span> You're booking {selectedAuditorium?.name} for your organization's event
            </div>
          </CardContent>
        </Card>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* Organization Information Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                Organization Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="organization_name">Organization Name *</Label>
                <Input
                  id="organization_name"
                  type="text"
                  placeholder="Enter your organization name"
                  {...register('organization_name')}
                  className={errors.organization_name ? 'border-red-500' : ''}
                />
                {errors.organization_name && (
                  <p className="text-red-500 text-sm mt-1">{errors.organization_name.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="organization_address">Organization Address</Label>
                <textarea
                  id="organization_address"
                  {...register('organization_address')}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your organization's address"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="organization_email">Organization Email</Label>
                  <Input
                    id="organization_email"
                    type="email"
                    placeholder="info@organization.com"
                    {...register('organization_email')}
                    className={errors.organization_email ? 'border-red-500' : ''}
                  />
                  {errors.organization_email && (
                    <p className="text-red-500 text-sm mt-1">{errors.organization_email.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="organization_contact">Contact Number</Label>
                  <Input
                    id="organization_contact"
                    type="tel"
                    placeholder="+233xxxxxxxxx"
                    {...register('organization_contact')}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="organization_website">Website</Label>
                <Input
                  id="organization_website"
                  type="text"
                  placeholder="example.com or www.example.com"
                  {...register('organization_website')}
                  className={errors.organization_website ? 'border-red-500' : ''}
                />
                {errors.organization_website && (
                  <p className="text-red-500 text-sm mt-1">{errors.organization_website.message}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Requester Information Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Requester Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="requester_full_name">Full Name *</Label>
                  <Input
                    id="requester_full_name"
                    type="text"
                    placeholder="Enter your full name"
                    {...register('requester_full_name')}
                    className={errors.requester_full_name ? 'border-red-500' : ''}
                  />
                  {errors.requester_full_name && (
                    <p className="text-red-500 text-sm mt-1">{errors.requester_full_name.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="requester_position">Position/Title *</Label>
                  <Input
                    id="requester_position"
                    type="text"
                    placeholder="e.g., Event Manager, CEO"
                    {...register('requester_position')}
                    className={errors.requester_position ? 'border-red-500' : ''}
                  />
                  {errors.requester_position && (
                    <p className="text-red-500 text-sm mt-1">{errors.requester_position.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="requester_email">Email Address *</Label>
                  <Input
                    id="requester_email"
                    type="email"
                    placeholder="your.email@example.com"
                    {...register('requester_email')}
                    className={errors.requester_email ? 'border-red-500' : ''}
                  />
                  {errors.requester_email && (
                    <p className="text-red-500 text-sm mt-1">{errors.requester_email.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="requester_contact">Contact Number *</Label>
                  <Input
                    id="requester_contact"
                    type="tel"
                    placeholder="+233xxxxxxxxx"
                    {...register('requester_contact')}
                    className={errors.requester_contact ? 'border-red-500' : ''}
                  />
                  {errors.requester_contact && (
                    <p className="text-red-500 text-sm mt-1">{errors.requester_contact.message}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Event Information Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Event Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="event_name">Event Name *</Label>
                <Input
                  id="event_name"
                  type="text"
                  placeholder="Enter your event name"
                  {...register('event_name')}
                  className={errors.event_name ? 'border-red-500' : ''}
                />
                {errors.event_name && (
                  <p className="text-red-500 text-sm mt-1">{errors.event_name.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="purpose">Event Purpose/Description *</Label>
                <textarea
                  id="purpose"
                  {...register('purpose')}
                  rows={4}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.purpose ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Describe the purpose and details of your event..."
                />
                {errors.purpose && (
                  <p className="text-red-500 text-sm mt-1">{errors.purpose.message}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="desired_date">Event Date *</Label>
                  <Input
                    id="desired_date"
                    type="date"
                    min={getMinDate()}
                    {...register('desired_date')}
                    className={errors.desired_date ? 'border-red-500' : ''}
                  />
                  {errors.desired_date && (
                    <p className="text-red-500 text-sm mt-1">{errors.desired_date.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="start_time">Start Time *</Label>
                  <Input
                    id="start_time"
                    type="time"
                    {...register('start_time')}
                    className={errors.start_time ? 'border-red-500' : ''}
                  />
                  {errors.start_time && (
                    <p className="text-red-500 text-sm mt-1">{errors.start_time.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="end_time">End Time *</Label>
                  <Input
                    id="end_time"
                    type="time"
                    {...register('end_time')}
                    className={errors.end_time ? 'border-red-500' : ''}
                  />
                  {errors.end_time && (
                    <p className="text-red-500 text-sm mt-1">{errors.end_time.message}</p>
                  )}
                </div>
              </div>

              <div>
                <Label className="text-base font-medium">Event Type *</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                  <label className="flex items-center space-x-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      value="public"
                      {...register('event_type')}
                      className="w-4 h-4 text-black"
                    />
                    <div className="flex items-center gap-2">
                      <Users className="w-5 h-5 text-black" />
                      <div>
                        <span className="font-medium">Public Event</span>
                        <p className="text-sm text-gray-600">Open to university community</p>
                      </div>
                    </div>
                  </label>
                  <label className="flex items-center space-x-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      value="private"
                      {...register('event_type')}
                      className="w-4 h-4 text-black"
                    />
                    <div className="flex items-center gap-2">
                      <Users className="w-5 h-5 text-gray-600" />
                      <div>
                        <span className="font-medium">Private Event</span>
                        <p className="text-sm text-gray-600">Invitation only</p>
                      </div>
                    </div>
                  </label>
                </div>
                {errors.event_type && (
                  <p className="text-red-500 text-sm mt-1">{errors.event_type.message}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Submit Button */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex gap-4 justify-between">
                <Button 
                  type="button"
                  variant="outline"
                  onClick={handleBackToSelection}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Change Venue
                </Button>
                <Button 
                  type="submit" 
                  disabled={isLoading}
                  className="text-lg py-3 px-8"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Submitting Request...
                    </>
                  ) : (
                    'Submit Booking Request'
                  )}
                </Button>
              </div>
              <p className="text-center text-sm text-gray-600 mt-4">
                By submitting this request, you agree to the university's auditorium booking terms and conditions.
              </p>
            </CardContent>
          </Card>
        </form>
      </div>
    </div>
  )
}

export default OutsiderBookingPage 