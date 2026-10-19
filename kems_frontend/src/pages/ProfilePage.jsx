import React, { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Label } from '../components/ui/Label'
import { useApi } from '../hooks/useApi'
import { authService } from '../services/auth'
import { useAuth } from '../contexts/AuthContext'
import { User, Mail, Phone, Calendar, School, Building, Edit, Save, X, Lock, Eye, EyeOff } from 'lucide-react'

function ProfilePage() {
  const [user, updateUser] = useAuth()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({})
  const [passwordData, setPasswordData] = useState({
    old_password: '',
    new_password: '',
    new_password_confirm: ''
  })

  // Fetch user profile
  const { execute: fetchProfile, loading: profileLoading } = useApi(authService.getUserProfile)
  const { execute: updateProfile, loading: updateLoading } = useApi(authService.updateUserProfile)
  const { execute: changePassword, loading: passwordLoading } = useApi(authService.changePassword)

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true)
        const response = await fetchProfile()
        if (response.success) {
          setProfile(response.data)
          setFormData({
            full_name: response.data.full_name,
            contact_number: response.data.contact_number,
            program: response.data.program,
            department: response.data.department
          })
        }
      } catch (error) {
        console.error('Error loading profile:', error)
      } finally {
        setLoading(false)
      }
    }

    loadProfile()
  }, [])

  const handleEdit = () => {
    setEditing(true)
  }

  const handleCancel = () => {
    setEditing(false)
    setFormData({
      full_name: profile.full_name,
      contact_number: profile.contact_number,
      program: profile.program,
      department: profile.department
    })
  }

  const handleSave = async () => {
    try {
      const response = await updateProfile(formData)
      if (response.success) {
        setProfile(response.data)
        updateUser(response.data)
        setEditing(false)
      }
    } catch (error) {
      console.error('Error updating profile:', error)
    }
  }

  const handlePasswordChange = async () => {
    try {
      if (passwordData.new_password !== passwordData.new_password_confirm) {
        alert('New passwords do not match')
        return
      }
      
      const response = await changePassword(passwordData)
      if (response.success) {
        setPasswordData({
          old_password: '',
          new_password: '',
          new_password_confirm: ''
        })
        alert('Password changed successfully')
      }
    } catch (error) {
      console.error('Error changing password:', error)
    }
  }

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handlePasswordInputChange = (field, value) => {
    setPasswordData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Profile</h1>
          <p className="text-muted-foreground">Manage your account information</p>
        </div>
        {!editing && (
          <Button onClick={handleEdit}>
            <Edit className="w-4 h-4 mr-2" />
            Edit Profile
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profile Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Personal Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="full_name">Full Name</Label>
                {editing ? (
                  <Input
                    id="full_name"
                    value={formData.full_name}
                    onChange={(e) => handleInputChange('full_name', e.target.value)}
                    className="mt-1"
                  />
                ) : (
                  <p className="text-sm mt-1">{profile.full_name}</p>
                )}
              </div>
              
              <div>
                <Label htmlFor="email">Email</Label>
                <p className="text-sm mt-1 flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  {profile.email}
                </p>
              </div>
              
              <div>
                <Label htmlFor="contact_number">Contact Number</Label>
                {editing ? (
                  <Input
                    id="contact_number"
                    value={formData.contact_number}
                    onChange={(e) => handleInputChange('contact_number', e.target.value)}
                    className="mt-1"
                  />
                ) : (
                  <p className="text-sm mt-1 flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    {profile.contact_number}
                  </p>
                )}
              </div>
              
              <div>
                <Label htmlFor="school_id">School ID</Label>
                <p className="text-sm mt-1 flex items-center gap-2">
                  <School className="w-4 h-4" />
                  {profile.school_id_num}
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="role">Role</Label>
                <p className="text-sm mt-1 capitalize">{profile.role}</p>
              </div>
              
              <div>
                <Label htmlFor="date_joined">Date Joined</Label>
                <p className="text-sm mt-1 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  {profile.date_joined}
                </p>
              </div>
            </div>
            
            {profile.program && (
              <div>
                <Label htmlFor="program">Program</Label>
                {editing ? (
                  <Input
                    id="program"
                    value={formData.program}
                    onChange={(e) => handleInputChange('program', e.target.value)}
                    className="mt-1"
                  />
                ) : (
                  <p className="text-sm mt-1">{profile.program}</p>
                )}
              </div>
            )}
            
            {profile.department && (
              <div>
                <Label htmlFor="department">Department</Label>
                {editing ? (
                  <Input
                    id="department"
                    value={formData.department}
                    onChange={(e) => handleInputChange('department', e.target.value)}
                    className="mt-1"
                  />
                ) : (
                  <p className="text-sm mt-1 flex items-center gap-2">
                    <Building className="w-4 h-4" />
                    {profile.department}
                  </p>
                )}
              </div>
            )}
            
            {editing && (
              <div className="flex gap-2 pt-4">
                <Button onClick={handleSave} disabled={updateLoading}>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </Button>
                <Button variant="outline" onClick={handleCancel}>
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Change Password */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5" />
              Change Password
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="old_password">Current Password</Label>
              <div className="relative mt-1">
                <Input
                  id="old_password"
                  type={showPassword ? 'text' : 'password'}
                  value={passwordData.old_password}
                  onChange={(e) => handlePasswordInputChange('old_password', e.target.value)}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            
            <div>
              <Label htmlFor="new_password">New Password</Label>
              <Input
                id="new_password"
                type="password"
                value={passwordData.new_password}
                onChange={(e) => handlePasswordInputChange('new_password', e.target.value)}
                className="mt-1"
              />
            </div>
            
            <div>
              <Label htmlFor="new_password_confirm">Confirm New Password</Label>
              <Input
                id="new_password_confirm"
                type="password"
                value={passwordData.new_password_confirm}
                onChange={(e) => handlePasswordInputChange('new_password_confirm', e.target.value)}
                className="mt-1"
              />
            </div>
            
            <Button 
              onClick={handlePasswordChange} 
              disabled={passwordLoading || !passwordData.old_password || !passwordData.new_password || !passwordData.new_password_confirm}
              className="w-full"
            >
              <Lock className="w-4 h-4 mr-2" />
              Change Password
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Account Status */}
      <Card>
        <CardHeader>
          <CardTitle>Account Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <h4 className="font-semibold">Account Status</h4>
              <p className={`text-sm ${profile.is_active ? 'text-green-600' : 'text-red-600'}`}>
                {profile.is_active ? 'Active' : 'Inactive'}
              </p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <h4 className="font-semibold">Last Login</h4>
              <p className="text-sm text-muted-foreground">
                {profile.last_login ? profile.last_login : 'Never'}
              </p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <h4 className="font-semibold">Account Type</h4>
              <p className="text-sm capitalize">{profile.role}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default ProfilePage 