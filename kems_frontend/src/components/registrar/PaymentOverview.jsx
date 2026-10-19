import React, { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { useApi } from '../../hooks/useApi'
import { registrarService } from '../../services/registrar'
import { DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Calendar,
  User,
  Building,
  CheckCircle,
  Clock,
  XCircle
} from 'lucide-react'

function PaymentOverview() {
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalRevenue: 0,
    thisMonthRevenue:0,
    pendingPayments: 0,
    completedPayments: 0
  })

  // API hooks
  const { execute: fetchPayments, loading: paymentsLoading } = useApi(registrarService.getAllPayments)
  const { execute: fetchStats, loading: statsLoading } = useApi(registrarService.getDashboardStats)

  useEffect(() => {
    loadPaymentData()
  }, [])

  const loadPaymentData = async () => {
    try {
      setLoading(true)
      
      // Fetch payments
      const paymentsResponse = await fetchPayments()
      if (paymentsResponse.success) {
        const paymentsData = Array.isArray(paymentsResponse.data) ? paymentsResponse.data : []
        setPayments(paymentsData)

        // Fetch stats for financial overview
        const statsResponse = await fetchStats()
        if (statsResponse.success) {
          setStats({
            totalRevenue: statsResponse.data?.total_revenue || 0,
            thisMonthRevenue: statsResponse.data?.this_month_revenue || 0,
            pendingPayments: paymentsData.filter(p => p.status === 'pending').length,
            completedPayments: paymentsData.filter(p => p.status === 'completed').length
          })
        }
      }
    } catch (error) {
      console.error('Error loading payment data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100'
      case 'pending': return 'text-yellow-600 bg-yellow-100'
      case 'failed': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-600"/>
      case 'pending': return <Clock className="w-4 h-4 text-yellow-600"/>
      case 'failed': return <XCircle className="w-4 h-4 text-red-600"/>
      default: return <Clock className="w-4 h-4 text-gray-600"/>
    }
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
          <h2 className="text-2xl font-bold">Payment Overview</h2>
          <p className="text-muted-foreground">Track all payment transactions and revenue</p>
        </div>
        <Button onClick={loadPaymentData} variant="outline" size="sm">
          Refresh
        </Button>
      </div>

      {/* Financial Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-4 w-4 text-green-600"/>
              <span className="text-sm font-medium">Total Revenue</span>
            </div>
            <div className="text-2xl font-bold text-green-600">
              ₵{stats.totalRevenue.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              All time revenue
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4 text-blue-600"/>
              <span className="text-sm font-medium">This Month</span>
            </div>
            <div className="text-2xl font-bold text-blue-600">
              ₵{stats.thisMonthRevenue.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Current month revenue
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-600"/>
              <span className="text-sm font-medium">Completed</span>
            </div>
            <div className="text-2xl font-bold text-green-600">
              {stats.completedPayments}
            </div>
            <p className="text-xs text-muted-foreground">
              Successful payments
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-yellow-600"/>
              <span className="text-sm font-medium">Pending</span>
            </div>
            <div className="text-2xl font-bold text-yellow-600">
              {stats.pendingPayments}
            </div>
            <p className="text-xs text-muted-foreground">
              Awaiting payment
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Payments */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Payment Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          {payments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <DollarSign className="w-12 h-12 text-muted-foreground mx-auto mb-4"/>
              <h3 className="text-lg font-semibold mb-2">No payments found</h3>
              <p className="text-muted-foreground">
                No payment transactions are available
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {payments.slice(0,10).map((payment) => (
                <div key={payment.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-semibold">{payment.booking_event_name}</h4>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(payment.status)}`}>
                        {payment.status}
                      </span>
                      {getStatusIcon(payment.status)}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">{payment.requester_name}</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm font-semibold">₵{payment.amount}</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">
                         {new Date(payment.payment_date).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    
                    {payment.paystack_transaction_id && (
                      <div className="mt-2 text-xs text-muted-foreground">
                        Transaction ID: {payment.paystack_transaction_id}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default PaymentOverview 