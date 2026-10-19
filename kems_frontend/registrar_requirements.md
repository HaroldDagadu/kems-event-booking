# Registrar Account Requirements - KEMS System

## Overview
The Registrar account in the Knowledge Event Management System (KEMS) has full administrative access to manage all aspects of the booking system, including venue management, booking approvals, event creation, and financial oversight.

---

## 🔐 Authentication & Access

### Login Requirements
- **Email**: Registrar's university email address
- **Password**: Secure password with complexity requirements
- **Role**: registrar" (automatically assigned during registration)
- **Session**: JWT token stored in HttpOnly cookies
- **Auto-refresh**: Tokens automatically refreshed

### Access Control
- **Full System Access**: Can view and manage all bookings, events, and users
- **Financial Oversight**: Access to payment records and revenue reports
- **Venue Management**: Can update auditorium prices and availability
- **Event Creation**: Can create public events directly

---

## 📊 Dashboard Statistics (GET)

### Endpoint: `/api/registrar/dashboard/stats/`
**Purpose**: Get real-time statistics for registrar dashboard

**Response Data**:
```json
{
  total_bookings": 25pending_bookings": 8,
  approved_bookings": 12  denied_bookings": 5,
 total_revenue: 2500,
  "this_month_revenue": 50  upcoming_events": 15
  today_events": 3
}
```

**Key Metrics**:
- Total booking requests (all time)
- Pending approvals (requires immediate attention)
- Approved bookings (successful requests)
- Denied bookings (rejected requests)
- Total revenue generated
- Current month revenue
- Upcoming events count
- Today's events count

---

## 📋 Booking Management

### 1. View All Booking Requests (GET)
**Endpoint**: `/api/registrar/bookings/`

**Purpose**: Get all booking requests for management

**Response Data**:
```json
  [object Object]id": 5
 event_name":Tech Conference2024,
 venue_name": "Main Auditorium",
   desired_date":2024315,status": "pending",
   requester_name":Jane Smith",
    organization_name:TechCorp Ghana",
   total_amount: 0,
    created_at: 2024-115T10:300
]
```

**Required Information**:
- Booking ID for reference
- Event name and purpose
- Venue details and capacity
- Requested date and time
- Current status (pending/approved/denied)
- Requester information
- Organization details (for outsiders)
- Calculated cost
- Request timestamp

### 2. Get Detailed Booking Information (GET)
**Endpoint**: `/api/registrar/bookings/{id}/`

**Purpose**: View complete booking details for decision-making

**Response Data**:
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
 duration_hours": 8calculated_end_time: 70,event_type": "public",
  status":pending",
denial_reason": null,
  is_paid: false,
 total_amount": "500,
  created_at: 2024011500,
  updated_at: 20240110:30:00Z"
}
```

**Required Information**:
- Complete requester details
- Organization information (for outsiders)
- Event purpose and description
- Venue specifications
- Date, time, and duration
- Event type (public/private)
- Payment status
- Cost calculation
- Timestamps for tracking

### 3. Approve/Deny Booking Requests (PUT)
**Endpoint**: `/api/registrar/bookings/{id}/`

**Purpose**: Update booking status and provide feedback

**Request Body**:
```json
{
  "status":approved
}
```
or
```json
[object Object]status": "denied",
  denial_reason": "Venue already booked for requested date"
}
```

**Required Information**:
- New status (approved/denied)
- Denial reason (if applicable)
- Timestamp of decision
- Registrar's decision notes

---

## 🏢 Venue Management

### 1. View All Auditoriums (GET)
**Endpoint**: `/api/auditoriums/`

**Purpose**: See all available venues and their specifications

**Response Data**:
```json
  [object Object]    id": 1,name": "Main Auditorium",
  description":Large auditorium with 500eating capacity",
   outsider_price:5000    insider_price": 00
]
```

**Required Information**:
- Venue ID and name
- Capacity and facilities
- Current pricing for outsiders
- Current pricing for insiders
- Availability status

###2 Update Auditorium Prices (PUT)
**Endpoint**: `/api/registrar/auditoriums/{id}/prices/`

**Purpose**: Modify venue pricing as needed

**Request Body**:
```json
{
 outsider_price": "60,
  insider_price": "0.00"
}
```

**Required Information**:
- New outsider pricing
- New insider pricing
- Effective date
- Reason for price change

---

## 🎉 Event Management

### 1. Create Public Events (POST)
**Endpoint**: `/api/registrar/events/public/`

**Purpose**: Create university events directly

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

**Required Information**:
- Event name and description
- Venue selection
- Date and time details
- Public/private setting
- Payment requirements
- Event tags/categories

### 2. View Calendar Events (GET)
**Endpoint**: `/api/registrar/calendar-events/`

**Purpose**: See all events for calendar view

**Response Data**:
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
    created_at: 2024-115T10:300
]
```

**Required Information**:
- Event details and scheduling
- Venue assignments
- Organizer information
- Event categories
- Payment status
- Real-time status (upcoming/ongoing)

---

## 💰 Financial Management

### 1. View All Payments (GET)
**Endpoint**: `/api/registrar/payments/`

**Purpose**: Track all payment transactions

**Response Data**:
```json
  [object Object]id: 1,  booking_request: 5,booking_event_name":Tech Conference 2024  requester_name":Jane Smith,   amount: 0
   payment_date: 2024115T10:30:00paystack_transaction_id": "TXN123456789,
    tatus": completed"
  }
]
```

