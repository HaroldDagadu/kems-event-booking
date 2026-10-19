import React, { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { useApi } from '../../hooks/useApi'
import { bookingService } from '../../services/booking'
import { registrarService } from '../../services/registrar'
import { Building, Users, DollarSign, Edit, Save, X, MapPin } from 'lucide-react'

function VenueManagement() {
  const [auditoriums, setAuditoriums] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState(null)
  const [editPrices, setEditPrices] = useState({ outsider_price: '', insider_price: '' })

  // API hooks
  const { execute: fetchAuditoriums, loading: auditoriumsLoading } = useApi(bookingService.getAuditoriums)
  const { execute: updatePrices, loading: updateLoading } = useApi(registrarService.updateAuditoriumPrices)

  useEffect(() => {
    loadAuditoriums()
  }, [])

  const loadAuditoriums = async () => {
    try {
      setLoading(true)
      const response = await fetchAuditoriums()
      if (response.success) {
        const auditoriumsData = Array.isArray(response.data) ? response.data : []
        setAuditoriums(auditoriumsData)
      }
    } catch (error) {
      console.error('Error loading auditoriums:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (auditorium) => {
    setEditingId(auditorium.id)
    setEditPrices({
      outsider_price: auditorium.outsider_price,
      insider_price: auditorium.insider_price
    })
  }

  const handleSave = async (auditoriumId) => {
    try {
      const response = await updatePrices(auditoriumId, editPrices)
      if (response.success) {
        setEditingId(null)
        setEditPrices({ outsider_price: '', insider_price: '' })
        loadAuditoriums() // Refresh the list
      }
    } catch (error) {
      console.error('Error updating prices:', error)
    }
  }

  const handleCancel = () => {
    setEditingId(null)
    setEditPrices({ outsider_price: '', insider_price: '' })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Venue Management</h2>
          <p className="text-muted-foreground">Manage auditorium information and pricing</p>
        </div>
        <Button onClick={loadAuditoriums} variant="outline" size="sm">
          Refresh
        </Button>
      </div>

      {auditoriums.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Building className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No venues found</h3>
            <p className="text-muted-foreground">
              No auditoriums are currently available
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {auditoriums.map((auditorium) => (
            <Card key={auditorium.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold">{auditorium.name}</h3>
                    <p className="text-sm text-muted-foreground">{auditorium.description}</p>
                  </div>
                  <MapPin className="w-5 h-5 text-muted-foreground" />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Outsider Price:</span>
                    {editingId === auditorium.id ? (
                      <Input
                        type="number"
                        value={editPrices.outsider_price}
                        onChange={(e) => setEditPrices(prev => ({ ...prev, outsider_price: e.target.value }))}
                        className="w-24"
                        placeholder="0.00"
                        min="0"
                        step="0.01"
                      />
                    ) : (
                      <span className="font-semibold">₵{auditorium.outsider_price}</span>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Insider Price:</span>
                    {editingId === auditorium.id ? (
                      <Input
                        type="number"
                        value={editPrices.insider_price}
                        onChange={(e) => setEditPrices(prev => ({ ...prev, insider_price: e.target.value }))}
                        className="w-24"
                        placeholder="0.00"
                        min="0"
                        step="0.01"
                      />
                    ) : (
                      <span className="font-semibold">₵{auditorium.insider_price}</span>
                    )}
                  </div>
                </div>

                <div className="mt-4 flex gap-2">
                  {editingId === auditorium.id ? (
                    <>
                      <Button
                        size="sm"
                        onClick={() => handleSave(auditorium.id)}
                        disabled={updateLoading}
                        className="flex-1"
                      >
                        <Save className="w-4 h-4 mr-2" />
                        {updateLoading ? 'Saving...' : 'Save'}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleCancel}
                        disabled={updateLoading}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(auditorium)}
                      className="flex-1"
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Edit Prices
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

export default VenueManagement 