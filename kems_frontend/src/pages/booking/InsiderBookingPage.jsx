import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate } from 'react-router-dom'
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import { Label } from '../../components/ui/Label'
import { Card as MTCard, CardBody, CardHeader as MTCardHeader, Typography, Button as MTButton } from '@material-tailwind/react'
import { useAuth } from '../../contexts/AuthContext'
import { useBooking } from '../../hooks/useBooking'
import { ROUTES } from '../../utils/constants'
import { Loader2, User, Calendar, MapPin, Users, Clock, BookOpen, ChevronDown, ChevronRight, Check, Search, ArrowLeft, Plus } from 'lucide-react'

// Validation Schema for Insider Booking
const insiderBookingSchema = z.object({
  event_name: z.string().min(1, "Event name is required"),
  purpose: z.string().min(10, "Purpose must be at least 10 characters"),
  venue: z.number().min(1, "Please select a venue"),
  desired_date: z.string().min(1, "Date is required"),
  start_time: z.string().min(1, "Start time is required"),
  end_time: z.string().min(1, "End time is required"),
  event_type: z.enum(['public', 'private'], { required_error: "Please select event type" }),
  invitees: z.array(z.number()).optional(),
}).refine((data) => {
  if (data.start_time && data.end_time) {
    return data.start_time < data.end_time
  }
  return true
}, {
  message: "End time must be after start time",
  path: ["end_time"],
}).refine((data) => {
  if (data.event_type === 'private') {
    return data.invitees && data.invitees.length > 0
  }
  return true
}, {
  message: "Please select at least one invitee for private events",
  path: ["invitees"],
})

