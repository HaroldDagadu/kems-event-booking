import React from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { ROUTES } from '../utils/constants'

function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-muted-foreground">404</h1>
        <h2 className="text-2xl font-semibold mt-4 mb-2">Page Not Found</h2>
        <p className="text-muted-foreground mb-6">
          The page you're looking for doesn't exist.
        </p>
        <Link to={ROUTES.DASHBOARD}>
          <Button>Go to Dashboard</Button>
        </Link>
      </div>
    </div>
  )
}

export default NotFoundPage 