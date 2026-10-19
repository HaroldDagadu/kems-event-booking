/**
 * @fileoverview Type definitions for KEMS application
 * Using JSDoc for type definitions in JavaScript
 */

/**
 * @typedef {Object} User
 * @property {number} id - User ID
 * @property {string} full_name - User's full name
 * @property {string} email - User's email address
 * @property {string} school_id_num - University ID number
 * @property {'student'|'lecturer'|'registrar'|'outsider'} role - User role
 * @property {string} [program] - Student's program (required for students)
 * @property {string} [department] - Department (required for lecturers/registrars)
 * @property {string} contact_number - Phone number
 * @property {string} date_joined - ISO date string
 * @property {boolean} is_active - Whether user is active
 */

/**
 * @typedef {Object} Organization
 * @property {number} id - Organization ID
 * @property {string} name - Organization name
 * @property {string} address - Organization address
 * @property {string} email - Organization email
 * @property {string} contact_number - Organization phone
 * @property {string} [website] - Organization website
 */

/**
 * @typedef {Object} Auditorium
 * @property {number} id - Auditorium ID
 * @property {string} name - Auditorium name
 * @property {string} description - Auditorium description
 * @property {string} outsider_price - Price for outsiders
 * @property {string} insider_price - Price for insiders
 */

/**
 * @typedef {Object} BookingRequest
 * @property {number} id - Booking ID
 * @property {string} event_name - Name of the event
 * @property {string} purpose - Purpose of the event
 * @property {number|Auditorium} venue - Venue ID or venue object
 * @property {string} venue_name - Name of the venue
 * @property {string} desired_date - Date in YYYY-MM-DD format
 * @property {string} start_time - Start time in HH:MM:SS format
 * @property {string} duration_hours - Duration in hours
 * @property {string} calculated_end_time - Calculated end time
 * @property {'public'|'private'} event_type - Type of event
 * @property {'pending'|'approved'|'denied'} status - Booking status
 * @property {string} [denial_reason] - Reason for denial if denied
 * @property {boolean} is_paid - Whether booking is paid
 * @property {string} total_amount - Total amount to pay
 * @property {string} requester_name - Name of requester
 * @property {string} [organization_name] - Organization name (for outsiders)
 * @property {Organization} [organization] - Organization details
 * @property {string} created_at - ISO date string
 * @property {string} updated_at - ISO date string
 */

/**
 * @typedef {Object} Event
 * @property {number} id - Event ID
 * @property {string} name - Event name
 * @property {string} description - Event description
 * @property {number} venue - Venue ID
 * @property {string} venue_name - Venue name
 * @property {string} date - Event date (YYYY-MM-DD)
 * @property {string} start_time - Start time (HH:MM:SS)
 * @property {string} end_time - End time (HH:MM:SS)
 * @property {boolean} is_public - Whether event is public
 * @property {number} organizer - Organizer user ID
 * @property {string} organizer_name - Organizer name
 * @property {EventTag[]} tags - Event tags
 * @property {boolean} is_paid_event - Whether event requires payment
 * @property {string} [ticket_info_url] - URL for ticket information
 * @property {boolean} is_upcoming - Whether event is upcoming
 * @property {boolean} is_ongoing - Whether event is currently ongoing
 * @property {string} created_at - ISO date string
 */

/**
 * @typedef {Object} EventTag
 * @property {number} id - Tag ID
 * @property {string} name - Tag name
 * @property {string} [color] - Tag color
 */

/**
 * @typedef {Object} Invitation
 * @property {number} id - Invitation ID
 * @property {number} event - Event ID
 * @property {string} event_name - Event name
 * @property {number} [invited_user] - Invited user ID (null for external)
 * @property {string} [invited_user_name] - Invited user name
 * @property {string} invited_email - Invited email
 * @property {'pending'|'accepted'|'declined'} status - Invitation status
 * @property {string} sent_at - ISO date string
 */

/**
 * @typedef {Object} Payment
 * @property {number} id - Payment ID
 * @property {number} booking_request - Booking request ID
 * @property {string} booking_event_name - Event name
 * @property {string} requester_name - Requester name
 * @property {string} amount - Payment amount
 * @property {string} payment_date - ISO date string
 * @property {string} paystack_transaction_id - Paystack transaction ID
 * @property {'pending'|'successful'|'failed'} status - Payment status
 */

/**
 * @typedef {Object} DashboardStats
 * @property {number} total_bookings - Total number of bookings
 * @property {number} pending_bookings - Number of pending bookings
 * @property {number} approved_bookings - Number of approved bookings
 * @property {number} total_payments - Total number of payments
 * @property {number} total_events - Total number of events
 * @property {number} upcoming_events - Number of upcoming events
 */

/**
 * @typedef {Object} AuthState
 * @property {boolean} isAuthenticated - Whether user is authenticated
 * @property {User|null} user - Current user data
 * @property {boolean} loading - Whether auth is loading
 * @property {string|null} error - Authentication error
 */

/**
 * @typedef {Object} ApiResponse
 * @property {boolean} success - Whether request was successful
 * @property {any} [data] - Response data
 * @property {ApiError} [error] - Error details
 */

/**
 * @typedef {Object} ApiError
 * @property {string} message - Error message
 * @property {'network'|'validation'|'auth'|'permission'|'not_found'|'server'|'unknown'} type - Error type
 * @property {Object} [errors] - Validation errors (field-level)
 */

/**
 * @typedef {Object} PaginatedResponse
 * @property {number} count - Total number of items
 * @property {string|null} next - Next page URL
 * @property {string|null} previous - Previous page URL
 * @property {any[]} results - Array of results
 */

/**
 * @typedef {Object} FormState
 * @property {boolean} loading - Whether form is submitting
 * @property {string|null} error - Form error message
 * @property {boolean} success - Whether form submission was successful
 */

/**
 * @typedef {Object} NotificationState
 * @property {string} id - Notification ID
 * @property {'success'|'error'|'warning'|'info'} type - Notification type
 * @property {string} message - Notification message
 * @property {number} [duration] - Auto-dismiss duration in ms
 */

export {} 