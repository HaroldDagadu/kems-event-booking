import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useApi } from '../../hooks/useApi';
import { eventsService } from '../../services/events';
import { Calendar, Clock, MapPin, Users, Mail, CheckCircle, XCircle, AlertCircle, Eye, Settings } from 'lucide-react';

function RegistrarInvitedEvents() {
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedInvitation, setSelectedInvitation] = useState(null);

  // Fetch invited events for registrar
  const { execute: fetchInvitations, loading: invitationsLoading } = useApi(eventsService.getInvitedEvents);
  const { execute: respondToInvitation, loading: responseLoading } = useApi(eventsService.respondToInvitation);

  useEffect(() => {
    const loadInvitations = async () => {
      try {
        setLoading(true);
        const response = await fetchInvitations();
        if (response.success) {
          setInvitations(response.data);
        }
      } catch (error) {
        console.error('Error loading invitations:', error);
      } finally {
        setLoading(false);
      }
    };

    loadInvitations();
  }, []);

  const handleRespondToInvitation = async (invitationId, status) => {
    try {
      const response = await respondToInvitation(invitationId, { status });
      if (response.success) {
        setInvitations(prev => 
          prev.map(inv => 
            inv.id === invitationId 
              ? { ...inv, status: status }
              : inv
          )
        );
      }
    } catch (error) {
      console.error('Error responding to invitation:', error);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'accepted': return 'text-green-600 bg-green-100';
      case 'declined': return 'text-red-600 bg-red-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'accepted': return <CheckCircle className="w-4 h-4" />;
      case 'declined': return <XCircle className="w-4 h-4" />;
      case 'pending': return <Clock className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  const handleManageEvent = (event) => {
    // Navigate to event management page
    console.log('Manage event:', event);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Invited Events</h1>
        <p className="text-muted-foreground">Private events you've been invited to attend as Registrar</p>
      </div>

      {invitations.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Mail className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Invitations</h3>
            <p className="text-muted-foreground">
              You haven't received any event invitations yet.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {invitations.map((invitation) => (
            <Card key={invitation.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg mb-2">{invitation.event.name}</CardTitle>
                    <div className="flex items-center gap-2 mb-2">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(invitation.status)}`}>
                        {invitation.status}
                      </span>
                    </div>
                  </div>
                  {getStatusIcon(invitation.status)}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">{invitation.event.description}</p>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span>{invitation.event.date}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span>{invitation.event.start_time} - {invitation.event.end_time}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <span>{invitation.event.venue_name}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    <span>Organized by {invitation.event.organizer_name}</span>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  {invitation.status === 'pending' && (
                    <div className="flex gap-1">
                      <Button 
                        size="sm" 
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() => handleRespondToInvitation(invitation.id, 'accepted')}
                        disabled={responseLoading}
                      >
                        <CheckCircle className="w-3 h-3" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="text-red-600 border-red-600 hover:bg-red-50"
                        onClick={() => handleRespondToInvitation(invitation.id, 'declined')}
                        disabled={responseLoading}
                      >
                        <XCircle className="w-3 h-3" />
                      </Button>
                    </div>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleManageEvent(invitation.event)}
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    Manage
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default RegistrarInvitedEvents; 