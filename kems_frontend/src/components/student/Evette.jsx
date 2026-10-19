import React, { useState, useEffect, useRef } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { useApi } from '../../hooks/useApi'
import { evetteService } from '../../services/evette'
import { 
  Send, 
  Bot, 
  User,
  Heart,
  Settings,
  Sparkles,
  MessageCircle,
  Loader
} from 'lucide-react'

// Import Evette images
import EvetteAI from '../../evette/evette ai.jpeg'
import EvetteWinking from '../../evette/evvettedone.jpeg'
import EvetteTalking from '../../evette/evvettetalking.jpeg'

const Evette = () => {
  const [messages, setMessages] = useState([])
  const [inputMessage, setInputMessage] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [isOnboarding, setIsOnboarding] = useState(false)
  const [preferences, setPreferences] = useState(null)
  const [evetteImage, setEvetteImage] = useState(EvetteAI)
  const messagesEndRef = useRef(null)

  // API hooks
  const { execute: sendMessage, loading: sendingMessage } = useApi(evetteService.sendMessage)
  const { execute: getHistory, loading: loadingHistory } = useApi(evetteService.getConversationHistory)
  const { execute: getPreferences, loading: loadingPreferences } = useApi(evetteService.getUserPreferences)

  // Scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Load conversation history and user preferences
  useEffect(() => {
    loadConversationData()
  }, [])

  const loadConversationData = async () => {
    try {
      // Load conversation history
      const historyResponse = await getHistory()
      if (historyResponse.success) {
        const formattedMessages = historyResponse.data.conversations.map(conv => ({
          role: conv.role,
          content: conv.message,
          timestamp: conv.timestamp,
          isOnboarding: conv.is_onboarding
        }))
        setMessages(formattedMessages)
      }

      // Load user preferences
      const prefsResponse = await getPreferences()
      if (prefsResponse.success) {
        setPreferences(prefsResponse.data)
        setIsOnboarding(!prefsResponse.data.onboarding_completed)
        
        // If no conversation history and not onboarded, start with welcome message
        if ((!historyResponse.success || historyResponse.data.conversations.length === 0) && !prefsResponse.data.onboarding_completed) {
          startOnboarding()
        }
      }
    } catch (error) {
      console.error('Error loading conversation data:', error)
    }
  }

  const startOnboarding = () => {
    const welcomeMessage = {
      role: 'assistant',
      content: `Hi there! 👋 I'm Evette, your personal event discovery assistant at KEMS! I'm here to help you find amazing events that match your interests.

To get started, I'd love to learn more about you! What kind of activities, subjects, or events are you most interested in? For example:
- Are you into technology, sports, arts, or business?
- What's your field of study?
- What do you like to do in your free time?

Tell me about your interests, and I'll help you discover events you'll love! ✨`,
      timestamp: new Date().toISOString(),
      isOnboarding: true
    }
    setMessages([welcomeMessage])
    setEvetteImage(EvetteTalking)
    setTimeout(() => setEvetteImage(EvetteAI), 2000)
  }

  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (!inputMessage.trim() || sendingMessage) return

    const userMessage = {
      role: 'user',
      content: inputMessage.trim(),
      timestamp: new Date().toISOString()
    }

    // Add user message to UI immediately
    setMessages(prev => [...prev, userMessage])
    setInputMessage('')
    setIsTyping(true)
    setEvetteImage(EvetteTalking)

    try {
      // Send message to backend
      const response = await sendMessage({ message: inputMessage.trim() })
      
      if (response.success) {
        const assistantMessage = {
          role: 'assistant',
          content: response.data.message,
          timestamp: new Date().toISOString(),
          isOnboarding: response.data.is_onboarding
        }
        
        // Add assistant message with typing effect
        setTimeout(() => {
          setMessages(prev => [...prev, assistantMessage])
          setIsOnboarding(response.data.is_onboarding)
          setIsTyping(false)
          setEvetteImage(response.data.is_onboarding ? EvetteWinking : EvetteAI)
        }, 1000)
        
      } else {
        // Handle error
        const errorMessage = {
          role: 'assistant',
          content: 'Sorry, I encountered an error. Please try again!',
          timestamp: new Date().toISOString()
        }
        setTimeout(() => {
          setMessages(prev => [...prev, errorMessage])
          setIsTyping(false)
          setEvetteImage(EvetteAI)
        }, 1000)
      }
    } catch (error) {
      console.error('Error sending message:', error)
      setIsTyping(false)
      setEvetteImage(EvetteAI)
    }
  }

  const MessageBubble = ({ message }) => {
    const isUser = message.role === 'user'
    const isSystem = message.role === 'system'
    
    return (
      <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4 w-full`}>
        {!isUser && (
          <div className="flex-shrink-0 mr-3">
            <img 
              src={evetteImage} 
              alt="Evette" 
              className="w-8 h-8 rounded-full object-cover border-2 border-pink-200"
            />
          </div>
        )}
        
        <div className={`max-w-[70%] px-4 py-2 rounded-lg break-words ${
          isUser 
            ? 'bg-blue-500 text-white' 
            : isSystem 
              ? 'bg-gray-100 text-gray-600 text-sm'
              : 'bg-gray-100 text-gray-800'
        }`}>
          <div className="whitespace-pre-wrap break-words">{message.content}</div>
          {message.timestamp && (
            <div className={`text-xs mt-1 ${
              isUser ? 'text-blue-100' : 'text-gray-500'
            }`}>
              {new Date(message.timestamp).toLocaleTimeString()}
            </div>
          )}
        </div>
        
        {isUser && (
          <div className="flex-shrink-0 ml-3">
            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
              <User className="w-4 h-4 text-white" />
            </div>
          </div>
        )}
      </div>
    )
  }

  const TypingIndicator = () => (
    <div className="flex justify-start mb-4">
      <div className="flex-shrink-0 mr-3">
        <img 
          src={EvetteTalking} 
          alt="Evette" 
          className="w-8 h-8 rounded-full object-cover border-2 border-pink-200"
        />
      </div>
      <div className="bg-gray-100 text-gray-800 px-4 py-2 rounded-lg">
        <div className="flex items-center space-x-1">
          <div className="flex space-x-1">
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
          </div>
          <span className="text-sm ml-2">Evette is typing...</span>
        </div>
      </div>
    </div>
  )

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="flex items-center justify-center mb-4">
          <img 
            src={evetteImage} 
            alt="Evette AI" 
            className="w-16 h-16 rounded-full object-cover border-4 border-pink-200 shadow-lg mr-4"
          />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Meet Evette</h1>
            <p className="text-muted-foreground flex items-center justify-center mt-1">
              <Bot className="w-4 h-4 mr-1" />
              Your AI Event Discovery Assistant
              <Sparkles className="w-4 h-4 ml-1 text-yellow-500" />
            </p>
          </div>
        </div>
        
        {isOnboarding && (
          <div className="bg-gradient-to-r from-pink-50 to-purple-50 border border-pink-200 rounded-lg p-4 mb-4">
            <div className="flex items-center justify-center text-pink-600 font-medium">
              <Heart className="w-4 h-4 mr-2" />
              Getting to know your interests...
            </div>
          </div>
        )}
      </div>

      {/* Chat Interface */}
      <Card className="h-[600px] flex flex-col overflow-hidden">
        <CardHeader className="border-b bg-gradient-to-r from-pink-50 to-purple-50 flex-shrink-0">
          <CardTitle className="flex items-center">
            <MessageCircle className="w-5 h-5 mr-2 text-pink-600" />
            Chat with Evette
            <div className="ml-auto flex items-center gap-2">
              {preferences && preferences.preferences_count > 0 && (
                <>
                  <span className="text-sm bg-pink-100 text-pink-600 px-2 py-1 rounded-full">
                    {preferences.preferences_count} interests
                  </span>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="text-pink-600 hover:bg-pink-100"
                    title="Update your interests"
                  >
                    <Settings className="w-4 h-4" />
                  </Button>
                </>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        
        <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2 min-h-0">
            {loadingHistory ? (
              <div className="flex items-center justify-center h-32">
                <Loader className="w-6 h-6 animate-spin text-gray-400" />
                <span className="ml-2 text-gray-500">Loading conversation...</span>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex items-center justify-center h-32 text-gray-500">
                <div className="text-center">
                  <Bot className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p>Start a conversation with Evette!</p>
                </div>
              </div>
            ) : (
              messages.map((message, index) => (
                <MessageBubble key={index} message={message} />
              ))
            )}
            
            {isTyping && <TypingIndicator />}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="border-t p-4 flex-shrink-0">
            <form onSubmit={handleSendMessage} className="flex space-x-2">
              <Input
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Type your message to Evette..."
                disabled={sendingMessage || isTyping}
                className="flex-1"
                maxLength={500}
              />
              <Button 
                type="submit" 
                disabled={!inputMessage.trim() || sendingMessage || isTyping}
                className="bg-pink-500 hover:bg-pink-600 flex-shrink-0"
              >
                {sendingMessage ? (
                  <Loader className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </form>
            
            {inputMessage.length > 400 && (
              <div className="text-xs text-gray-500 mt-1">
                {inputMessage.length}/500 characters
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Preferences Info - Only show if no interests are set */}
      {preferences && preferences.preferences_count === 0 && (
        <div className="text-center">
          <div className="inline-flex items-center px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
            <Sparkles className="w-4 h-4 mr-2" />
            Tell me about your interests to get personalized event recommendations!
          </div>
        </div>
      )}
    </div>
  )
}

export default Evette