import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../../contexts/ToastContext'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import ImageSlideshow from '../../components/ui/ImageSlideshow'
import { ROUTES, USER_ROLES, VALIDATION } from '../../utils/constants'
import { cn } from '../../lib/utils'

const ROLE_OPTIONS = [
  { value: USER_ROLES.STUDENT, label: 'Student', icon: '👨‍🎓', description: 'University student' },
  { value: USER_ROLES.LECTURER, label: 'Lecturer', icon: '👨‍🏫', description: 'Faculty member' },
  { value: USER_ROLES.REGISTRAR, label: 'Registrar', icon: '👨‍💼', description: 'Administrative staff' }
]

const PROGRAM_OPTIONS = [
  'Computer Engineering',
  'Electrical/Electronic Engineering',
  'Mechanical Engineering',
  'Civil Engineering',
  'Chemical Engineering',
  'Agricultural Engineering',
  'Food Science and Technology',
  'Materials Engineering',
  'Geological Engineering',
  'Geomatic Engineering',
  'Biomedical Engineering',
  'Telecommunication Engineering',
  'Computer Science',
  'Mathematics',
  'Physics',
  'Chemistry',
  'Biology',
  'Statistics',
  'Actuarial Science',
  'Biochemistry',
  'Architecture',
  'Planning',
  'Building Technology',
  'Quantity Surveying and Construction Economics',
  'Real Estate',
  'Land Economy',
  'Development Planning',
  'Business Administration',
  'Marketing',
  'Human Resource Management',
  'Supply Chain Management',
  'Accounting',
  'Banking and Finance',
  'Economics',
  'Publishing Studies',
  'Information Studies',
  'Film and Video Production',
  'Integrated Rural Art and Industry',
  'Industrial Art',
  'Painting and Sculpture',
  'General Art Studies'
]

const DEPARTMENT_OPTIONS = [
  'Computer Science and Engineering',
  'Electrical and Electronic Engineering',
  'Mechanical Engineering',
  'Civil Engineering',
  'Chemical Engineering',
  'Agricultural and Biosystems Engineering',
  'Food Science and Technology',
  'Materials Engineering',
  'Geological Engineering',
  'Geomatic Engineering',
  'Biomedical Engineering',
  'Telecommunication Engineering',
  'Mathematics',
  'Physics',
  'Chemistry',
  'Biology',
  'Statistics',
  'Architecture',
  'Planning',
  'Building Technology',
  'Business School',
  'Economics',
  'Information Studies',
  'Publishing Studies',
  'Art Education',
  'Industrial Art',
  'General Art Studies'
]

