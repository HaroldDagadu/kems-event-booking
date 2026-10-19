import React, { useState } from 'react'
import { Card, CardBody, CardHeader, Typography, Button, Checkbox, Alert } from '@material-tailwind/react'
import { CheckCircle, AlertTriangle, FileText } from 'lucide-react'

const TermsAcceptance = ({ 
  terms, 
  isAccepted, 
  onAccept, 
  loading = false, 
  venueName = "this venue" 
}) => {
  const [accepted, setAccepted] = useState(false)

  const handleAccept = () => {
    if (accepted) {
      onAccept()
    }
  }

  if (isAccepted) {
    return (
      <Card className="mb-6">
        <CardBody className="text-center py-6">
          <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
          <Typography variant="h6" color="green" className="mb-2">
            Terms and Conditions Accepted
          </Typography>
          <Typography color="gray" className="text-sm">
            You have accepted the terms and conditions for {venueName}. 
            You can now proceed with payment.
          </Typography>
        </CardBody>
      </Card>
    )
  }

  if (!terms || terms.trim() === '') {
    return null // Don't show anything if there are no terms
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <Typography variant="h5" color="blue-gray" className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Terms and Conditions
        </Typography>
        <Typography color="gray" className="text-sm mt-1">
          Please read and accept the terms and conditions for {venueName}
        </Typography>
      </CardHeader>
      <CardBody>
        <Alert color="orange" className="mb-4">
          <AlertTriangle className="h-4 w-4" />
          You must accept the terms and conditions before proceeding with payment.
        </Alert>

        {/* Terms Content */}
        <div className="bg-gray-50 p-4 rounded-lg mb-4 max-h-64 overflow-y-auto border">
          <Typography className="text-sm whitespace-pre-wrap">
            {terms}
          </Typography>
        </div>

        {/* Acceptance Checkbox */}
        <div className="flex items-start gap-3 mb-4">
          <Checkbox
            id="terms-acceptance"
            checked={accepted}
            onChange={(e) => setAccepted(e.target.checked)}
            color="blue"
            className="mt-1"
          />
          <label htmlFor="terms-acceptance" className="cursor-pointer">
            <Typography className="text-sm">
              I have read and agree to the terms and conditions for booking {venueName}. 
              I understand that by accepting these terms, I agree to comply with all 
              venue policies and regulations.
            </Typography>
          </label>
        </div>

        {/* Accept Button */}
        <Button
          onClick={handleAccept}
          disabled={!accepted || loading}
          color="blue"
          className="w-full"
          loading={loading}
        >
          {loading ? 'Accepting Terms...' : 'Accept Terms and Conditions'}
        </Button>

        <Typography color="gray" className="text-xs mt-3 text-center">
          By accepting these terms, you acknowledge that you have read, understood, 
          and agree to be bound by all conditions set forth above.
        </Typography>
      </CardBody>
    </Card>
  )
}

export default TermsAcceptance