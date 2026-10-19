"""
Evette AI Chatbot Service
Handles OpenAI API integration and event recommendations
"""

import openai
import uuid
import json
from django.conf import settings
from django.contrib.auth import get_user_model
from django.utils import timezone
from django.db.models import Q
from .models import Tag, UserEventPreferences, EvetteConversation
from booking.models import Event

User = get_user_model()

class EvetteService:
    """
    Service class for Evette AI chatbot functionality
    """
    
    def __init__(self):
        self.client = openai.OpenAI(api_key=settings.OPENAI_API_KEY)
        self.model = settings.OPENAI_MODEL
    
    def get_system_prompt(self, user, available_tags, user_preferences=None, upcoming_events=None):
        """Generate system prompt with context about available tags, user, and events"""
        tags_list = ", ".join([tag.name for tag in available_tags])
        
        # Build user context
        user_context = f"Current user: {user.full_name} ({user.role})"
        if user.role == 'student' and user.program:
            user_context += f" - Studying {user.program}"
        elif user.role in ['lecturer', 'registrar'] and user.department:
            user_context += f" - Department: {user.department}"
        
        # Build preferences context
        preferences_context = ""
        if user_preferences and user_preferences.preferred_tags.exists():
            preferred_tags = [tag.name for tag in user_preferences.preferred_tags.all()]
            preferences_context = f"\n\nUSER PREFERENCES: The user is interested in: {', '.join(preferred_tags)}"
        
        # Build events context
        events_context = ""
        if upcoming_events:
            events_context = "\n\nUPCOMING EVENTS AVAILABLE:"
            for event in upcoming_events[:10]:  # Limit to 10 events for context
                event_date = event.date.strftime("%B %d, %Y")
                event_time = f"{event.start_time.strftime('%I:%M %p')} - {event.end_time.strftime('%I:%M %p')}"
                event_tags = [tag.name for tag in event.tags.all()]
                tags_str = f" (Tags: {', '.join(event_tags)})" if event_tags else ""
                
                events_context += f"\n- {event.name} on {event_date} at {event_time} at {event.venue.name}{tags_str}"
                if event.description:
                    # Truncate description to keep context manageable
                    desc = event.description[:150] + "..." if len(event.description) > 150 else event.description
                    events_context += f"\n  Description: {desc}"
        
        system_prompt = f"""You are Evette, a friendly and enthusiastic AI assistant for KEMS (Knowledge Event Management System) at the university. Your main role is to help students discover and get excited about campus events that match their interests.

PERSONALITY:
- Be warm, approachable, and enthusiastic about events
- Use a conversational, friendly tone
- Show genuine interest in helping students find great events
- Be encouraging and positive

{user_context}{preferences_context}

AVAILABLE EVENT CATEGORIES: {tags_list}

{events_context}

YOUR CAPABILITIES:
1. ONBOARDING: For new users, ask about their interests to understand what types of events they'd enjoy
2. EVENT RECOMMENDATIONS: Suggest specific events based on user preferences and available events
3. EVENT DETAILS: Provide detailed information about events including descriptions, dates, times, venues, and tags
4. GENERAL CHAT: Answer questions about events and help with event discovery

ONBOARDING PROCESS (for new users):
1. Greet them warmly and introduce yourself
2. Ask about their interests, hobbies, academic field, or what they like to do
3. Map their responses to the available event categories
4. Confirm their preferences and let them know you'll use this to recommend events

EVENT RECOMMENDATION GUIDELINES:
- When recommending events, mention specific event names, dates, and key details
- Use event descriptions to explain why an event might interest the user
- Consider the user's preferences and academic background
- Mention venue locations and timing details
- Highlight events that match multiple user interests
- If asked for a specific type of event, search through available events and recommend the best matches

IMPORTANT GUIDELINES:
- Keep responses concise and engaging
- Always stay focused on events and the university experience  
- If asked about topics unrelated to events, politely redirect to event-related topics
- When recommending categories, only suggest from the available list: {tags_list}
- Be helpful but don't make up information about specific events
- Use the actual event data provided to give accurate recommendations
- If a user asks for events in a specific category, search through the available events and recommend relevant ones
"""
        return system_prompt
    
    def get_upcoming_events(self, limit=20):
        """Get upcoming events with full details for AI context"""
        try:
            upcoming_events = Event.objects.filter(
                is_public=True,
                date__gte=timezone.now().date()
            ).select_related('venue', 'organizer').prefetch_related('tags', 'images').order_by('date', 'start_time')[:limit]
            
            return upcoming_events
        except Exception as e:
            print(f"Error fetching upcoming events: {e}")
            return []
    
    def search_events_by_query(self, query, user_preferences=None, limit=10):
        """Search events based on user query and preferences"""
        try:
            # Build search query
            search_terms = query.lower().split()
            
            # Start with all public upcoming events
            events = Event.objects.filter(
                is_public=True,
                date__gte=timezone.now().date()
            ).select_related('venue', 'organizer').prefetch_related('tags', 'images')
            
            # Filter by search terms
            filtered_events = []
            for event in events:
                score = 0
                
                # Check event name
                if any(term in event.name.lower() for term in search_terms):
                    score += 3
                
                # Check description
                if any(term in event.description.lower() for term in search_terms):
                    score += 2
                
                # Check tags
                event_tags = [tag.name.lower() for tag in event.tags.all()]
                if any(term in event_tags for term in search_terms):
                    score += 2
                
                # Check venue
                if any(term in event.venue.name.lower() for term in search_terms):
                    score += 1
                
                # Bonus points for matching user preferences
                if user_preferences and user_preferences.preferred_tags.exists():
                    user_tag_names = set(tag.name.lower() for tag in user_preferences.preferred_tags.all())
                    event_tag_names = set(tag.name.lower() for tag in event.tags.all())
                    if user_tag_names.intersection(event_tag_names):
                        score += 1
                
                if score > 0:
                    filtered_events.append((event, score))
            
            # Sort by score (descending) then by date (ascending)
            filtered_events.sort(key=lambda x: (-x[1], x[0].date))
            
            # Return top events up to limit
            return [event for event, score in filtered_events[:limit]]
            
        except Exception as e:
            print(f"Error searching events: {e}")
            return []
    
    def get_or_create_session_id(self, user):
        """Get or create a session ID for the user's current conversation"""
        # For simplicity, we'll use one session per day
        today = timezone.now().date()
        session_id = f"{user.id}_{today.isoformat()}"
        return session_id
    
    def get_conversation_history(self, user, session_id, limit=10):
        """Get recent conversation history for context"""
        conversations = EvetteConversation.objects.filter(
            user=user,
            session_id=session_id
        ).order_by('-timestamp')[:limit]
        
        # Convert to OpenAI format (reverse order for chronological)
        history = []
        for conv in reversed(conversations):
            history.append({
                "role": conv.role,
                "content": conv.message
            })
        
        return history
    
    def save_conversation(self, user, session_id, role, message, is_onboarding=False):
        """Save a conversation message to database"""
        EvetteConversation.objects.create(
            user=user,
            role=role,
            message=message,
            session_id=session_id,
            is_onboarding=is_onboarding
        )
    
    def extract_preferences_from_response(self, ai_response, available_tags):
        """Extract user preferences from AI conversation and map to available tags"""
        preferences = []
        
        # Simple keyword matching - could be enhanced with more sophisticated NLP
        response_lower = ai_response.lower()
        
        for tag in available_tags:
            tag_lower = tag.name.lower()
            # Check for exact matches or common variations
            keywords = [tag_lower]
            
            # Add common variations
            if 'engineering' in tag_lower:
                keywords.extend(['tech', 'technology', 'coding', 'programming', 'computer'])
            elif 'sports' in tag_lower:
                keywords.extend(['sport', 'athletic', 'fitness', 'game', 'exercise'])
            elif 'arts' in tag_lower:
                keywords.extend(['art', 'creative', 'music', 'dance', 'theater', 'painting'])
            elif 'business' in tag_lower:
                keywords.extend(['entrepreneurship', 'finance', 'marketing', 'management'])
            elif 'science' in tag_lower:
                keywords.extend(['research', 'lab', 'experiment', 'biology', 'chemistry', 'physics'])
            
            # Check if any keywords match
            if any(keyword in response_lower for keyword in keywords):
                preferences.append(tag)
        
        return preferences
    
    def generate_mock_response(self, user, message, preferences, available_tags, conversation_count, upcoming_events=None):
        """Generate mock responses for testing without OpenAI API"""
        
        # Check if this is the first interaction
        if conversation_count == 0:
            return f"""Hi there, {user.full_name}! 👋 

I'm Evette, your personal event discovery assistant at KEMS! I'm here to help you find amazing events that match your interests.

To get started, I'd love to learn more about you! What kind of activities, subjects, or events are you most interested in? For example:
- Are you into technology, sports, arts, or business?
- What's your field of study?
- What do you like to do in your free time?

Tell me about your interests, and I'll help you discover events you'll love! ✨"""

        # Check if user is asking about specific events
        message_lower = message.lower()
        
        # If user asks about events, provide specific recommendations
        if any(word in message_lower for word in ['event', 'events', 'what', 'show', 'recommend', 'suggestion']):
            if upcoming_events:
                # Provide specific event recommendations
                relevant_events = upcoming_events[:3]  # Show top 3 events
                response = "Great question! Here are some upcoming events you might be interested in:\n\n"
                
                for event in relevant_events:
                    event_date = event.date.strftime("%B %d, %Y")
                    event_time = f"{event.start_time.strftime('%I:%M %p')} - {event.end_time.strftime('%I:%M %p')}"
                    event_tags = [tag.name for tag in event.tags.all()]
                    tags_str = f" (Tags: {', '.join(event_tags)})" if event_tags else ""
                    
                    response += f"🎯 **{event.name}**\n"
                    response += f"📅 {event_date} at {event_time}\n"
                    response += f"📍 {event.venue.name}{tags_str}\n"
                    if event.description:
                        desc = event.description[:100] + "..." if len(event.description) > 100 else event.description
                        response += f"📝 {desc}\n"
                    response += "\n"
                
                response += "Would you like me to tell you more about any of these events, or would you prefer to see events in a specific category?"
                return response
        
        # Mock responses for different types of user input
        if any(word in message_lower for word in ['technology', 'tech', 'computer', 'programming', 'coding']):
            if not preferences.onboarding_completed:
                preferences.preferred_tags.add(*available_tags.filter(name__icontains='Technology'))
                preferences.preferred_tags.add(*available_tags.filter(name__icontains='Computer Science'))
                if conversation_count >= 4:
                    preferences.onboarding_completed = True
                    preferences.save()
            return """That's awesome! I can see you're interested in technology and computer science! 🔧💻

I've noted your interests in technology and computer science. This means I'll recommend events like:
- Tech workshops and coding bootcamps
- Innovation conferences
- Engineering seminars
- Computer science research presentations

What other subjects or activities interest you? Are you into any sports, arts, or social activities?"""

        elif any(word in message_lower for word in ['sports', 'sport', 'athletic', 'fitness', 'game']):
            if not preferences.onboarding_completed:
                preferences.preferred_tags.add(*available_tags.filter(name__icontains='Sports'))
                if conversation_count >= 4:
                    preferences.onboarding_completed = True
                    preferences.save()
            return """Great choice! Sports and fitness are fantastic for staying healthy and meeting people! ⚽🏃‍♂️

I've added sports to your interests. This means you'll see events like:
- Athletic competitions and tournaments
- Fitness workshops and training sessions
- Sports club meetups
- Outdoor adventure activities

Any other interests you'd like to share? Perhaps academic subjects or creative activities?"""

        elif any(word in message_lower for word in ['arts', 'art', 'creative', 'music', 'dance']):
            if not preferences.onboarding_completed:
                preferences.preferred_tags.add(*available_tags.filter(name__icontains='Arts'))
                preferences.preferred_tags.add(*available_tags.filter(name__icontains='Cultural'))
                if conversation_count >= 4:
                    preferences.onboarding_completed = True
                    preferences.save()
            return """How wonderful! The arts bring so much beauty and creativity to life! 🎨🎵

I've noted your interest in arts and cultural activities. You'll see events like:
- Art exhibitions and gallery openings
- Music concerts and performances
- Dance workshops and shows
- Cultural celebrations and festivals

What else catches your interest? Any academic fields or other hobbies?"""

        elif any(word in message_lower for word in ['business', 'entrepreneurship', 'marketing', 'finance']):
            if not preferences.onboarding_completed:
                preferences.preferred_tags.add(*available_tags.filter(name__icontains='Business'))
                preferences.preferred_tags.add(*available_tags.filter(name__icontains='Professional'))
                if conversation_count >= 4:
                    preferences.onboarding_completed = True
                    preferences.save()
            return """Excellent! Business and entrepreneurship are key to innovation and growth! 💼📈

I've added business and professional development to your interests. You'll see:
- Business conferences and networking events
- Entrepreneurship workshops
- Professional development seminars
- Marketing and finance training sessions

Are there any other areas you're passionate about?"""

        elif preferences.onboarding_completed:
            # Post-onboarding responses
            responses = [
                f"That's interesting! Based on your preferences, I think you'd really enjoy some of the upcoming events I've found. Check out the 'Events for You' tab to see my personalized recommendations! ✨",
                f"I love chatting with you! Have you checked out the events I've recommended for you? They're tailored specifically to your interests in {', '.join([tag.name for tag in preferences.preferred_tags.all()[:3]])}! 🎯",
                f"You know what? I think there might be some great {preferences.preferred_tags.first().name.lower()} events coming up that you'd love! Take a look at my recommendations! 🌟",
                f"Thanks for sharing! I'm always learning more about what you like. Make sure to check your personalized event recommendations - they're handpicked just for you! 💫"
            ]
            import random
            return random.choice(responses)
        
        else:
            # General encouragement during onboarding
            return f"""That's great to know! I'm getting a better sense of your interests. 

The more you tell me about what you enjoy, the better I can recommend events that you'll love attending! 

Feel free to mention any subjects you study, hobbies you have, or activities you enjoy. I have access to events in categories like: {', '.join([tag.name for tag in available_tags[:8]])} and many more!

What else would you like to share about your interests? 🤔"""
    
    def chat_with_evette_sync(self, user, message):
        """Main chat function that handles conversation with Evette"""
        try:
            # Get available tags
            available_tags = Tag.objects.all()
            
            # Get or create user preferences
            preferences, created = UserEventPreferences.objects.get_or_create(user=user)
            
            # Get upcoming events for context
            upcoming_events = self.get_upcoming_events(limit=15)
            
            # Get session ID
            session_id = self.get_or_create_session_id(user)
            
            # Save user message
            self.save_conversation(
                user=user, 
                session_id=session_id, 
                role='user', 
                message=message,
                is_onboarding=not preferences.onboarding_completed
            )
            
            # Get conversation history
            conversation_history = self.get_conversation_history(user, session_id)
            
            # Try real OpenAI API first, fallback to mock if it fails
            try:
                if settings.OPENAI_API_KEY and settings.OPENAI_API_KEY.startswith('sk-'):
                    # Build messages for OpenAI
                    messages = [
                        {"role": "system", "content": self.get_system_prompt(user, available_tags, preferences, upcoming_events)}
                    ]
                    
                    # Add conversation history
                    messages.extend(conversation_history)
                    
                    # Add current user message
                    messages.append({"role": "user", "content": message})
                    
                    # Get AI response
                    response = self.client.chat.completions.create(
                        model=self.model,
                        messages=messages,
                        max_tokens=400,  # Increased for more detailed responses
                        temperature=0.7
                    )
                    
                    ai_message = response.choices[0].message.content
                else:
                    # Fallback to mock if no valid API key
                    ai_message = self.generate_mock_response(user, message, preferences, available_tags, len(conversation_history), upcoming_events)
            except Exception as e:
                # If OpenAI API fails, use mock response
                print(f"OpenAI API failed, using mock response: {e}")
                ai_message = self.generate_mock_response(user, message, preferences, available_tags, len(conversation_history), upcoming_events)
            
            # Save AI response
            self.save_conversation(
                user=user,
                session_id=session_id,
                role='assistant',
                message=ai_message,
                is_onboarding=not preferences.onboarding_completed
            )
            
            # If this is onboarding, try to extract preferences
            if not preferences.onboarding_completed:
                extracted_preferences = self.extract_preferences_from_response(message, available_tags)
                if extracted_preferences:
                    preferences.preferred_tags.add(*extracted_preferences)
                
                # Check if we should mark onboarding as complete
                # This could be enhanced with more sophisticated logic
                if len(conversation_history) >= 6:  # After a few exchanges
                    preferences.onboarding_completed = True
                    preferences.save()
            
            return {
                'success': True,
                'message': ai_message,
                'is_onboarding': not preferences.onboarding_completed,
                'preferences_count': preferences.preferred_tags.count()
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
    
    def get_personalized_events(self, user, limit=10):
        """Get personalized event recommendations based on user preferences"""
        try:
            preferences = UserEventPreferences.objects.get(user=user)
            
            if not preferences.preferred_tags.exists():
                # Return empty list if no preferences set - frontend will show tag selection
                return []
            else:
                # Get events matching user's preferred tags with priority scoring
                preferred_tag_ids = list(preferences.preferred_tags.values_list('id', flat=True))
                
                # Get events that match user's preferred tags
                events = Event.objects.filter(
                    is_public=True,
                    date__gte=timezone.now().date(),
                    tags__in=preferred_tag_ids
                ).distinct().prefetch_related('tags', 'images').select_related('venue')
                
                # Score events based on how many of user's preferred tags they match
                scored_events = []
                for event in events:
                    event_tag_ids = set(event.tags.values_list('id', flat=True))
                    match_score = len(event_tag_ids.intersection(set(preferred_tag_ids)))
                    scored_events.append((event, match_score))
                
                # Sort by match score (descending) then by date (ascending)
                scored_events.sort(key=lambda x: (-x[1], x[0].date))
                
                # Return top events up to limit
                recommended_events = [event for event, score in scored_events[:limit]]
                
                # If we don't have enough tagged events, fill with other recent public events
                if len(recommended_events) < limit:
                    additional_events = Event.objects.filter(
                        is_public=True,
                        date__gte=timezone.now().date()
                    ).exclude(
                        id__in=[event.id for event in recommended_events]
                    ).order_by('date')[:limit - len(recommended_events)]
                    
                    recommended_events.extend(list(additional_events))
                
                return recommended_events
            
        except UserEventPreferences.DoesNotExist:
            # Return empty list for users without preferences - frontend will show tag selection
            return []