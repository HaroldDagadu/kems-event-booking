import React, { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Textarea } from '../../components/ui/Textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/Select'
import { Checkbox } from '../../components/ui/Checkbox'
import { useApi } from '../../hooks/useApi'
import { registrarService } from '../../services/registrar'
import { useToast } from '../../contexts/ToastContext'
import { 
  Plus,
  Edit,
  Trash2,
  Image as ImageIcon,
  Building,
  Users,
  DollarSign,
  MapPin,
  Upload,
  X,
  CheckCircle,
  AlertCircle,
  Save,
  Eye
} from 'lucide-react'

function ManageVenues() {
  const [venues, setVenues] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingVenue, setEditingVenue] = useState(null)
  const [selectedVenue, setSelectedVenue] = useState(null)
  const [showImageModal, setShowImageModal] = useState(false)
  const [showVenueDetails, setShowVenueDetails] = useState(null)
  
  // Form states
  const [venueData, setVenueData] = useState({
    name: '',
    description: '',
    capacity: '',
    location: '',
    facilities: '',
    is_active: true,
    outsider_price: '',
    insider_price: '',
    terms_and_conditions: '',
    images: []
  })

  const [imageFiles, setImageFiles] = useState([])

  // API hooks
  const { execute: fetchVenues } = useApi(registrarService.getAllVenues)
  const { execute: createVenue } = useApi(registrarService.createVenue)
  const { execute: updateVenue } = useApi(registrarService.updateVenue)
  const { execute: deleteVenue } = useApi(registrarService.deleteVenue)
  const { execute: addVenueImage } = useApi(registrarService.addVenueImage)
  const { execute: deleteVenueImage } = useApi(registrarService.deleteVenueImage)
  
  const { showToast } = useToast()

  useEffect(() => {
    loadVenues()
  }, [])

  const loadVenues = async () => {
    try {
      setLoading(true)
      const response = await fetchVenues()
      if (response.success) {
        setVenues(response.data || [])
      }
    } catch (error) {
      console.error('Error loading venues:', error)
      showToast('Error loading venues', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field, value) => {
    setVenueData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const resetForm = () => {
    setVenueData({
      name: '',
      description: '',
      capacity: '',
      location: '',
      facilities: '',
      is_active: true,
      outsider_price: '',
      insider_price: '',
      terms_and_conditions: '',
      images: []
    })
    setImageFiles([])
    setEditingVenue(null)
  }

  const handleCreateVenue = async () => {
    try {
      setLoading(true)
      
      // Prepare clean venue data
      const cleanVenueData = {
        name: venueData.name,
        description: venueData.description,
        location: venueData.location,
        facilities: venueData.facilities,
        is_active: venueData.is_active,
        capacity: venueData.capacity && venueData.capacity !== '' ? parseInt(venueData.capacity) : null,
        outsider_price: venueData.outsider_price && venueData.outsider_price !== '' ? parseFloat(venueData.outsider_price) : 0.00,
        insider_price: venueData.insider_price && venueData.insider_price !== '' ? parseFloat(venueData.insider_price) : 0.00,
        terms_and_conditions: venueData.terms_and_conditions
      }

      // Remove null/undefined values
      Object.keys(cleanVenueData).forEach(key => {
        if (cleanVenueData[key] === null || cleanVenueData[key] === undefined || cleanVenueData[key] === '') {
          delete cleanVenueData[key]
        }
      })

      console.log('Sending venue data:', cleanVenueData)

      const response = await createVenue(cleanVenueData)
      if (response.success) {
        showToast('Venue created successfully!', 'success')
        resetForm()
        setShowCreateForm(false)
        loadVenues()
      } else {
        showToast(response.error?.message || 'Failed to create venue', 'error')
      }
    } catch (error) {
      console.error('Error creating venue:', error)
      showToast('Error creating venue', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateVenue = async () => {
    if (!editingVenue) return

    try {
      setLoading(true)
      
      // Prepare clean venue data
      const cleanVenueData = {
        name: venueData.name,
        description: venueData.description,
        location: venueData.location,
        facilities: venueData.facilities,
        is_active: venueData.is_active,
        capacity: venueData.capacity && venueData.capacity !== '' ? parseInt(venueData.capacity) : null,
        outsider_price: venueData.outsider_price && venueData.outsider_price !== '' ? parseFloat(venueData.outsider_price) : 0.00,
        insider_price: venueData.insider_price && venueData.insider_price !== '' ? parseFloat(venueData.insider_price) : 0.00,
        terms_and_conditions: venueData.terms_and_conditions
      }

      // Remove null/undefined values
      Object.keys(cleanVenueData).forEach(key => {
        if (cleanVenueData[key] === null || cleanVenueData[key] === undefined || cleanVenueData[key] === '') {
          delete cleanVenueData[key]
        }
      })

      const response = await updateVenue(editingVenue.id, cleanVenueData)
      if (response.success) {
        showToast('Venue updated successfully!', 'success')
        resetForm()
        loadVenues()
      } else {
        showToast(response.error?.message || 'Failed to update venue', 'error')
      }
    } catch (error) {
      console.error('Error updating venue:', error)
      showToast('Error updating venue', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteVenue = async (venueId) => {
    if (!confirm('Are you sure you want to delete this venue?')) return

    try {
      setLoading(true)
      const response = await deleteVenue(venueId)
      if (response.success) {
        showToast('Venue deleted successfully!', 'success')
        loadVenues()
      } else {
        showToast(response.error?.message || 'Failed to delete venue', 'error')
      }
    } catch (error) {
      console.error('Error deleting venue:', error)
      showToast('Error deleting venue', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleEditVenue = (venue) => {
    setEditingVenue(venue)
    setVenueData({
      name: venue.name,
      description: venue.description,
      capacity: venue.capacity?.toString() || '',
      location: venue.location,
      facilities: venue.facilities,
      is_active: venue.is_active,
      outsider_price: venue.outsider_price?.toString() || '',
      insider_price: venue.insider_price?.toString() || '',
      terms_and_conditions: venue.terms_and_conditions || '',
      images: []
    })
    setImageFiles([])
  }

  const handleImageUpload = (event) => {
    const files = Array.from(event.target.files)
    const newImages = files.map(file => ({
      file,
      caption: '',
      is_primary: imageFiles.length === 0
    }))
    setImageFiles(prev => [...prev, ...newImages])
  }

  const removeImage = (index) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index))
  }

  const updateImageCaption = (index, caption) => {
    setImageFiles(prev => prev.map((img, i) => 
      i === index ? { ...img, caption } : img
    ))
  }

  const setPrimaryImage = (index) => {
    setImageFiles(prev => prev.map((img, i) => ({
      ...img,
      is_primary: i === index
    })))
  }

  const handleAddVenueImage = async (venueId) => {
    try {
      setLoading(true)
      
      const formData = new FormData()
      imageFiles.forEach((image, index) => {
        formData.append(`images[${index}][image]`, image.file)
        formData.append(`images[${index}][caption]`, image.caption)
        formData.append(`images[${index}][is_primary]`, image.is_primary)
      })

      const response = await addVenueImage(venueId, formData)
      if (response.success) {
        showToast('Images added successfully!', 'success')
        setImageFiles([])
        setShowImageModal(false)
        loadVenues()
      } else {
        showToast(response.error?.message || 'Failed to add images', 'error')
      }
    } catch (error) {
      console.error('Error adding venue images:', error)
      showToast('Error adding images', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteVenueImage = async (venueId, imageId) => {
    if (!confirm('Are you sure you want to delete this image?')) return

    try {
      setLoading(true)
      const response = await deleteVenueImage(venueId, imageId)
      if (response.success) {
        showToast('Image deleted successfully!', 'success')
        loadVenues()
      } else {
        showToast(response.error?.message || 'Failed to delete image', 'error')
      }
    } catch (error) {
      console.error('Error deleting venue image:', error)
      showToast('Error deleting image', 'error')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Manage Venues</h1>
            <p className="text-muted-foreground">Create and manage venues/facilities</p>
          </div>
          <Button onClick={() => setShowCreateForm(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Venue
          </Button>
        </div>

        {/* Venues Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {venues.map((venue) => (
            <Card key={venue.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{venue.name}</CardTitle>
                    <div className="flex items-center gap-2 mt-2">
                      <MapPin className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-600">{venue.location}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowVenueDetails(venue)}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedVenue(venue)
                        setShowImageModal(true)
                      }}
                    >
                      <ImageIcon className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditVenue(venue)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteVenue(venue.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-gray-600">{venue.description}</p>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-gray-500" />
                    <span>Capacity: {venue.capacity}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Building className="w-4 h-4 text-gray-500" />
                    <span className={venue.is_active ? 'text-green-600' : 'text-red-600'}>
                      {venue.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>

                {venue.assigned_registrar_name && (
                  <div className="text-sm">
                    <span className="text-gray-500">Managed by:</span>
                    <span className="font-semibold ml-1">{venue.assigned_registrar_name}</span>
                  </div>
                )}

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Insider Price:</span>
                    <span className="font-semibold">₵{venue.insider_price}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>Outsider Price:</span>
                    <span className="font-semibold">₵{venue.outsider_price}</span>
                  </div>
                </div>

                {venue.facilities && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Facilities:</p>
                    <p className="text-sm">{venue.facilities}</p>
                  </div>
                )}

                {/* Venue Images */}
                {venue.images && venue.images.length > 0 && (
                  <div>
                    <p className="text-xs text-gray-500 mb-2">Images:</p>
                    <div className="flex gap-2 overflow-x-auto">
                      {venue.images.slice(0, 3).map((image) => (
                        <div key={image.id} className="relative">
                          <img
                            src={image.image}
                            alt={image.caption}
                            className="w-16 h-16 object-cover rounded"
                          />
                          {image.is_primary && (
                            <div className="absolute top-0 right-0 bg-green-500 text-white text-xs px-1 rounded">
                              P
                            </div>
                          )}
                        </div>
                      ))}
                      {venue.images.length > 3 && (
                        <div className="w-16 h-16 bg-gray-100 rounded flex items-center justify-center text-xs text-gray-500">
                          +{venue.images.length - 3}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {venues.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <Building className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No venues found</h3>
              <p className="text-muted-foreground mb-4">
                No venues are currently available. Create your first venue to get started.
              </p>
              <Button onClick={() => setShowCreateForm(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add First Venue
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Create/Edit Venue Modal */}
        {(showCreateForm || editingVenue) && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">
                  {editingVenue ? 'Edit Venue' : 'Create New Venue'}
                </h2>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowCreateForm(false)
                    resetForm()
                  }}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Venue Name *
                    </label>
                    <Input
                      value={venueData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      placeholder="Enter venue name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Location *
                    </label>
                    <Input
                      value={venueData.location}
                      onChange={(e) => handleInputChange('location', e.target.value)}
                      placeholder="Enter location"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description *
                  </label>
                  <Textarea
                    value={venueData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Enter venue description"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Capacity *
                    </label>
                    <Input
                      type="number"
                      value={venueData.capacity}
                      onChange={(e) => handleInputChange('capacity', e.target.value)}
                      placeholder="Enter capacity"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Insider Price (₵)
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      value={venueData.insider_price}
                      onChange={(e) => handleInputChange('insider_price', e.target.value)}
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Outsider Price (₵)
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      value={venueData.outsider_price}
                      onChange={(e) => handleInputChange('outsider_price', e.target.value)}
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Facilities
                  </label>
                  <Input
                    value={venueData.facilities}
                    onChange={(e) => handleInputChange('facilities', e.target.value)}
                    placeholder="e.g., Projector, Sound System, Air Conditioning"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Terms and Conditions
                  </label>
                  <Textarea
                    value={venueData.terms_and_conditions}
                    onChange={(e) => handleInputChange('terms_and_conditions', e.target.value)}
                    placeholder="Enter venue-specific terms and conditions that users must accept before booking"
                    rows={4}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    These terms will be shown to outsiders who must accept them before making payment.
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="is_active"
                    checked={venueData.is_active}
                    onChange={(e) => handleInputChange('is_active', e.target.checked)}
                  />
                  <label htmlFor="is_active" className="text-sm">
                    Active Venue
                  </label>
                </div>

                {/* Images */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Venue Images
                  </label>
                  <div className="space-y-4">
                    <div className="flex items-center justify-center w-full">
                      <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <Upload className="w-8 h-8 mb-4 text-gray-500" />
                          <p className="mb-2 text-sm text-gray-500">
                            <span className="font-semibold">Click to upload</span> or drag and drop
                          </p>
                          <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
                        </div>
                        <input
                          type="file"
                          className="hidden"
                          multiple
                          accept="image/*"
                          onChange={handleImageUpload}
                        />
                      </label>
                    </div>

                    {/* Image Preview */}
                    {imageFiles.length > 0 && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {imageFiles.map((image, index) => (
                          <div key={index} className="relative border rounded-lg p-4">
                            <img
                              src={URL.createObjectURL(image.file)}
                              alt={`Preview ${index + 1}`}
                              className="w-full h-32 object-cover rounded"
                            />
                            <div className="mt-2 space-y-2">
                              <Input
                                placeholder="Image caption"
                                value={image.caption}
                                onChange={(e) => updateImageCaption(index, e.target.value)}
                              />
                              <div className="flex items-center justify-between">
                                <label className="flex items-center space-x-2">
                                  <Checkbox
                                    checked={image.is_primary}
                                    onChange={() => setPrimaryImage(index)}
                                  />
                                  <span className="text-xs">Primary Image</span>
                                </label>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => removeImage(index)}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-4">
                  <Button
                    onClick={editingVenue ? handleUpdateVenue : handleCreateVenue}
                    disabled={loading}
                    className="flex-1"
                  >
                    {loading ? 'Saving...' : (editingVenue ? 'Update Venue' : 'Create Venue')}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowCreateForm(false)
                      resetForm()
                    }}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Venue Details Modal */}
        {showVenueDetails && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Venue Details - {showVenueDetails.name}</h2>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowVenueDetails(null)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Venue Info */}
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Venue Information</h3>
                    <div className="space-y-3">
                      <div>
                        <span className="text-sm font-medium text-gray-500">Name:</span>
                        <p className="text-lg">{showVenueDetails.name}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-500">Location:</span>
                        <p className="text-lg">{showVenueDetails.location}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-500">Description:</span>
                        <p className="text-lg">{showVenueDetails.description}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-500">Capacity:</span>
                        <p className="text-lg">{showVenueDetails.capacity} people</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-500">Status:</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          showVenueDetails.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {showVenueDetails.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      {showVenueDetails.assigned_registrar_name && (
                        <div>
                          <span className="text-sm font-medium text-gray-500">Managed by:</span>
                          <p className="text-lg">{showVenueDetails.assigned_registrar_name}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-2">Pricing</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Insider Price:</span>
                        <span className="font-semibold">₵{showVenueDetails.insider_price}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Outsider Price:</span>
                        <span className="font-semibold">₵{showVenueDetails.outsider_price}</span>
                      </div>
                    </div>
                  </div>

                  {showVenueDetails.facilities && (
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Facilities</h3>
                      <p className="text-gray-700">{showVenueDetails.facilities}</p>
                    </div>
                  )}

                  {showVenueDetails.terms_and_conditions && (
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Terms and Conditions</h3>
                      <div className="bg-gray-50 p-3 rounded border max-h-32 overflow-y-auto">
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">{showVenueDetails.terms_and_conditions}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Venue Images */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Venue Images</h3>
                  {showVenueDetails.images && showVenueDetails.images.length > 0 ? (
                    <div className="grid grid-cols-2 gap-4">
                      {showVenueDetails.images.map((image) => (
                        <div key={image.id} className="relative">
                          <img
                            src={image.image}
                            alt={image.caption}
                            className="w-full h-48 object-cover rounded-lg"
                          />
                          <div className="mt-2">
                            <p className="text-sm font-medium">{image.caption}</p>
                            {image.is_primary && (
                              <span className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded mt-1">
                                Primary Image
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <ImageIcon className="w-12 h-12 mx-auto mb-2" />
                      <p>No images available</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Image Management Modal */}
        {showImageModal && selectedVenue && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Manage Images - {selectedVenue.name}</h2>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowImageModal(false)
                    setSelectedVenue(null)
                    setImageFiles([])
                  }}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <div className="space-y-6">
                {/* Add New Images */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Add New Images</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-center w-full">
                      <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <Upload className="w-8 h-8 mb-4 text-gray-500" />
                          <p className="mb-2 text-sm text-gray-500">
                            <span className="font-semibold">Click to upload</span> or drag and drop
                          </p>
                          <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
                        </div>
                        <input
                          type="file"
                          className="hidden"
                          multiple
                          accept="image/*"
                          onChange={handleImageUpload}
                        />
                      </label>
                    </div>

                    {/* New Image Preview */}
                    {imageFiles.length > 0 && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {imageFiles.map((image, index) => (
                          <div key={index} className="relative border rounded-lg p-4">
                            <img
                              src={URL.createObjectURL(image.file)}
                              alt={`Preview ${index + 1}`}
                              className="w-full h-32 object-cover rounded"
                            />
                            <div className="mt-2 space-y-2">
                              <Input
                                placeholder="Image caption"
                                value={image.caption}
                                onChange={(e) => updateImageCaption(index, e.target.value)}
                              />
                              <div className="flex items-center justify-between">
                                <label className="flex items-center space-x-2">
                                  <Checkbox
                                    checked={image.is_primary}
                                    onChange={() => setPrimaryImage(index)}
                                  />
                                  <span className="text-xs">Primary Image</span>
                                </label>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => removeImage(index)}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {imageFiles.length > 0 && (
                      <Button
                        onClick={() => handleAddVenueImage(selectedVenue.id)}
                        disabled={loading}
                      >
                        {loading ? 'Adding Images...' : 'Add Images'}
                      </Button>
                    )}
                  </div>
                </div>

                {/* Existing Images */}
                {selectedVenue.images && selectedVenue.images.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Existing Images</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {selectedVenue.images.map((image) => (
                        <div key={image.id} className="relative border rounded-lg p-4">
                          <img
                            src={image.image}
                            alt={image.caption}
                            className="w-full h-32 object-cover rounded"
                          />
                          <div className="mt-2">
                            <p className="text-sm font-medium">{image.caption}</p>
                            {image.is_primary && (
                              <span className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded mt-1">
                                Primary
                              </span>
                            )}
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteVenueImage(selectedVenue.id, image.id)}
                            className="absolute top-2 right-2"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ManageVenues 