**Required Information**:
- Payment ID and reference
- Associated booking details
- Payment amount and currency
- Payment method and transaction ID
- Payment status and timestamp
- Requester information

### 2. Revenue Reports
**Data Sources**:
- Dashboard statistics
- Payment records
- Booking cost calculations
- Monthly/yearly summaries

**Required Metrics**:
- Total revenue generated
- Revenue by venue
- Revenue by time period
- Outstanding payments
- Payment success rates

---

## 📧 Communication & Notifications

### Required Notifications:
1. **New Booking Requests**: Immediate notification of pending approvals
2. **Payment Confirmations**: Successful payment notifications
3. **Event Reminders**: Upcoming events and venue preparations
4**System Alerts**: Maintenance, capacity issues, or conflicts

### Communication Channels:
- **Email Notifications**: For important decisions and updates
- **In-App Notifications**: Real-time alerts within the system
- **SMS Alerts**: For urgent matters (optional)

---

## 🔍 Search & Filtering

### Booking Search Capabilities:
- **By Requester**: Search by name, email, or organization
- **By Event**: Search by event name or purpose
- **By Date Range**: Filter by booking date or event date
- **By Status**: Filter by approval status
- **By Venue**: Filter by specific auditorium
- **By Amount**: Filter by payment amount range

### Advanced Filters:
- **Insider vs Outsider**: Distinguish between university members and external organizations
- **Payment Status**: Filter by paid/unpaid bookings
- **Event Type**: Public vs private events
- **Time Period**: Today, this week, this month, custom range

---

## 📈 Reporting Requirements

### Daily Reports:
- New booking requests
- Approved/denied bookings
- Revenue generated
- Venue utilization

### Weekly Reports:
- Booking trends
- Revenue summaries
- Popular venues
- Peak booking times

### Monthly Reports:
- Comprehensive financial reports
- Venue performance analysis
- User activity statistics
- System usage metrics

---

## 🔧 System Administration

### User Management:
- **View User Profiles**: Access to user information for verification
- **Role Management**: Assign roles and permissions
- **Account Status**: Monitor active/inactive accounts

### System Settings:
- **Venue Configuration**: Add, edit, or remove venues
- **Pricing Rules**: Set and modify pricing structures
- **Notification Settings**: Configure alert preferences
- **System Maintenance**: Access to system logs and diagnostics

### Data Management:
- **Backup & Recovery**: Access to data backup systems
- **Export Capabilities**: Export reports and data
- **Audit Trails**: Track all administrative actions
- **Data Integrity**: Monitor system health and performance

---

## 🚨 Emergency & Conflict Resolution

### Venue Conflicts:
- **Double Booking Detection**: Identify scheduling conflicts
- **Alternative Venue Suggestions**: Provide backup options
- **Conflict Resolution**: Manual intervention for complex cases

### Payment Issues:
- **Failed Payment Handling**: Process payment retries
- **Refund Management**: Handle refund requests
- **Payment Disputes**: Resolve payment-related issues

### System Issues:
- **Technical Support**: Access to system diagnostics
- **Emergency Contacts**: Direct communication channels
- **Escalation Procedures**: Defined processes for urgent matters

---

## 📱 User Interface Requirements

### Dashboard Features:
- **Real-time Statistics**: Live updates of key metrics
- **Quick Actions**: Fast access to common tasks
- **Alert Center**: Centralized notification management
- **Search Functionality**: Advanced search and filtering

### Booking Management Interface:
- **List View**: All bookings with key information
- **Detail View**: Complete booking information
- **Bulk Actions**: Process multiple bookings at once
- **Status Updates**: Quick approval/denial actions

### Financial Interface:
- **Payment Tracking**: Real-time payment status
- **Revenue Reports**: Visual charts and graphs
- **Export Options**: Download reports in various formats
- **Audit Logs**: Track all financial transactions

---

## 🔐 Security & Compliance

### Data Protection:
- **Personal Information**: Secure handling of user data
- **Financial Data**: PCI compliance for payment information
- **Audit Logs**: Complete action tracking
- **Access Control**: Role-based permissions

### Compliance Requirements:
- **University Policies**: Adherence to institutional guidelines
- **Data Retention**: Proper data storage and deletion
- **Privacy Laws**: GDPR and local privacy regulations
- **Financial Regulations**: Proper financial record keeping

---

## 📞 Support & Training

### Documentation Needs:
- **User Manuals**: Complete system documentation
- **Video Tutorials**: Step-by-step guidance
- **FAQ Section**: Common questions and answers
- **Best Practices**: Recommended workflows

### Training Requirements:
- **System Overview**: Understanding the complete workflow
- **Role-specific Training**: Registrar-specific features
- **Troubleshooting**: Common issues and solutions
- **Advanced Features**: Power user capabilities

---

## 🎯 Performance Requirements

### Response Times:
- **Dashboard Loading**: < 3 seconds
- **Search Results**: < 2 seconds
- **Booking Updates**: < 1 second
- **Report Generation**: < 30 seconds

### System Availability:
- **Uptime**: 990.9 availability
- **Backup Systems**: Redundant data storage
- **Disaster Recovery**: Quick system restoration
- **Maintenance Windows**: Scheduled downtime notifications

---

*This document outlines all the information and capabilities required for the Registrar account to efficiently manage the KEMS booking system. Regular updates and feedback should be incorporated to ensure optimal system performance and user satisfaction.* 