function RegisterPage() {
  const [selectedRole, setSelectedRole] = useState(USER_ROLES.STUDENT)
  const [loading, setLoading] = useState(false)
  
  const { register: registerUser, isAuthenticated } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()
  
  const { register, handleSubmit, formState: { errors }, watch, reset } = useForm({
    defaultValues: {
      role: selectedRole
    }
  })

  const password = watch('password')

  // Redirect if already authenticated
  React.useEffect(() => {
    if (isAuthenticated) {
      navigate(ROUTES.DASHBOARD, { replace: true })
    }
  }, [isAuthenticated, navigate])

  // Update form when role changes
  React.useEffect(() => {
    reset({ role: selectedRole })
  }, [selectedRole, reset])

  const onSubmit = async (data) => {
    try {
      setLoading(true)
      console.log('Submitting registration data:', data)
      
      const result = await registerUser(data)
      console.log('Registration result:', result)
      
      if (result.success) {
        showToast('Registration successful! Please login with your credentials.', 'success')
        setTimeout(() => {
          navigate(ROUTES.LOGIN)
        }, 1500)
      } else {
        console.error('Registration failed:', result.error)
        if (result.error?.type === 'validation' && result.error?.errors) {
          // Handle field-specific validation errors
          const errorMessages = Object.values(result.error.errors).flat()
          showToast(errorMessages.join(', '), 'error')
        } else {
          showToast(result.error?.message || 'Registration failed. Please try again.', 'error')
        }
      }
    } catch (err) {
      console.error('Registration error:', err)
      showToast('An unexpected error occurred. Please try again.', 'error')
    } finally {
      setLoading(false)
    }
  }

  const getFieldValidation = (fieldName) => {
    const baseValidation = {
      required: `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1).replace('_', ' ')} is required`
    }

    switch (fieldName) {
      case 'full_name':
        return {
          ...baseValidation,
          minLength: {
            value: 2,
            message: 'Full name must be at least 2 characters'
          }
        }
      case 'email':
        return {
          ...baseValidation,
          pattern: {
            value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
            message: 'Please enter a valid email address'
          }
        }
      case 'school_id_num':
        return {
          ...baseValidation,
          minLength: {
            value: 8,
            message: 'School ID must be exactly 8 digits'
          },
          maxLength: {
            value: 8,
            message: 'School ID must be exactly 8 digits'
          },
          pattern: {
            value: /^\d{8}$/,
            message: 'School ID must be exactly 8 digits'
          }
        }
      case 'password':
        return {
          ...baseValidation,
          minLength: {
            value: VALIDATION.PASSWORD_MIN_LENGTH,
            message: `Password must be at least ${VALIDATION.PASSWORD_MIN_LENGTH} characters`
          },
          pattern: {
            value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
            message: 'Password must contain at least one uppercase letter, one lowercase letter, and one number'
          }
        }
      case 'password_confirm':
        return {
          ...baseValidation,
          validate: value => value === password || 'Passwords do not match'
        }
      case 'contact_number':
        return {
          ...baseValidation,
          pattern: {
            value: /^(\+233|0)[2-9]\d{8}$/,
            message: 'Please enter a valid Ghana phone number (e.g., +233123456789 or 0123456789)'
          }
        }
      case 'program':
        return {
          required: selectedRole === USER_ROLES.STUDENT ? 'Please select a program' : false,
          validate: value => {
            if (selectedRole === USER_ROLES.STUDENT && (!value || value === '')) {
              return 'Please select a program'
            }
            return true
          }
        }
      case 'department':
        return {
          required: (selectedRole === USER_ROLES.LECTURER || selectedRole === USER_ROLES.REGISTRAR) ? 'Please select a department' : false,
          validate: value => {
            if ((selectedRole === USER_ROLES.LECTURER || selectedRole === USER_ROLES.REGISTRAR) && (!value || value === '')) {
              return 'Please select a department'
            }
            return true
          }
        }
      default:
        return baseValidation
    }
  }

  // Slideshow images from public directory (same as login page)
  const slideshowImages = [
    { src: '/IMG_0460.jpg', alt: 'KNUST Campus View 1' },
    { src: '/photo_1_2025-09-02_10-48-57.jpg', alt: 'KNUST Campus View 2' },
    { src: '/photo_2_2025-09-02_10-48-57.jpg', alt: 'KNUST Campus View 3' },
    { src: '/photo_3_2025-09-02_10-48-57.jpg', alt: 'KNUST Campus View 4' },
  ]

  return (
    <section className="min-h-screen bg-neutral-100 py-8">
      <div className="container mx-auto px-4 h-full">
        <div className="flex items-center justify-center text-neutral-800">
          <div className="w-full max-w-7xl">
            <div className="block rounded-lg bg-white shadow-lg overflow-hidden">
              <div className="lg:flex lg:flex-wrap min-h-[700px]">
                {/* Left column container - Registration Form */}
                <div className="px-4 md:px-0 lg:w-7/12 flex flex-col justify-center py-6">
                  <div className="md:mx-6 md:p-8 w-full">
                    {/* Logo */}
                    <div className="text-center mb-6">
                      <div className="flex justify-center mb-3">
                        <div className="w-16 h-16 rounded-xl shadow-lg overflow-hidden bg-white p-2">
                          <img 
                            src="https://images.seeklogo.com/logo-png/35/1/kwame-nkrumah-university-of-science-technology-logo-png_seeklogo-350387.png"
                            alt="KNUST Logo"
                            className="w-full h-full object-contain"
                          />
                        </div>
                      </div>
                      <h4 className="mb-4 mt-2 text-2xl font-bold text-green-800">
                        Join KEMS
                      </h4>
                      <p className="text-green-600 mb-4 text-sm">
                        Create your account to access the Knowledge Event Management System
                      </p>
                    </div>
                    {/* Role Selection Toggle */}
                    <div className="mb-6">
                      <label className="text-sm font-medium text-green-800 mb-3 block">
                        Select Your Role
                      </label>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {ROLE_OPTIONS.map((role) => (
                          <button
                            key={role.value}
                            type="button"
                            onClick={() => setSelectedRole(role.value)}
                            className={cn(
                              "flex flex-col items-center space-y-2 p-3 rounded-lg border-2 text-sm font-medium transition-all duration-150",
                              selectedRole === role.value
                                ? "bg-green-50 text-green-800 border-green-500 shadow-md"
                                : "bg-white text-gray-600 border-gray-300 hover:bg-green-50 hover:text-green-700 hover:border-green-300"
                            )}
                          >
                            <span className="text-xl">{role.icon}</span>
                            <span className="font-semibold">{role.label}</span>
                            <span className="text-xs opacity-80">{role.description}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                      {/* Hidden role field */}
                      <input type="hidden" {...register('role')} value={selectedRole} />
                      
                      <p className="mb-4 text-gray-700 font-medium text-sm">Create your account to get started</p>
                      
                      {/* Basic Information */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label htmlFor="full_name" className="block text-sm font-medium text-green-800">
                            Full Name *
                          </label>
                          <Input
                            id="full_name"
                            type="text"
                            placeholder="Enter your full name"
                            {...register('full_name', getFieldValidation('full_name'))}
                            className={`w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition duration-150 ${errors.full_name ? 'border-red-500' : 'border-gray-300'}`}
                          />
                          {errors.full_name && (
                            <p className="text-sm text-red-600">{errors.full_name.message}</p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <label htmlFor="email" className="block text-sm font-medium text-green-800">
                            Email Address *
                          </label>
                          <Input
                            id="email"
                            type="email"
                            placeholder="Enter your email"
                            {...register('email', getFieldValidation('email'))}
                            className={`w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition duration-150 ${errors.email ? 'border-red-500' : 'border-gray-300'}`}
                          />
                          {errors.email && (
                            <p className="text-sm text-red-600">{errors.email.message}</p>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label htmlFor="school_id_num" className="block text-sm font-medium text-green-800">
                            School ID Number *
                          </label>
                          <Input
                            id="school_id_num"
                            type="text"
                            placeholder="e.g., 12345678"
                            {...register('school_id_num', getFieldValidation('school_id_num'))}
                            className={`w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition duration-150 ${errors.school_id_num ? 'border-red-500' : 'border-gray-300'}`}
                          />
                          {errors.school_id_num && (
                            <p className="text-sm text-red-600">{errors.school_id_num.message}</p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <label htmlFor="contact_number" className="block text-sm font-medium text-green-800">
                            Contact Number *
                          </label>
                          <Input
                            id="contact_number"
                            type="tel"
                            placeholder="+233123456789"
                            {...register('contact_number', getFieldValidation('contact_number'))}
                            className={`w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition duration-150 ${errors.contact_number ? 'border-red-500' : 'border-gray-300'}`}
                          />
                          {errors.contact_number && (
                            <p className="text-sm text-red-600">{errors.contact_number.message}</p>
                          )}
                        </div>
                      </div>

                      {/* Role-specific fields */}
                      {selectedRole === USER_ROLES.STUDENT && (
                        <div className="space-y-2">
                          <label htmlFor="program" className="block text-sm font-medium text-green-800">
                            Program/Course of Study *
                          </label>
                          <select
                            id="program"
                            {...register('program', getFieldValidation('program'))}
                            className={`w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition duration-150 ${
                              errors.program ? 'border-red-500' : 'border-gray-300'
                            }`}
                          >
                            <option value="">Select your program</option>
                            {PROGRAM_OPTIONS.map((program) => (
                              <option key={program} value={program}>
                                {program}
                              </option>
                            ))}
                          </select>
                          {errors.program && (
                            <p className="text-sm text-red-600">{errors.program.message}</p>
                          )}
                        </div>
                      )}

                      {(selectedRole === USER_ROLES.LECTURER || selectedRole === USER_ROLES.REGISTRAR) && (
                        <div className="space-y-2">
                          <label htmlFor="department" className="block text-sm font-medium text-green-800">
                            Department *
                          </label>
                          <select
                            id="department"
                            {...register('department', getFieldValidation('department'))}
                            className={`w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition duration-150 ${
                              errors.department ? 'border-red-500' : 'border-gray-300'
                            }`}
                          >
                            <option value="">Select your department</option>
                            {DEPARTMENT_OPTIONS.map((department) => (
                              <option key={department} value={department}>
                                {department}
                              </option>
                            ))}
                          </select>
                          {errors.department && (
                            <p className="text-sm text-red-600">{errors.department.message}</p>
                          )}
                        </div>
                      )}

                      {/* Password fields */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label htmlFor="password" className="block text-sm font-medium text-green-800">
                            Password *
                          </label>
                          <Input
                            id="password"
                            type="password"
                            placeholder="Enter your password"
                            {...register('password', getFieldValidation('password'))}
                            className={`w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition duration-150 ${errors.password ? 'border-red-500' : 'border-gray-300'}`}
                          />
                          {errors.password && (
                            <p className="text-sm text-red-600">{errors.password.message}</p>
                          )}
                          <p className="text-xs text-gray-500">
                            Must include uppercase, lowercase, and number
                          </p>
                        </div>

                        <div className="space-y-2">
                          <label htmlFor="password_confirm" className="block text-sm font-medium text-green-800">
                            Confirm Password *
                          </label>
                          <Input
                            id="password_confirm"
                            type="password"
                            placeholder="Confirm your password"
                            {...register('password_confirm', getFieldValidation('password_confirm'))}
                            className={`w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition duration-150 ${errors.password_confirm ? 'border-red-500' : 'border-gray-300'}`}
                          />
                          {errors.password_confirm && (
                            <p className="text-sm text-red-600">{errors.password_confirm.message}</p>
                          )}
                        </div>
                      </div>
                      
                      {/* Submit button */}
                      <div className="pt-2">
                        <Button
                          type="submit"
                          className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-medium py-2 px-4 text-sm rounded-md transition duration-150 ease-in-out transform hover:scale-[1.02] shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                          disabled={loading}
                        >
                          {loading ? (
                            <div className="flex items-center justify-center space-x-2">
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                              <span>Creating Account...</span>
                            </div>
                          ) : (
                            `Register as ${ROLE_OPTIONS.find(r => r.value === selectedRole)?.label}`
                          )}
                        </Button>
                      </div>

                      {/* Login section */}
                      <div className="flex items-center justify-between border-t pt-4">
                        <p className="text-xs text-gray-600">Already have an account?</p>
                        <Link
                          to={ROUTES.LOGIN}
                          className="inline-block rounded border-2 border-green-600 px-4 py-1 text-xs font-medium text-green-600 transition duration-150 ease-in-out hover:bg-green-600 hover:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                        >
                          Sign In
                        </Link>
                      </div>
                    </form>
                  </div>
                </div>

                {/* Right column container with slideshow */}
                <div className="lg:w-5/12 hidden lg:flex items-center rounded-r-lg bg-gradient-to-br from-green-50 to-green-100">
                  <div className="w-full h-full">
                    <ImageSlideshow 
                      images={slideshowImages} 
                      autoSlide={true}
                      slideDuration={5000}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default RegisterPage 