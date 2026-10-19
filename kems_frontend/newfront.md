# KEMS API Documentation for Frontend

## Overview
This document provides comprehensive API documentation for the Knowledge Event Management System (KEMS) backend. All endpoints return JSON responses and use JWT authentication with HttpOnly cookies.

**Base URL**: `http://localhost:8000/api/`

## Authentication
- JWT tokens are automatically handled via HttpOnly cookies
- No need to manually add Authorization headers
- Tokens are refreshed automatically
- Logout clears cookies

---

## 🔐 Authentication Endpoints

### 1Register User (Insider)
**POST** `/api/auth/register/`

**Description**: Register a new university member (student, lecturer, registrar)

**Request Body**:
```json
[object Object]full_name: ohn Doe",
  email": "john.doe@university.edu.gh",
  school_id_num": "202301,
  password:securepassword123password_confirm:securepassword123",
role": "student",
  "program":Computer Science,department":Computer Science",
 contact_number": +233501234567
}
```

**Response** (201 Created):
```json
{
message: "User registered successfully,
 user:[object Object]id:1    email": "john.doe@university.edu.gh",
    full_name:John Doe",
    role": "student"
  }
}
```

**Validation Rules**:
- `role`: Must be "student", "lecturer, or "registrar"
- `program`: Required for students
- `department`: Required for lecturers and registrars
- `school_id_num`: Must be unique
- `email`: Must be unique

###2. Login (Insider)
**POST** `/api/auth/login/`

**Description**: Login for university members

**Request Body**:
```json
[object Object]  email": "john.doe@university.edu.gh,
  password:securepassword123"
}
```

**Response** (200OK):
```json
{
 messageLogin successful,
 user:[object Object]id:1    email": "john.doe@university.edu.gh",
    full_name:John Doe",
    role": "student
  }
}
```

###3. Outsider Login (Temporary)
**POST** `/api/auth/outsider-login/`

**Description**: Temporary login for outsiders to access payment page

**Request Body**:
```json[object Object] username:temp_username_123,password:temp_password_123"
}
```

**Response** (200OK):
```json
{
  "message": "Temporary login successful",
  booking_request:[object Object]id": 5
 event_name":Tech Conference2024
   total_amount: 000
  }
}
```

### 4Logout
**POST** `/api/auth/logout/`

**Description**: Logout and clear authentication cookies

**Response** (200OK):
```json
{
  messageLogout successful"
}
```

### 5. Get User Profile
**GET** `/api/auth/me/`

**Description**: Get current user's profile information

**Response** (200OK):
```json
{
id:1,
  full_name: ohn Doe",
  email": "john.doe@university.edu.gh",
  school_id_num": 223001role": "student",
  "program":Computer Science,department":Computer Science",
 contact_number": +233501234567,
date_joined: 20240115T10:30:0Z",
  is_active: true
}
```

### 6. Update User Profile
**PUT** `/api/auth/me/`

**Description**: Update current user's profile information

**Request Body**:
```json
[object Object]full_name:JohnSmith",
 contact_number": +233501234568rogram":Computer Science,department":Computer Science"
}
```

### 7. Change Password
**POST** `/api/auth/change-password/`

**Description**: Change user password

**Request Body**:
```json[object Object]
 old_password": "currentpassword,
 new_password": newsecurepassword,
  "new_password_confirm": newsecurepassword"
}
```

**Response** (200OK):
```json
{
  "message":Password changed successfully"
}
```

### 8. Check Authentication
**GET** `/api/auth/check-auth/`

**Description**: Check if user is authenticated and get user info

**Response** (200OK):
```json
{
 is_authenticated:true,
 user:[object Object]    id1,
    full_name:John Doe",
    email": "john.doe@university.edu.gh",
    role": "student  }
}
```

---

## 📋 Booking Endpoints

### 9e Outsider Booking Request
**POST** `/api/bookings/outsider/`

**Description**: Submit booking request as outsider (no authentication required)

**Request Body**:
```json[object Object]event_name":Tech Conference224purposeAnnual technology conference for industry professionals,
  venue": 1
 desired_date:202415,
  start_time: 00
  duration_hours": 8event_type": "public,
  organization: {
   name:TechCorp Ghana",
 address":123Tech Street, Accra",
 email:info@techcorp.gh",
   contact_number":+233501234567,
   website": https://techcorp.gh"
  },requester_full_name:Jane Smith",
  "requester_position": Event Coordinator",
  requester_contact_number": +23351234568  requester_email": "jane.smith@techcorp.gh"
}
```

