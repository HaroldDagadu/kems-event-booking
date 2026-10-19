import React, { useState } from 'react'
import { Card, CardBody, CardHeader, Typography, Button } from '@material-tailwind/react'
import { ChevronLeft, ChevronRight, Expand, MapPin, Users, DollarSign } from 'lucide-react'

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

// Reusable VenueCard component with slideshow functionality
export function VenueCard({ venue, onAction, actionLabel = "Book", showPrice = true, user = null }) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [isModalOpen, setIsModalOpen] = useState(false)
  
  // Use actual venue images or fallback to placeholder
  const placeholderImage = `https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=250&fit=crop&auto=format&q=80`
  const venueImages = venue.images && venue.images.length > 0 
    ? venue.images.sort((a, b) => (b.is_primary === true) - (a.is_primary === true))
    : [{ image: placeholderImage, caption: venue.name }]
  
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
  
  return (
    <>
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader className="relative h-48">
          <img 
            src={venueImages[currentImageIndex]?.image} 
            alt={venue.name}
            className="w-full h-full object-cover"
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
                  className={`w-2 h-2 rounded-full ${
                    index === currentImageIndex ? 'bg-white' : 'bg-white bg-opacity-50'
                  }`}
                />
              ))}
            </div>
          )}
          
          {venue.is_active ? (
            <div className="absolute top-4 right-4 bg-green-500 text-white px-2 py-1 rounded-full text-xs">
              Available
            </div>
          ) : (
            <div className="absolute top-4 right-4 bg-red-500 text-white px-2 py-1 rounded-full text-xs">
              Unavailable
            </div>
          )}
        </CardHeader>
        
        <CardBody>
          <Typography variant="h5" color="blue-gray" className="mb-2">
            {venue.name}
          </Typography>
          
          <Typography color="gray" className="mb-4 text-sm">
            {venue.description}
          </Typography>

          <div className="space-y-2 mb-4">
            {venue.location && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <MapPin size={16} />
                <span>{venue.location}</span>
              </div>
            )}
            
            {venue.capacity && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Users size={16} />
                <span>Capacity: {venue.capacity}</span>
              </div>
            )}

            {showPrice && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <DollarSign size={16} />
                <span>
                  {user?.is_insider 
                    ? `₵${venue.insider_price}` 
                    : `₵${venue.outsider_price}`
                  }
                </span>
              </div>
            )}
          </div>

          {venue.facilities && (
            <div className="mb-4">
              <Typography variant="small" color="blue-gray" className="font-medium mb-1">
                Facilities:
              </Typography>
              <Typography variant="small" color="gray">
                {venue.facilities}
              </Typography>
            </div>
          )}

          <div className="flex justify-center">
            <Button
              size="sm"
              className="w-full"
              onClick={() => onAction(venue)}
              disabled={!venue.is_active}
            >
              {actionLabel}
            </Button>
          </div>
        </CardBody>
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

export default VenueCard