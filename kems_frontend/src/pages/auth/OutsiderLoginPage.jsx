import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../../components/ui/Card'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import { Loader2, Eye, EyeOff } from 'lucide-react'
import { ROUTES } from '../../utils/constants'
import { useToast } from '../../contexts/ToastContext'
import api from '../../services/api'

function OutsiderLoginPage() {
  const navigate = useNavigate()
  const { showToast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    // Clear error when user starts typing
    if (error) setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const response = await api.post('/auth/outsider-login/', formData)
      
      if (response.data) {
        showToast('Login successful! Redirecting to your booking details...', 'success')
        
        // Add small delay to ensure toast is visible, then navigate
        setTimeout(() => {
          console.log('Navigating to outsider dashboard...')
          navigate('/outsider-dashboard', { replace: true })
        }, 1000)
      }
    } catch (err) {
      const errorMessage = err.response?.data?.non_field_errors?.[0] || 
                          err.response?.data?.detail || 
                          'Invalid temporary credentials. Please check your username and password.'
      setError(errorMessage)
      showToast(errorMessage, 'error')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-yellow-50 px-4">
      <div className="w-full max-w-md">
        <Card className="kems-card">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-xl shadow-lg overflow-hidden">
                <img 
                  src="https://images.seeklogo.com/logo-png/35/1/kwame-nkrumah-university-of-science-technology-logo-png_seeklogo-350387.png"
                  alt="KNUST Logo"
                  className="w-full h-full object-contain"
                />
              </div>
            </div>
            <CardTitle className="text-2xl text-green-800">Temporary Access Login</CardTitle>
            <CardDescription className="text-green-600">
              Use the temporary login credentials sent to your email
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                  {error}
                </div>
              )}
              
              <div className="space-y-2">
                <label htmlFor="username" className="text-sm font-medium text-green-800">
                  Temporary Username
                </label>
                <Input
                  id="username"
                  name="username"
                  type="text"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="Enter temporary username"
                  className="kems-input"
                  required
                  disabled={isLoading}
                />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium text-green-800">
                  Temporary Password
                </label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Enter temporary password"
                    className="kems-input"
                    required
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    disabled={isLoading}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              
              <Button 
                type="submit" 
                className="kems-button-primary w-full" 
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Logging in...
                  </div>
                ) : (
                  'Access My Booking'
                )}
              </Button>
            </form>
          </CardContent>
          
          <CardFooter className="flex flex-col space-y-4">
            <div className="text-center text-sm text-green-600">
              Don't have temporary credentials?{' '}
              <Link 
                to={ROUTES.BOOKING.OUTSIDER} 
                className="text-green-700 hover:underline font-medium"
              >
                Make a booking request
              </Link>
            </div>
            
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-green-200" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-green-600">Or</span>
              </div>
            </div>
            
            <div className="text-center">
              <Link 
                to={ROUTES.LOGIN}
                className="text-sm text-green-700 hover:underline"
              >
                University member? Login here
              </Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}

export default OutsiderLoginPage 