function InsiderBookingPage() {
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [programsData, setProgramsData] = useState([])
  const [isLoadingPrograms, setIsLoadingPrograms] = useState(false)
  const [selectedInvitees, setSelectedInvitees] = useState([])
  const [expandedPrograms, setExpandedPrograms] = useState({})
  const [programSearchTerm, setProgramSearchTerm] = useState('')
  const { user, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  
  const {
    isLoading,
    auditoriums,
    fetchAuditoriums,
    submitInsiderBooking,
    getSelectedAuditorium
  } = useBooking()
  
  const { register, handleSubmit, formState: { errors }, watch, reset, setValue } = useForm({
    resolver: zodResolver(insiderBookingSchema)
  })

  const selectedVenue = watch('venue')
  const selectedEventType = watch('event_type')

  // Check authentication and fetch auditoriums on component mount
  useEffect(() => {
    if (!isAuthenticated) {
      navigate(ROUTES.LOGIN, { state: { from: { pathname: ROUTES.BOOKING.CREATE } } })
      return
    }
    fetchAuditoriums()
  }, [isAuthenticated, navigate])

  // Fetch users by program when private event is selected
  useEffect(() => {
    if (selectedEventType === 'private' && programsData.length === 0 && !isLoadingPrograms) {
      fetchUsersByProgram()
    }
  }, [selectedEventType])

  // Function to fetch users grouped by program
  const fetchUsersByProgram = async () => {
    setIsLoadingPrograms(true)
    try {
      const response = await fetch('/api/auth/users-by-program/', {
        credentials: 'include'
      })
      if (response.ok) {
        const data = await response.json()
        setProgramsData(data.programs || [])
      } else {
        console.error('Failed to fetch users by program')
      }
    } catch (error) {
      console.error('Error fetching users by program:', error)
    } finally {
      setIsLoadingPrograms(false)
    }
  }

  // Function to handle invitee selection
  const handleInviteeToggle = (userId) => {
    setSelectedInvitees(prev => {
      if (prev.includes(userId)) {
        return prev.filter(id => id !== userId)
      } else {
        return [...prev, userId]
      }
    })
  }

  // Function to select all users in a program/role
  const handleSelectAll = (programName, role) => {
    const program = programsData.find(p => p.program_name === programName)
    if (!program) return

    const usersToSelect = program[role].map(user => user.id)
    setSelectedInvitees(prev => {
      const newSelection = [...prev]
      usersToSelect.forEach(userId => {
        if (!newSelection.includes(userId)) {
          newSelection.push(userId)
        }
      })
      return newSelection
    })
  }

  // Function to deselect all users in a program/role
  const handleDeselectAll = (programName, role) => {
    const program = programsData.find(p => p.program_name === programName)
    if (!program) return

    const usersToDeselect = program[role].map(user => user.id)
    setSelectedInvitees(prev => prev.filter(id => !usersToDeselect.includes(id)))
  }

  // Function to toggle program expansion
  const toggleProgramExpansion = (programName) => {
    setExpandedPrograms(prev => ({
      ...prev,
      [programName]: !prev[programName]
    }))
  }

  // Filter programs based on search term
  const filteredProgramsData = programsData.filter(program =>
    program.program_name.toLowerCase().includes(programSearchTerm.toLowerCase())
  )

  // Sync selectedInvitees with form field
  useEffect(() => {
    setValue('invitees', selectedInvitees)
  }, [selectedInvitees, setValue])

  // Ensure auditoriums is always an array
  const safeAuditoriums = Array.isArray(auditoriums) ? auditoriums : []

  // Mock data for testing - remove this when API is ready
  const mockAuditoriums = [
    {
      id: 1,
      name: "Main Auditorium",
      description: "Large auditorium with 500 seating capacity, perfect for major events and conferences.",
      outsider_price: "500.00",
      insider_price: "150.00"
    },
    {
      id: 2,
      name: "Engineering Auditorium", 
      description: "Specialized auditorium for technical presentations and engineering events.",
      outsider_price: "300.00",
      insider_price: "100.00"
    },
    {
      id: 3,
      name: "Science Complex Auditorium",
      description: "Modern auditorium designed for scientific presentations and academic events.",
      outsider_price: "400.00",
      insider_price: "120.00"
    }
  ]

  // Use mock data if API fails or returns empty
  const displayAuditoriums = safeAuditoriums.length > 0 ? safeAuditoriums : mockAuditoriums

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

    // Add selected invitees and calculated duration to the form data
    const formDataWithInvitees = {
      ...data,
      invitees: selectedInvitees,
      duration_hours: duration_hours
    }
    
    const result = await submitInsiderBooking(formDataWithInvitees)
    
    if (result.success) {
      setSubmitSuccess(true)
      reset()
      setSelectedInvitees([])
      setExpandedPrograms({})
    }
  }

  const getMinDate = () => {
    const today = new Date()
    return today.toISOString().split('T')[0]
  }

  const selectedAuditorium = getSelectedAuditorium(selectedVenue)

  // Don't render anything if not authenticated
  if (!isAuthenticated) {
    return null
  }

  if (submitSuccess) {
    return (
      <div className="min-h-screen bg-[#f8fbfa] p-6" style={{ fontFamily: '"Spline Sans", "Noto Sans", sans-serif' }}>
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <MTButton
                variant="text"
                className="flex items-center gap-2 text-[#0e1a13]"
                onClick={() => navigate('/academic/dashboard')}
              >
                <ArrowLeft size={20} />
                Back to Dashboard
              </MTButton>
            </div>
          </div>

          <MTCard className="text-center max-w-2xl mx-auto">
            <CardBody className="py-12">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <Check className="w-8 h-8 text-green-600" />
              </div>
              <Typography variant="h4" color="green" className="mb-4">
                Booking Request Submitted!
              </Typography>
              <Typography color="gray" className="text-lg mb-2">
                Your booking request has been submitted successfully and is pending approval.
              </Typography>
              <Typography color="gray" className="mb-6">
                Check your booking status for updates on the approval process.
              </Typography>
              <div className="flex gap-4 justify-center">
                <MTButton 
                  onClick={() => setSubmitSuccess(false)}
                  className="bg-[#39e079] hover:bg-[#2ed66b] text-[#0e1a13]"
                >
                  Submit Another Booking
                </MTButton>
                <MTButton 
                  variant="outlined"
                  onClick={() => navigate('/academic/booking/status')}
                  className="border-[#39e079] text-[#39e079]"
                >
                  View Booking Status
                </MTButton>
              </div>
            </CardBody>
          </MTCard>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f8fbfa] p-6" style={{ fontFamily: '"Spline Sans", "Noto Sans", sans-serif' }}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <MTButton
              variant="text"
              className="flex items-center gap-2 text-[#0e1a13]"
              onClick={() => navigate('/academic/dashboard')}
            >
              <ArrowLeft size={20} />
              Back to Dashboard
            </MTButton>
          </div>
          
          <MTButton
            onClick={() => navigate('/academic/booking/status')}
            className="flex items-center gap-2 bg-[#39e079] hover:bg-[#2ed66b] text-[#0e1a13]"
          >
            <BookOpen size={16} />
            View My Bookings
          </MTButton>
        </div>

        <div className="mb-8">
          <Typography variant="h2" color="blue-gray" className="mb-2">
            Book a Venue
          </Typography>
          <Typography color="gray">
            Request auditorium booking for your event
          </Typography>
        </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Hidden field for invitees */}
        <input type="hidden" {...register('invitees')} />
        
        {/* User Information Display */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Requester Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-blue-50 rounded-lg p-4 space-y-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-blue-900">Name</p>
                  <p className="text-blue-800">{user?.full_name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-blue-900">Email</p>
                  <p className="text-blue-800">{user?.email}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-blue-900">Role</p>
                  <p className="text-blue-800 capitalize">{user?.role}</p>
                </div>
                {user?.program && (
                  <div>
                    <p className="text-sm font-medium text-blue-900">Program</p>
                    <p className="text-blue-800">{user.program}</p>
                  </div>
                )}
                {user?.department && (
                  <div>
                    <p className="text-sm font-medium text-blue-900">Department</p>
                    <p className="text-blue-800">{user.department}</p>
                  </div>
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

            <div>
              <Label htmlFor="venue">Venue Selection *</Label>
              <select
                id="venue"
                {...register('venue', { valueAsNumber: true })}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.venue ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Select a venue</option>
                {displayAuditoriums.map(auditorium => (
                  <option key={auditorium.id} value={auditorium.id}>
                    {auditorium.name} - ₵{auditorium.insider_price}
                  </option>
                ))}
              </select>
              {errors.venue && (
                <p className="text-red-500 text-sm mt-1">{errors.venue.message}</p>
              )}
            </div>

            {/* Venue Details Display */}
            {selectedAuditorium && (
              <Card className="bg-green-50 border-green-200">
                <CardContent className="pt-4">
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-green-600 mt-1" />
                    <div>
                      <h4 className="font-semibold text-green-900">{selectedAuditorium.name}</h4>
                      <p className="text-green-700 text-sm mt-1">{selectedAuditorium.description}</p>
                      <p className="text-green-900 font-semibold mt-2">
                        Insider Price: ₵{selectedAuditorium.insider_price}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

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
                     className="w-4 h-4 text-blue-600"
                   />
                   <div className="flex items-center gap-2">
                     <Users className="w-5 h-5 text-blue-600" />
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
                     className="w-4 h-4 text-blue-600"
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

             {/* Invitee Selection for Private Events */}
             {selectedEventType === 'private' && (
               <div className="mt-6">
                 <Label className="text-base font-medium">Select Invitees *</Label>
                 <p className="text-sm text-gray-600 mb-4">Choose who to invite to your private event</p>
                 
                 {/* Search Bar for Programs */}
                 <div className="relative mb-4">
                   <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                     <Search className="h-4 w-4 text-gray-400" />
                   </div>
                   <Input
                     type="text"
                     placeholder="Search programs..."
                     value={programSearchTerm}
                     onChange={(e) => setProgramSearchTerm(e.target.value)}
                     className="pl-10"
                   />
                 </div>
                 
                 {isLoadingPrograms ? (
                   <div className="flex items-center justify-center py-8">
                     <Loader2 className="w-6 h-6 animate-spin mr-2" />
                     <span>Loading invitees...</span>
                   </div>
                 ) : programsData.length === 0 ? (
                   <div className="text-center py-8 text-gray-500">
                     <Users className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                     <p>No users found to invite</p>
                   </div>
                 ) : filteredProgramsData.length === 0 ? (
                   <div className="text-center py-8 text-gray-500">
                     <Search className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                     <p>No programs match your search</p>
                   </div>
                 ) : (
                   <div className="space-y-4 max-h-96 overflow-y-auto border rounded-lg p-4">
                     {filteredProgramsData.map((program) => (
                       <div key={program.program_name} className="border rounded-lg">
                         <button
                           type="button"
                           onClick={() => toggleProgramExpansion(program.program_name)}
                           className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-t-lg"
                         >
                           <h4 className="font-semibold text-gray-900">{program.program_name}</h4>
                           {expandedPrograms[program.program_name] ? (
                             <ChevronDown className="w-5 h-5" />
                           ) : (
                             <ChevronRight className="w-5 h-5" />
                           )}
                         </button>
                         
                         {expandedPrograms[program.program_name] && (
                           <div className="p-4 space-y-4">
                             {/* Lecturers Section */}
                             {program.lecturers.length > 0 && (
                               <div>
                                 <div className="flex items-center justify-between mb-2">
                                   <h5 className="font-medium text-gray-800">Lecturers ({program.lecturers.length})</h5>
                                   <div className="flex gap-2">
                                     <Button
                                       type="button"
                                       size="sm"
                                       variant="outline"
                                       onClick={() => handleSelectAll(program.program_name, 'lecturers')}
                                     >
                                       Select All
                                     </Button>
                                     <Button
                                       type="button"
                                       size="sm"
                                       variant="outline"
                                       onClick={() => handleDeselectAll(program.program_name, 'lecturers')}
                                     >
                                       Deselect All
                                     </Button>
                                   </div>
                                 </div>
                                 <div className="space-y-2 max-h-32 overflow-y-auto">
                                   {program.lecturers.map((lecturer) => (
                                     <label
                                       key={lecturer.id}
                                       className="flex items-center space-x-3 p-2 rounded hover:bg-gray-50 cursor-pointer"
                                     >
                                       <input
                                         type="checkbox"
                                         checked={selectedInvitees.includes(lecturer.id)}
                                         onChange={() => handleInviteeToggle(lecturer.id)}
                                         className="w-4 h-4 text-blue-600"
                                       />
                                       <div className="flex-1">
                                         <p className="font-medium text-sm">{lecturer.full_name}</p>
                                         <p className="text-xs text-gray-500">{lecturer.email}</p>
                                       </div>
                                       {selectedInvitees.includes(lecturer.id) && (
                                         <Check className="w-4 h-4 text-blue-600" />
                                       )}
                                     </label>
                                   ))}
                                 </div>
                               </div>
                             )}

                             {/* Students Section */}
                             {program.students.length > 0 && (
                               <div>
                                 <div className="flex items-center justify-between mb-2">
                                   <h5 className="font-medium text-gray-800">Students ({program.students.length})</h5>
                                   <div className="flex gap-2">
                                     <Button
                                       type="button"
                                       size="sm"
                                       variant="outline"
                                       onClick={() => handleSelectAll(program.program_name, 'students')}
                                     >
                                       Select All
                                     </Button>
                                     <Button
                                       type="button"
                                       size="sm"
                                       variant="outline"
                                       onClick={() => handleDeselectAll(program.program_name, 'students')}
                                     >
                                       Deselect All
                                     </Button>
                                   </div>
                                 </div>
                                 <div className="space-y-2 max-h-32 overflow-y-auto">
                                   {program.students.map((student) => (
                                     <label
                                       key={student.id}
                                       className="flex items-center space-x-3 p-2 rounded hover:bg-gray-50 cursor-pointer"
                                     >
                                       <input
                                         type="checkbox"
                                         checked={selectedInvitees.includes(student.id)}
                                         onChange={() => handleInviteeToggle(student.id)}
                                         className="w-4 h-4 text-blue-600"
                                       />
                                       <div className="flex-1">
                                         <p className="font-medium text-sm">{student.full_name}</p>
                                         <p className="text-xs text-gray-500">{student.email}</p>
                                       </div>
                                       {selectedInvitees.includes(student.id) && (
                                         <Check className="w-4 h-4 text-blue-600" />
                                       )}
                                     </label>
                                   ))}
                                 </div>
                               </div>
                             )}
                           </div>
                         )}
                       </div>
                     ))}
                   </div>
                 )}
                 
                 {selectedInvitees.length > 0 && (
                   <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                     <p className="text-sm text-blue-800">
                       <strong>{selectedInvitees.length}</strong> invitee{selectedInvitees.length !== 1 ? 's' : ''} selected
                     </p>
                   </div>
                 )}
                 
                 {errors.invitees && (
                   <p className="text-red-500 text-sm mt-1">{errors.invitees.message}</p>
                 )}
               </div>
             )}
          </CardContent>
        </Card>

        {/* Submit Section */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex gap-4 justify-end">
              <Button 
                type="button"
                variant="outline"
                onClick={() => navigate(ROUTES.BOOKING.STATUS)}
              >
                View My Bookings
              </Button>
              <Button 
                type="submit" 
                disabled={isLoading}
                className="px-8"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Submit Booking Request'
                )}
              </Button>
            </div>
            <p className="text-center text-sm text-gray-600 mt-4">
              Your booking request will be reviewed and you'll receive email notifications about the status.
            </p>
          </CardContent>
        </Card>
      </form>
      </div>
    </div>
  )
}

export default InsiderBookingPage 