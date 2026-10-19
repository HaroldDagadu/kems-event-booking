import React, { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useAuth } from '../../contexts/AuthContext'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import ImageSlideshow from '../../components/ui/ImageSlideshow'
import { ROUTES, USER_ROLES } from '../../utils/constants'

function LoginPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { login, isAuthenticated, user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  
  const { register, handleSubmit, formState: { errors } } = useForm()

  // Helper function to get dashboard route based on user role
  const getDashboardRoute = (user) => {
    if (!user) return ROUTES.DASHBOARD
    
    switch (user.role) {
      case USER_ROLES.REGISTRAR:
        return ROUTES.REGISTRAR.DASHBOARD
      case USER_ROLES.STUDENT:
      case USER_ROLES.LECTURER:
        return ROUTES.ACADEMIC.DASHBOARD
      default:
        return ROUTES.DASHBOARD
    }
  }

  // Redirect if already authenticated
  React.useEffect(() => {
    if (isAuthenticated && user) {
      const from = location.state?.from?.pathname || getDashboardRoute(user)
      navigate(from, { replace: true })
    }
  }, [isAuthenticated, user, navigate, location])

  const onSubmit = async (data) => {
    try {
      setLoading(true)
      setError('')
      
      const result = await login({
        email: data.email,
        password: data.password
      })
      
      if (result.success) {
        const from = location.state?.from?.pathname || getDashboardRoute(result.data)
        navigate(from, { replace: true })
      } else {
        setError(result.error?.message || 'Login failed')
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Slideshow images from public directory
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
          <div className="w-full max-w-6xl">
            <div className="block rounded-lg bg-white shadow-lg overflow-hidden">
              <div className="lg:flex lg:flex-wrap h-auto lg:min-h-[600px]">
                {/* Left column container - Login Form */}
                <div className="px-4 md:px-0 lg:w-6/12 flex flex-col justify-center py-6">
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
                      <h4 className="mb-4 mt-2 text-xl font-bold text-green-800">
                        Welcome to KEMS
                      </h4>
                      <p className="text-green-600 mb-4 text-sm">
                        KNUST Events Management System
                      </p>
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                      <p className="mb-4 text-gray-700 font-medium text-sm">Please login to your account</p>
                      
                      {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                          {error}
                        </div>
                      )}
                      
                      {/* Email input */}
                      <div className="space-y-2">
                        <label htmlFor="email" className="block text-sm font-medium text-green-800">
                          Email Address
                        </label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="Enter your email"
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition duration-150"
                          {...register('email', {
                            required: 'Email is required',
                            pattern: {
                              value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                              message: 'Please enter a valid email address'
                            }
                          })}
                        />
                        {errors.email && (
                          <p className="text-sm text-red-600">{errors.email.message}</p>
                        )}
                      </div>

                      {/* Password input */}
                      <div className="space-y-2">
                        <label htmlFor="password" className="block text-sm font-medium text-green-800">
                          Password
                        </label>
                        <Input
                          id="password"
                          type="password"
                          placeholder="Enter your password"
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition duration-150"
                          {...register('password', {
                            required: 'Password is required',
                            minLength: {
                              value: 6,
                              message: 'Password must be at least 6 characters'
                            }
                          })}
                        />
                        {errors.password && (
                          <p className="text-sm text-red-600">{errors.password.message}</p>
                        )}
                      </div>

                      {/* Submit button */}
                      <div className="pt-2">
                        <Button
                          type="submit"
                          className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-medium py-2 px-4 text-sm rounded-md transition duration-150 ease-in-out transform hover:scale-[1.02] shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                          disabled={loading}
                        >
                          {loading ? 'Signing in...' : 'Log in'}
                        </Button>

                        {/* Forgot password link */}
                        <div className="text-center mt-3">
                          <Link 
                            to="#"
                            className="text-xs text-green-600 hover:text-green-800 hover:underline"
                          >
                            Forgot password?
                          </Link>
                        </div>
                      </div>

                      {/* Register section */}
                      <div className="flex items-center justify-between border-t pt-4">
                        <p className="text-xs text-gray-600">Don't have an account?</p>
                        <Link
                          to={ROUTES.REGISTER}
                          className="inline-block rounded border-2 border-green-600 px-4 py-1 text-xs font-medium text-green-600 transition duration-150 ease-in-out hover:bg-green-600 hover:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                        >
                          Register
                        </Link>
                      </div>
                      
                      {/* Additional links */}
                      <div className="space-y-2 pt-3 border-t">
                        <div className="text-center">
                          <Link 
                            to={ROUTES.BOOKING.OUTSIDER}
                            className="text-xs text-green-700 hover:underline hover:text-green-800"
                          >
                            Book as an organization (outsider)
                          </Link>
                        </div>
                        
                        <div className="text-center">
                          <Link 
                            to="/outsider-login"
                            className="text-xs text-green-600 hover:underline hover:text-green-800"
                          >
                            Already have booking credentials? Login here
                          </Link>
                        </div>
                      </div>
                    </form>
                  </div>
                </div>

                {/* Right column container with slideshow */}
                <div className="lg:w-6/12 hidden lg:flex items-center rounded-r-lg bg-gradient-to-br from-green-50 to-green-100">
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

export default LoginPage 