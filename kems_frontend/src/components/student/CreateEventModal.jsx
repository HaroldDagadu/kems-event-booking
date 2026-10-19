import React, { useState } from 'react'
import { X } from 'lucide-react'

const CreateEventModal = ({ isOpen, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    is_public: true
  })
  const [loading, setLoading] = useState(false)

  const handleInputChange = (e) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'select-one' ? value === 'true' : value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      await onSubmit(formData)
      // Reset form
      setFormData({
        name: '',
        description: '',
        is_public: true
      })
    } catch (error) {
      console.error('Error creating event:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setFormData({
      name: '',
      description: '',
      is_public: true
    })
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="relative w-full max-w-lg p-6 bg-white rounded-lg shadow-xl flex flex-col gap-4">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold text-[#0e1a13]">Create New Event</h2>
          <button
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
            disabled={loading}
          >
            <X size={24} />
          </button>
        </div>
        
        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Event Title */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Event Title
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
              disabled={loading}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#39e079] focus:border-[#39e079] disabled:bg-gray-100 disabled:cursor-not-allowed"
              placeholder="Enter event title"
            />
          </div>
          
          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              required
              disabled={loading}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#39e079] focus:border-[#39e079] disabled:bg-gray-100 disabled:cursor-not-allowed resize-none"
              placeholder="Describe your event"
            />
          </div>
          
          {/* Event Type */}
          <div>
            <label htmlFor="is_public" className="block text-sm font-medium text-gray-700 mb-1">
              Event Type
            </label>
            <select
              id="is_public"
              name="is_public"
              value={formData.is_public}
              onChange={handleInputChange}
              required
              disabled={loading}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#39e079] focus:border-[#39e079] disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              <option value={true}>Public Event</option>
              <option value={false}>Private Event</option>
            </select>
          </div>
          
          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-[#0e1a13] bg-[#39e079] border border-transparent rounded-md hover:bg-[#2ed66b] focus:outline-none focus:ring-2 focus:ring-[#39e079] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {loading && (
                <div className="w-4 h-4 border-2 border-[#0e1a13] border-t-transparent rounded-full animate-spin"></div>
              )}
              {loading ? 'Creating...' : 'Create Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CreateEventModal