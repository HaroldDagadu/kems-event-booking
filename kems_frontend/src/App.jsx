import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { ThemeProvider } from '@material-tailwind/react'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { ToastProvider } from './contexts/ToastContext'
import { ROUTES, USER_ROLES } from './utils/constants'
import Layout from './components/common/Layout'
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'
import OutsiderLoginPage from './pages/auth/OutsiderLoginPage'
import OutsiderBookingPage from './pages/booking/OutsiderBookingPage'
import OutsiderDashboard from './pages/dashboard/OutsiderDashboard'
import PublicEventsPage from './pages/events/PublicEventsPage'
import ProfilePage from './pages/ProfilePage'
import StudentDashboard from './pages/student/StudentDashboard'
import StudentBookVenuePage from './pages/student/StudentBookVenuePage'
import StudentBookingsPage from './pages/student/StudentBookingsPage'
import StudentLayout from './components/student/StudentLayout'
import RegistrarDashboard from './pages/registrar/RegistrarDashboard'
import InsiderBookingPage from './pages/booking/InsiderBookingPage'
import BookingStatusPage from './pages/booking/BookingStatusPage'
import EventsForYouPage from './pages/events/EventsForYouPage'
import InvitedEventsPage from './pages/events/InvitedEventsPage'
import RegistrarEventsPage from './pages/registrar/RegistrarEventsPage'
import RegistrarEventsForYou from './pages/registrar/RegistrarEventsForYou'
import RegistrarInvitedEvents from './pages/registrar/RegistrarInvitedEvents'
import RegistrarAllEvents from './pages/registrar/RegistrarAllEvents'
import NotFoundPage from './pages/NotFoundPage'
import PaymentPage from './pages/payment/PaymentPage'
import PaymentVerifyPage from './pages/payment/PaymentVerifyPage'
import AuthChecker from './components/common/AuthChecker'
import ErrorBoundary from './components/common/ErrorBoundary'
import ProtectedRoute from './components/common/ProtectedRoute'

// Dashboard Route Component
function DashboardRoute() {
  const { user } = useAuth()
  
  if (!user) return <Navigate to={ROUTES.LOGIN} replace />
  
  switch (user.role) {
    case USER_ROLES.STUDENT:
    case USER_ROLES.LECTURER:
      return <Navigate to="/academic/dashboard" replace />
    case USER_ROLES.REGISTRAR:
      return <Navigate to="/registrar/dashboard" replace />
    default:
      return <Navigate to={ROUTES.LOGIN} replace />
  }
}

// Home Route Component
function HomeRoute() {
  const { isAuthenticated, user } = useAuth()
  
  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} replace />
  }
  
  // Redirect to appropriate dashboard
  return <Navigate to={ROUTES.DASHBOARD} replace />
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path={ROUTES.LOGIN} element={<LoginPage />} />
      <Route path={ROUTES.REGISTER} element={<RegisterPage />} />
      <Route path="/outsider-login" element={<OutsiderLoginPage />} />
      <Route path="/outsider-dashboard" element={<OutsiderDashboard />} />
      <Route path={ROUTES.BOOKING.OUTSIDER} element={<OutsiderBookingPage />} />
      <Route path={ROUTES.EVENTS.PUBLIC} element={<PublicEventsPage />} />
      <Route path="/payment" element={<PaymentPage />} />
      <Route path="/payment/:bookingId" element={<PaymentPage />} />
      <Route path="/payment/:bookingId/verify" element={<PaymentVerifyPage />} />
      
      {/* Academic Routes - For Students, Lecturers, and Registrars */}
      <Route path="/academic/*" element={
        <ProtectedRoute allowedRoles={[USER_ROLES.STUDENT, USER_ROLES.LECTURER, USER_ROLES.REGISTRAR]}>
          <StudentLayout />
        </ProtectedRoute>
      }>
        <Route path="dashboard" element={<StudentDashboard />} />
        <Route path="book-venue" element={<StudentBookVenuePage />} />
        <Route path="my-bookings" element={<StudentBookingsPage />} />
        <Route path="booking/create" element={<InsiderBookingPage />} />
        <Route path="booking/status" element={<BookingStatusPage />} />
      </Route>
      
      {/* Legacy Student Routes - Redirect to Academic */}
      <Route path="/student/*" element={
        <ProtectedRoute allowedRoles={[USER_ROLES.STUDENT, USER_ROLES.LECTURER, USER_ROLES.REGISTRAR]}>
          <Navigate to="/academic/dashboard" replace />
        </ProtectedRoute>
      } />
      
      {/* Protected Routes */}
      <Route path="/" element={<Layout />}>
        <Route index element={<HomeRoute />} />
        <Route path={ROUTES.DASHBOARD} element={<DashboardRoute />} />
        <Route path={ROUTES.PROFILE} element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        } />
        
        {/* Legacy Booking Routes - Redirect to Academic */}
        <Route path={ROUTES.BOOKING.CREATE} element={
          <ProtectedRoute allowedRoles={[USER_ROLES.STUDENT, USER_ROLES.LECTURER, USER_ROLES.REGISTRAR]}>
            <Navigate to="/academic/booking/create" replace />
          </ProtectedRoute>
        } />
        <Route path={ROUTES.BOOKING.STATUS} element={
          <ProtectedRoute allowedRoles={[USER_ROLES.STUDENT, USER_ROLES.LECTURER, USER_ROLES.REGISTRAR]}>
            <Navigate to="/academic/booking/status" replace />
          </ProtectedRoute>
        } />
        
        {/* Event Routes */}
        <Route path={ROUTES.EVENTS.FOR_YOU} element={
          <ProtectedRoute allowedRoles={[USER_ROLES.STUDENT, USER_ROLES.LECTURER, USER_ROLES.REGISTRAR]}>
            <EventsForYouPage />
          </ProtectedRoute>
        } />
        <Route path={ROUTES.EVENTS.INVITED} element={
          <ProtectedRoute allowedRoles={[USER_ROLES.STUDENT, USER_ROLES.LECTURER, USER_ROLES.REGISTRAR]}>
            <InvitedEventsPage />
          </ProtectedRoute>
        } />
        
        
        {/* Registrar Routes */}
        <Route path="/registrar/*" element={
          <ProtectedRoute allowedRoles={[USER_ROLES.REGISTRAR]}>
            <Routes>
              <Route path="dashboard" element={
                <ThemeProvider>
                  <RegistrarDashboard />
                </ThemeProvider>
              } />
              <Route path="bookings" element={<div>Registrar Bookings Management</div>} />
              <Route path="payments" element={<div>Registrar Payments</div>} />
              <Route path="events" element={
                <ThemeProvider>
                  <RegistrarEventsPage />
                </ThemeProvider>
              } />
              <Route path="calendar" element={<div>Registrar Calendar</div>} />
              <Route path="venues" element={<div>Registrar Venues</div>} />
              <Route path="events/for-you" element={
                <ThemeProvider>
                  <RegistrarEventsForYou />
                </ThemeProvider>
              } />
              <Route path="events/invited" element={
                <ThemeProvider>
                  <RegistrarInvitedEvents />
                </ThemeProvider>
              } />
              <Route path="events/all" element={
                <ThemeProvider>
                  <RegistrarAllEvents />
                </ThemeProvider>
              } />
            </Routes>
          </ProtectedRoute>
        } />
      </Route>
      
      {/* 404 Route */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}

function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <AuthProvider>
          <Router>
            <AuthChecker />
            <div className="min-h-screen bg-background">
              <AppRoutes />
            </div>
          </Router>
        </AuthProvider>
      </ToastProvider>
    </ErrorBoundary>
  )
}

export default App 