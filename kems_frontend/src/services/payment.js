import { apiMethods } from './api'
import { PAYSTACK_PUBLIC_KEY } from '../utils/constants'
import { generatePaymentReference } from '../lib/utils'

// Payment Service
export const paymentService = {
  // Initialize Payment
  initializePayment: async (paymentData) => {
    return await apiMethods.post('/payments/initialize/', paymentData)
  },

  // Verify Payment
  verifyPayment: async (reference) => {
    return await apiMethods.post('/payments/verify/', { reference })
  },

  // Get Payment Details
  getPaymentDetails: async (paymentId) => {
    return await apiMethods.get(`/payments/${paymentId}/`)
  },

  // Get User's Payment History
  getPaymentHistory: async (page = 1, pageSize = 10) => {
    const params = new URLSearchParams({
      page: page.toString(),
      page_size: pageSize.toString()
    })
    return await apiMethods.get(`/payments/history/?${params}`)
  }
}

// Paystack Integration Helper
export class PaystackPayment {
  constructor() {
    this.publicKey = PAYSTACK_PUBLIC_KEY
  }

  // Initialize Paystack payment
  async initializePayment({ amount, email, reference, bookingId, metadata = {} }) {
    return new Promise((resolve, reject) => {
      // Ensure Paystack script is loaded
      if (!window.PaystackPop) {
        reject(new Error('Paystack script not loaded'))
        return
      }

      const handler = window.PaystackPop.setup({
        key: this.publicKey,
        email: email,
        amount: amount * 100, // Convert to kobo (smallest unit)
        currency: 'GHS',
        ref: reference || generatePaymentReference(bookingId),
        metadata: {
          booking_id: bookingId,
          ...metadata
        },
        callback: function(response) {
          // Payment successful
          resolve({
            success: true,
            reference: response.reference,
            message: 'Payment completed successfully'
          })
        },
        onClose: function() {
          // Payment cancelled
          resolve({
            success: false,
            message: 'Payment was cancelled'
          })
        }
      })

      handler.openIframe()
    })
  }

  // Load Paystack script dynamically
  static loadPaystackScript() {
    return new Promise((resolve, reject) => {
      if (window.PaystackPop) {
        resolve(true)
        return
      }

      const script = document.createElement('script')
      script.src = 'https://js.paystack.co/v1/inline.js'
      script.async = true
      script.onload = () => resolve(true)
      script.onerror = () => reject(new Error('Failed to load Paystack script'))
      
      document.head.appendChild(script)
    })
  }
}

// Payment Flow Helper
export const paymentFlow = {
  // Start payment process for a booking
  async processBookingPayment(bookingData) {
    try {
      // Load Paystack script if not already loaded
      await PaystackPayment.loadPaystackScript()

      // Initialize payment with Paystack
      const paystack = new PaystackPayment()
      const paymentResult = await paystack.initializePayment({
        amount: parseFloat(bookingData.total_amount),
        email: bookingData.requester_email,
        bookingId: bookingData.id,
        metadata: {
          booking_id: bookingData.id,
          event_name: bookingData.event_name,
          venue_name: bookingData.venue_name
        }
      })

      if (paymentResult.success) {
        // Verify payment on the backend
        const verificationResult = await paymentService.verifyPayment(paymentResult.reference)
        
        if (verificationResult.success) {
          return {
            success: true,
            message: 'Payment completed and verified successfully',
            reference: paymentResult.reference,
            data: verificationResult.data
          }
        } else {
          return {
            success: false,
            message: 'Payment verification failed',
            error: verificationResult.error
          }
        }
      } else {
        return {
          success: false,
          message: paymentResult.message || 'Payment was not completed'
        }
      }
    } catch (error) {
      console.error('Payment flow error:', error)
      return {
        success: false,
        message: 'An error occurred during payment processing',
        error: error.message
      }
    }
  }
}

export default paymentService 