**Response** (201 Created):
```json
{
 id: 5event_name":Tech Conference 224,
  venue": 1
 desired_date:202415,
  start_time: 00
  duration_hours": 8event_type": "public",
  status": "pending,
  created_at: 202401103000``

### 10te Insider Booking Request
**POST** `/api/bookings/insider/`

**Description**: Submit booking request as authenticated insider

**Request Body**:
```json[object Object]event_name":Student Workshop",
  "purpose": "Programming workshop for computer science students,
  venue": 2
 desired_date:202420,
  start_time: 00
  duration_hours": 3event_type":private"
}
```

**Response** (201 Created):
```json
{
 id: 6event_name":Student Workshop,
  venue": 2
 desired_date:202420,
  start_time: 00
  duration_hours": 3event_type": "private",
  status": "pending,
  created_at: 202401103000}
```

### 11. Get Insider Booking Status
**GET** `/api/bookings/insider/status/`

**Description**: Get all booking requests for authenticated insider

**Response** (200K):
```json
  [object Object]id": 6
 event_name":Student Workshop,
 venue_name": "Main Auditorium",
   desired_date":2024220,
    status:approved",
   requester_name:John Doe
    organization_name": null,
    total_amount": "00,
    created_at: 2024-115T10:300Z"
  }
]
```

### 12et All Auditoriums
**GET** `/api/auditoriums/`

**Description**: Get list of all available auditoriums

**Response** (200K):
```json
  [object Object]    id": 1,name": "Main Auditorium",
  description":Large auditorium with 500eating capacity",
   outsider_price:5000    insider_price": "00  },
  [object Object]    id": 2,
    "name": Conference Room A",
  description": Medium conference room with 100eating capacity",
   outsider_price:3000    insider_price": 0.00  }
]
```

---

## 🎯 Registrar Dashboard Endpoints

###13shboard Statistics
**GET** `/api/registrar/dashboard/stats/`

**Description**: Get statistics for registrar dashboard

**Response** (200OK):
```json
{
  total_bookings": 25pending_bookings": 8,
  approved_bookings": 12  denied_bookings": 5,
  total_revenue": 2500.0,
  "this_month_revenue: 00  upcoming_events": 15
  today_events: 3
}
```

### 14l Booking Requests (Registrar)
**GET** `/api/registrar/bookings/`

**Description**: Get all booking requests for registrar management

**Response** (200K):
```json
  [object Object]id": 5
 event_name":Tech Conference2024,
 venue_name": "Main Auditorium",
   desired_date":2024315,status": "pending",
   requester_name":Jane Smith",
    organization_name:TechCorp Ghana",
   total_amount: 0,
    created_at: 2024-115T10:300Z"
  }
]
```

### 15. Get Booking Request Details
**GET** `/api/registrar/bookings/{id}/`

**Description**: Get detailed booking request information

**Response** (200OK):
```json
{
id:5,
  requester:Jane Smith,
  organization:[object Object]    id": 1,
   name:TechCorp Ghana",
 address":123Tech Street, Accra",
 email:info@techcorp.gh",
   contact_number":+233501234567,
   website": https://techcorp.gh"
  },event_name":Tech Conference224purposeAnnual technology conference for industry professionals,
  venue": 1
 desired_date:202415,
  start_time: 00
  duration_hours": 8,calculated_end_time: 70,event_type": "public",
  status":pending",
denial_reason": null,
  is_paid: false,
 total_amount": "500,
  created_at: 2024011500,
  updated_at: 202401103000``

### 16te Booking Request Status
**PUT** `/api/registrar/bookings/{id}/`

**Description**: Update booking request status (approve/deny)

**Request Body**:
```json
{
  "status": approved"
}
```

