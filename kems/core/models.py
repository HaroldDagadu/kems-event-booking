from django.db import models
from django.conf import settings

# Create your models here.


class Tag(models.Model):
    """
    Tag model for categorizing public events
    Used for filtering and recommendations in "Events for You"
    """
    
    name = models.CharField(
        max_length=50, 
        unique=True,
        help_text="Name of the tag (e.g., 'Engineering', 'Sports', 'Arts')"
    )
    
    class Meta:
        verbose_name = 'Tag'
        verbose_name_plural = 'Tags'
        ordering = ['name']
    
    def __str__(self):
        return self.name
    
    def clean(self):
        """Normalize tag name to title case"""
        if self.name:
            self.name = self.name.strip().title()
    
    def save(self, *args, **kwargs):
        """Override save to run clean validation"""
        self.full_clean()
        super().save(*args, **kwargs)


class SavedEvent(models.Model):
    """
    Model to track events saved by users as favorites
    """
    
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='saved_events',
        help_text="User who saved the event"
    )
    
    event = models.ForeignKey(
        'booking.Event',
        on_delete=models.CASCADE,
        related_name='saved_by_users',
        help_text="Event that was saved"
    )
    
    saved_at = models.DateTimeField(
        auto_now_add=True,
        help_text="When the event was saved"
    )
    
    class Meta:
        verbose_name = 'Saved Event'
        verbose_name_plural = 'Saved Events'
        unique_together = ['user', 'event']  # Prevent duplicate saves
        ordering = ['-saved_at']  # Most recently saved first
    
    def __str__(self):
        return f"{self.user.full_name} saved {self.event.name}"


class UserEventPreferences(models.Model):
    """
    Model to store user preferences for event recommendations
    Used by Evette AI chatbot to personalize recommendations
    """
    
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='event_preferences',
        help_text="User whose preferences are stored"
    )
    
    preferred_tags = models.ManyToManyField(
        Tag,
        blank=True,
        related_name='preferred_by_users',
        help_text="Tags/categories the user is interested in"
    )
    
    onboarding_completed = models.BooleanField(
        default=False,
        help_text="Whether the user has completed Evette's onboarding questions"
    )
    
    last_updated = models.DateTimeField(
        auto_now=True,
        help_text="When preferences were last updated"
    )
    
    created_at = models.DateTimeField(
        auto_now_add=True,
        help_text="When preferences were first created"
    )
    
    class Meta:
        verbose_name = 'User Event Preference'
        verbose_name_plural = 'User Event Preferences'
        ordering = ['-last_updated']
    
    def __str__(self):
        return f"{self.user.full_name}'s event preferences"


class EvetteConversation(models.Model):
    """
    Model to store conversations between users and Evette AI chatbot
    """
    
    ROLE_CHOICES = [
        ('user', 'User'),
        ('assistant', 'Evette'),
        ('system', 'System'),
    ]
    
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='evette_conversations',
        help_text="User participating in the conversation"
    )
    
    role = models.CharField(
        max_length=10,
        choices=ROLE_CHOICES,
        help_text="Who sent this message"
    )
    
    message = models.TextField(
        help_text="Content of the message"
    )
    
    timestamp = models.DateTimeField(
        auto_now_add=True,
        help_text="When the message was sent"
    )
    
    session_id = models.CharField(
        max_length=100,
        help_text="Session ID to group related messages",
        db_index=True
    )
    
    is_onboarding = models.BooleanField(
        default=False,
        help_text="Whether this message is part of the initial onboarding"
    )
    
    class Meta:
        verbose_name = 'Evette Conversation'
        verbose_name_plural = 'Evette Conversations'
        ordering = ['timestamp']
    
    def __str__(self):
        return f"{self.role}: {self.message[:50]}..."
