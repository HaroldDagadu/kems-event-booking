import React, { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card'
import { Button } from '../ui/Button'
import { useApi } from '../../hooks/useApi'
import { evetteService } from '../../services/evette'
import { useToast } from '../../contexts/ToastContext'
import { 
  Tag, 
  Check, 
  Sparkles, 
  Users,
  Loader,
  Heart
} from 'lucide-react'

// Import Evette images
import EvetteAI from '../../evette/evette ai.jpeg'
import EvetteWinking from '../../evette/evvettedone.jpeg'

const TagSelection = ({ onPreferencesSet, onCancel, isEditing = false }) => {
  const [availableTags, setAvailableTags] = useState([])
  const [selectedTags, setSelectedTags] = useState(new Set())
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const { showToast } = useToast()

  // API hooks
  const { execute: getPreferences, loading: loadingPreferences } = useApi(evetteService.getUserPreferences)
  const { execute: updatePreferences, loading: updatingPreferences } = useApi(evetteService.updateUserPreferences)

  useEffect(() => {
    loadPreferences()
  }, [])

  const loadPreferences = async () => {
    try {
      setLoading(true)
      const response = await getPreferences()
      if (response.success) {
        setAvailableTags(response.data.available_tags || [])
        // Pre-select any existing preferences
        const existingTagIds = response.data.preferred_tags?.map(tag => tag.id) || []
        setSelectedTags(new Set(existingTagIds))
      }
    } catch (error) {
      console.error('Error loading preferences:', error)
      showToast('Failed to load tag preferences', 'error')
    } finally {
      setLoading(false)
    }
  }

  const toggleTag = (tagId) => {
    setSelectedTags(prev => {
      const newSet = new Set(prev)
      if (newSet.has(tagId)) {
        newSet.delete(tagId)
      } else {
        newSet.add(tagId)
      }
      return newSet
    })
  }

  const handleSubmit = async () => {
    if (selectedTags.size === 0) {
      showToast('Please select at least one interest', 'warning')
      return
    }

    try {
      setSubmitting(true)
      const response = await updatePreferences({
        tag_ids: Array.from(selectedTags)
      })

      if (response.success) {
        showToast('Preferences saved successfully!', 'success')
        // Call the callback to refresh the parent component
        if (onPreferencesSet) {
          onPreferencesSet(response.data.preferred_tags)
        }
      } else {
        showToast('Failed to save preferences', 'error')
      }
    } catch (error) {
      console.error('Error saving preferences:', error)
      showToast('Error saving preferences', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const getCategoryColor = (tagName) => {
    const name = tagName.toLowerCase()
    if (name.includes('technology') || name.includes('computer') || name.includes('engineering')) {
      return 'bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-200'
    } else if (name.includes('sports') || name.includes('fitness')) {
      return 'bg-green-100 text-green-700 border-green-200 hover:bg-green-200'
    } else if (name.includes('arts') || name.includes('cultural') || name.includes('music')) {
      return 'bg-purple-100 text-purple-700 border-purple-200 hover:bg-purple-200'
    } else if (name.includes('business') || name.includes('professional')) {
      return 'bg-orange-100 text-orange-700 border-orange-200 hover:bg-orange-200'
    } else if (name.includes('science') || name.includes('research')) {
      return 'bg-teal-100 text-teal-700 border-teal-200 hover:bg-teal-200'
    } else if (name.includes('social') || name.includes('community')) {
      return 'bg-pink-100 text-pink-700 border-pink-200 hover:bg-pink-200'
    } else {
      return 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader className="w-6 h-6 animate-spin text-gray-400" />
        <span className="ml-2 text-gray-500">Loading your preferences...</span>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="flex items-center justify-center mb-4">
          <img 
            src={selectedTags.size > 0 ? EvetteWinking : EvetteAI} 
            alt="Evette AI" 
            className="w-16 h-16 rounded-full object-cover border-4 border-pink-200 shadow-lg mr-4"
          />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {isEditing ? 'Edit Your Interests' : 'Tell Me Your Interests!'}
            </h1>
            <p className="text-muted-foreground flex items-center justify-center mt-1">
              <Sparkles className="w-4 h-4 mr-1 text-yellow-500" />
              {isEditing ? 'Update your event preferences' : 'Let\'s personalize your event recommendations'}
            </p>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <Card className="bg-gradient-to-r from-pink-50 to-purple-50 border-pink-200">
        <CardContent className="p-6">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <Users className="w-6 h-6 text-pink-600 mt-1" />
            </div>
            <div>
              <h3 className="font-semibold text-pink-800 mb-2">How This Works</h3>
              <p className="text-pink-700 text-sm leading-relaxed">
                {isEditing 
                  ? 'Update your interests below. I\'ll use these to refresh your personalized event recommendations.'
                  : 'Select the topics and activities that interest you most. I\'ll use these to find and recommend events that match your preferences. You can always update these later by chatting with me directly!'
                }
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tag Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Tag className="w-5 h-5 mr-2 text-blue-600" />
            Choose Your Interests
            <span className="ml-auto text-sm bg-blue-100 text-blue-600 px-2 py-1 rounded-full">
              {selectedTags.size} selected
            </span>
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {availableTags.map(tag => {
              const isSelected = selectedTags.has(tag.id)
              const colorClasses = getCategoryColor(tag.name)
              
              return (
                <button
                  key={tag.id}
                  onClick={() => toggleTag(tag.id)}
                  className={`relative p-3 rounded-lg border-2 transition-all duration-200 transform hover:scale-105 ${
                    isSelected 
                      ? `${colorClasses} ring-2 ring-offset-2 ring-blue-400 shadow-md` 
                      : `${colorClasses} shadow-sm`
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">{tag.name}</span>
                    {isSelected && (
                      <Check className="w-4 h-4 ml-2 flex-shrink-0" />
                    )}
                  </div>
                  
                  {isSelected && (
                    <div className="absolute -top-1 -right-1">
                      <div className="w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                    </div>
                  )}
                </button>
              )
            })}
          </div>

          {/* Selection Summary */}
          {selectedTags.size > 0 && (
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center mb-2">
                <Heart className="w-4 h-4 text-blue-600 mr-2" />
                <span className="text-sm font-medium text-blue-800">
                  You've selected {selectedTags.size} interest{selectedTags.size !== 1 ? 's' : ''}:
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {availableTags
                  .filter(tag => selectedTags.has(tag.id))
                  .map(tag => (
                    <span 
                      key={tag.id} 
                      className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full font-medium"
                    >
                      {tag.name}
                    </span>
                  ))
                }
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Submit Button */}
      <div className="flex justify-center space-x-4">
        {isEditing && onCancel && (
          <Button 
            onClick={onCancel}
            disabled={submitting}
            variant="outline"
            size="lg"
            className="px-8 py-3 rounded-xl border-2 border-gray-300 hover:border-gray-400 text-gray-700 hover:text-gray-900"
          >
            Cancel
          </Button>
        )}
        
        <Button 
          onClick={handleSubmit}
          disabled={selectedTags.size === 0 || submitting}
          size="lg"
          className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white px-8 py-3 rounded-xl shadow-lg transform transition-all duration-200 hover:scale-105"
        >
          {submitting ? (
            <>
              <Loader className="w-5 h-5 mr-2 animate-spin" />
              {isEditing ? 'Updating Preferences...' : 'Saving Preferences...'}
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5 mr-2" />
              {isEditing ? 'Update My Interests!' : 'Get My Personalized Events!'}
            </>
          )}
        </Button>
      </div>

      {/* Help Text */}
      <div className="text-center text-sm text-gray-500">
        <p>Don't see your interest? Chat with me directly in the Evette tab and I'll learn your preferences!</p>
      </div>
    </div>
  )
}

export default TagSelection