**Response** (200OK):
```json
{
  id": 5,
  "status:approved",
denial_reason": null,
  updated_at: 202401110000``

### 17 Update Auditorium Prices
**PUT** `/api/registrar/auditoriums/{id}/prices/`

**Description**: Update auditorium pricing

**Request Body**:
```json
{
 outsider_price": "60,
  insider_price": "0.00"
}
```

**Response** (200OK):
```json
{
id": 1,
 outsider_price": "60,
  insider_price": 0.0``

###18reate Public Event
**POST** `/api/registrar/events/public/`

**Description**: Create a public event directly

**Request Body**:
```json
{
  "name": "University Open Day",
description": "Annual open day for prospective students,venue": 1,
 date:202415,
  start_time:09:000,
  end_time: 17:00:00is_public": true,
is_paid_event": false,
  ticket_info_url": null,
  tag_ids": [1, 2]
}
```

**Response** (201 Created):
```json[object Object]id: 10,
  name": "University Open Day",
description": "Annual open day for prospective students,venue": 1venue_name": "Main Auditorium,
 date:202415,
  start_time:09:000,
  end_time: 17:00:00is_public": true,
 organizer: 1,
 organizer_name: John Doe,  tags:  [object Object]id: 1,name": "Open Day"},
   [object Object]idname: University}
  ],
is_paid_event": false,
  ticket_info_url": null,
  "is_upcoming": true,
  "is_ongoing": false,
  created_at: 202401103000}
```

### 19. Get All Payments
**GET** `/api/registrar/payments/`

**Description**: Get all payment records

**Response** (200K):
```json
  [object Object]id: 1,  booking_request: 5,booking_event_name":Tech Conference 2024  requester_name":Jane Smith,   amount: 0
   payment_date: 2024115T10:30:00paystack_transaction_id": "TXN123456789,
    tatus": completed"
  }
]
```

### 20. Get Calendar Events
**GET** `/api/registrar/calendar-events/`

**Description**: Get all events for calendar view

**Response** (200K):
```json
[object Object]
 id:10name": "University Open Day",
  description": "Annual open day for prospective students",
   venue": 1
 venue_name": "Main Auditorium",
   date":20244,
    start_time:090,
    end_time:170,
   is_public": true,
  organizer":1  organizer_name:John Doe",
    tags:
     [object Object]id: 1,name": Open Day},
     [object Object]idname":University"}
    ],
  is_paid_event": false,
    ticket_info_url": null,
is_upcoming": true,is_ongoing": false,
    created_at: 2024-115T10:30  }
]
```

---

## 🎉 Event Hub Endpoints

### 21Get Events For You (Insider)
**GET** `/api/events/for-you/`

**Description**: Get personalized events for authenticated insider

**Response** (200K):
```json
[object Object]
 id:10name": "University Open Day",
  description": "Annual open day for prospective students",
   venue": 1
 venue_name": "Main Auditorium",
   date":20244,
    start_time:090,
    end_time:170,
   is_public": true,
  organizer":1  organizer_name:John Doe",
    tags:
     [object Object]id: 1,name": Open Day},
     [object Object]idname":University"}
    ],
  is_paid_event": false,
    ticket_info_url": null,
is_upcoming": true,is_ongoing": false,
    created_at: 2024-115T10:300Z"
  }
]
```

### 22 All Public Events
**GET** `/api/events/all-public/`

**Description**: Get all public events (no authentication required)

**Response** (200K):
```json
[object Object]
 id:10name": "University Open Day",
  description": "Annual open day for prospective students",
   venue": 1
 venue_name": "Main Auditorium",
   date":20244,
    start_time:090,
    end_time:170,
   is_public": true,
  organizer":1  organizer_name:John Doe",
    tags:
     [object Object]id: 1,name": Open Day},
     [object Object]idname":University"}
    ],
  is_paid_event": false,
    ticket_info_url": null,
is_upcoming": true,is_ongoing": false,
    created_at: 2024-115T10:300Z"
  }
]
```

### 23. Get Invited Events
**GET** `/api/events/invited/`

**Description**: Get events the user has been invited to

**Response** (200K):
```json
[object Object]
 id:11namePrivate Workshop",
    description": "Exclusive workshop for invited participants",
   venue": 2
 venue_name": Conference Room A",
   date":20243,
    start_time:140,
    end_time:170,
    is_public": false,
  organizer":2  organizer_name": Dr. Smith",
    tags:
     [object Object]id3name": Workshop},
     [object Object]id, "name": Private"}
    ],
  is_paid_event": false,
    ticket_info_url": null,
is_upcoming": true,is_ongoing": false,
    created_at: 2024-115T10:30  }
]
```

---

## 📧 Invitation Endpoints

### 24. Create Invitations
**POST** `/api/invitations/`

**Description**: Create invitations for private events

**Request Body**:
```json
[object Object]  event:11
 emails: [
    "student1@university.edu.gh",
    "student2@university.edu.gh"
  ]
}
```

**Response** (201 Created):
```json
{message":Invitations sent successfully,
  nvitations_created":2,
 invitations:
   [object Object]  id: 1
      event": 11,
   event_name":Private Workshop",
   invited_user": null,
      invited_user_name": null,
      invited_email": "student1@university.edu.gh,
      status": pending",
     sent_at: 2024-1-15T1030:00Z"
    }
  ]
}
```

### 25pond to Invitation
**PUT** `/api/invitations/{id}/response/`

**Description**: Accept or decline an invitation

**Request Body**:
```json
{
  "status": accepted"
}
```

**Response** (200OK):
```json
{
  id": 1status: epted,
  updated_at: 20240111:00
}
```

---

## 🔗 API Root Endpoint

### 26. API Root
**GET** `/api/` or `/`

**Description**: Get API overview and available endpoints

**Response** (200OK):
```json
{
  "message": Welcometo KEMS (Knowledge Event Management System) API,
 version: 00
  endpoints": {
   authentication":[object Object]
     register": "/api/auth/register/",
  login":/api/auth/login/,   logout": /api/auth/logout/,  outsider_login: /api/auth/outsider-login/",
      user_profile":/api/auth/me/",
    check_auth": "/api/auth/check-auth/"
    },
    booking": [object Object]outsider_booking: /api/bookings/outsider/,  insider_booking:/api/bookings/insider/",
     insider_status:/api/bookings/insider/status/",
     auditoriums":/api/auditoriums/"
    },
    "registrar_dashboard": [object Object]  dashboard_stats:/api/registrar/dashboard/stats/",
      manage_bookings: api/registrar/bookings/",
  create_public_event: "/api/registrar/events/public/",
    view_payments:/api/registrar/payments/"
    },
   events: {
     events_for_you": "/api/events/for-you/",
    public_events": "/api/events/all-public/,  invited_events: "/api/events/invited/"
    },
  admin: /admin/
  },
documentation: {note: This browsable API allows you to interact with endpoints directly.",
   authentication:  endpoints require JWT authentication.",
    usage": "Click on any endpoint link above to explore the API.  }
}
```

---

## 🔧 Error Responses

### Common Error Formats

**40Bad Request**:
```json[object Object]field_name: [Error message for this field]
}
```

**401nauthorized**:
```json
{
  "detail: cation credentials were not provided.
}
```

**403rbidden**:
```json
[object Object]detail": "You do not have permission to perform this action.
}
```

**404t Found**:
```json
{
  "detail: ot found."
}
```

**50ernal Server Error**:
```json
{
  "detail": "Internal server error."
}
```

---

## 📝 Frontend Implementation Notes

### Authentication Flow
1**Login**: POST to `/api/auth/login/` with email/password2. **Cookies**: JWT tokens are automatically stored in HttpOnly cookies
3. **Requests**: No need to manually add Authorization headers
4. **Refresh**: Tokens are automatically refreshed
5. **Logout**: POST to `/api/auth/logout/` clears cookies

### Role-Based Access
- **Student**: Can book venues, view events, respond to invitations
- **Lecturer**: Same as student + can create public events
- **Registrar**: Full access to all endpoints including dashboard
- **Outsider**: Limited access, temporary login for payments

### Data Handling
- All dates are in ISO 8601format: `YYYY-MM-DD`
- All times are in24-hour format: `HH:MM:SS`
- Decimal amounts are strings to preserve precision
- File uploads use multipart/form-data

### State Management
- Use `/api/auth/check-auth/` to verify authentication status
- Store user role for conditional rendering
- Handle loading states for async operations
- Implement error boundaries for API failures

### Real-time Updates
- Poll dashboard stats every 30 seconds
- Refresh booking status every minute
- Update event lists when new events are created

---

## 🚀 Getting Started

1**Start Backend**: `python manage.py runserver`
2. **Test API**: Visit `http://localhost:8000pi/`3 **Frontend URL**: Configure CORS for `http://localhost:3000`
4. **Environment**: Copy `environment_template.txt` to `.env`

---

*Last Updated: January 2024*
*API Version: 1.0.0* 