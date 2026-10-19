import React, { createContext, useContext, useState, useCallback } from 'react'
import { cn } from '../../lib/utils'

// Toast Context
const ToastContext = createContext()

// Toast Provider
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const addToast = useCallback((toast) => {
    const id = Date.now().toString()
    const newToast = { id, ...toast }
    
    setToasts(prev => [...prev, newToast])
    
    // Auto remove after duration
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, toast.duration || 5000)
    
    return id
  }, [])

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const toast = useCallback({
    success: (message, options = {}) => addToast({ type: 'success', message, ...options }),
    error: (message, options = {}) => addToast({ type: 'error', message, ...options }),
    warning: (message, options = {}) => addToast({ type: 'warning', message, ...options }),
    info: (message, options = {}) => addToast({ type: 'info', message, ...options }),
  }, [addToast])

  return (
    <ToastContext.Provider value={{ toast, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  )
}

// Toast Container
function ToastContainer({ toasts, removeToast }) {
  if (toasts.length === 0) return null

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
      {toasts.map(toast => (
        <ToastItem key={toast.id} toast={toast} onRemove={() => removeToast(toast.id)} />
      ))}
    </div>
  )
}

// Toast Item
function ToastItem({ toast, onRemove }) {
  const getToastStyles = (type) => {
    switch (type) {
      case 'success':
        return 'bg-green-50 text-green-800 border-green-200'
      case 'error':
        return 'bg-red-50 text-red-800 border-red-200'
      case 'warning':
        return 'bg-yellow-50 text-yellow-800 border-yellow-200'
      case 'info':
        return 'bg-blue-50 text-blue-800 border-blue-200'
      default:
        return 'bg-gray-50 text-gray-800 border-gray-200'
    }
  }

  const getIcon = (type) => {
    switch (type) {
      case 'success':
        return '✅'
      case 'error':
        return '❌'
      case 'warning':
        return '⚠️'
      case 'info':
        return 'ℹ️'
      default:
        return '📝'
    }
  }

  return (
    <div
      className={cn(
        "flex items-center gap-3 p-4 rounded-lg border shadow-lg animate-in slide-in-from-top-2",
        getToastStyles(toast.type)
      )}
    >
      <span className="text-lg">{getIcon(toast.type)}</span>
      <p className="flex-1 text-sm font-medium">{toast.message}</p>
      <button
        onClick={onRemove}
        className="text-current hover:opacity-70 transition-opacity"
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 15 15"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="m11.7816 4.03157c0.1661-0.16612 0.1661-0.43536 0-0.60148-0.1661-0.16612-0.4353-0.16612-0.6015 0l-3.1801 3.18014-3.18014-3.18014c-0.16612-0.16612-0.43536-0.16612-0.60148 0-0.16612 0.16612-0.16612 0.43536 0 0.60148l3.18014 3.1801-3.18014 3.1802c-0.16612 0.1661-0.16612 0.4353 0 0.6014 0.16612 0.1661 0.43536 0.1661 0.60148 0l3.18014-3.1801 3.1801 3.1801c0.1662 0.1661 0.4354 0.1661 0.6015 0 0.1661-0.1661 0.1661-0.4353 0-0.6014l-3.1801-3.1802 3.1801-3.1801z"
            fill="currentColor"
            fillRule="evenodd"
            clipRule="evenodd"
          />
        </svg>
      </button>
    </div>
  )
}

// Toast Hook
export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
} 