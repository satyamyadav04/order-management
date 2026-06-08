import React, { useState, useEffect } from 'react'
import { LayoutDashboard, Package, Users, ShoppingCart, Activity } from 'lucide-react'
import Dashboard from './components/Dashboard'
import Products from './components/Products'
import Customers from './components/Customers'
import Orders from './components/Orders'

export const API_URL = "https://order-management-htsx.onrender.com"

function App() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [notification, setNotification] = useState(null)

  // Auto-clear notifications after 4 seconds
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 4000)
      return () => clearTimeout(timer)
    }
  }, [notification])

  const showNotification = (type, message) => {
    setNotification({ type, message })
  }

  // Handle loading and view changes
  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard showNotification={showNotification} />
      case 'products':
        return <Products showNotification={showNotification} />
      case 'customers':
        return <Customers showNotification={showNotification} />
      case 'orders':
        return <Orders showNotification={showNotification} />
      default:
        return <Dashboard showNotification={showNotification} />
    }
  }

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <div>
          <div className="brand">
            <div className="brand-logo">
              <Activity size={28} />
            </div>
            <h1 className="brand-name">Sphere</h1>
          </div>
          
          <ul className="nav-links">
            <li>
              <button 
                className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
                onClick={() => setActiveTab('dashboard')}
              >
                <LayoutDashboard size={18} />
                Dashboard
              </button>
            </li>
            <li>
              <button 
                className={`nav-item ${activeTab === 'products' ? 'active' : ''}`}
                onClick={() => setActiveTab('products')}
              >
                <Package size={18} />
                Products
              </button>
            </li>
            <li>
              <button 
                className={`nav-item ${activeTab === 'customers' ? 'active' : ''}`}
                onClick={() => setActiveTab('customers')}
              >
                <Users size={18} />
                Customers
              </button>
            </li>
            <li>
              <button 
                className={`nav-item ${activeTab === 'orders' ? 'active' : ''}`}
                onClick={() => setActiveTab('orders')}
              >
                <ShoppingCart size={18} />
                Orders
              </button>
            </li>
          </ul>
        </div>
        
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center' }}>
          &copy; {new Date().getFullYear()} Sphere Inc.
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="content-area">
        {/* Global Notification Banner */}
        {notification && (
          <div className={`alert-banner ${notification.type}`}>
            <span style={{ fontWeight: 'bold' }}>
              {notification.type === 'success' ? '✓ Success:' : '✕ Error:'}
            </span>
            <span>{notification.message}</span>
          </div>
        )}

        <div className="fade-in">
          {renderContent()}
        </div>
      </main>
    </div>
  )
}

export default App
