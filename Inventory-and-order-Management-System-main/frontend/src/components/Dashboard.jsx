import React, { useState, useEffect } from 'react'
import { LayoutDashboard, Package, Users, ShoppingCart, AlertTriangle, ArrowRight } from 'lucide-react'
import { API_URL } from '../App'

function Dashboard({ showNotification }) {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchStats = async () => {
    try {
      setLoading(true)
      const res = await fetch(`${API_URL}/dashboard/stats`)
      if (!res.ok) throw new Error('Could not fetch dashboard metrics')
      const data = await res.json()
      setStats(data)
    } catch (err) {
      console.error(err)
      showNotification('error', 'Unable to fetch dashboard statistics. Verify that the backend is running.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
  }, [])

  if (loading) {
    return (
      <div className="loading-indicator">
        <div className="spinner"></div>
        <span>Loading system metrics...</span>
      </div>
    )
  }

  return (
    <div>
      <div className="section-header">
        <h2>
          <LayoutDashboard size={24} style={{ color: 'var(--color-primary)' }} />
          Dashboard Overview
        </h2>
        <button className="btn btn-secondary" onClick={fetchStats}>Refresh Data</button>
      </div>

      {/* Grid of stats */}
      <div className="dashboard-grid">
        <div className="glass-card stat-card">
          <div className="stat-info">
            <h3>Total Products</h3>
            <p>{stats?.total_products ?? 0}</p>
          </div>
          <div className="stat-icon primary">
            <Package size={22} />
          </div>
        </div>

        <div className="glass-card stat-card">
          <div className="stat-info">
            <h3>Total Customers</h3>
            <p>{stats?.total_customers ?? 0}</p>
          </div>
          <div className="stat-icon secondary">
            <Users size={22} />
          </div>
        </div>

        <div className="glass-card stat-card">
          <div className="stat-info">
            <h3>Total Orders</h3>
            <p>{stats?.total_orders ?? 0}</p>
          </div>
          <div className="stat-icon success">
            <ShoppingCart size={22} />
          </div>
        </div>

        <div className="glass-card stat-card">
          <div className="stat-info">
            <h3>Low Stock Alerts</h3>
            <p>{stats?.low_stock_count ?? 0}</p>
          </div>
          <div className="stat-icon warning">
            <AlertTriangle size={22} />
          </div>
        </div>
      </div>

      {/* Detailed Grid: Low Stock Alert details */}
      <div className="dashboard-details-grid">
        <div className="glass-card">
          <div className="section-header" style={{ marginBottom: '1rem' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.25rem' }}>
              <AlertTriangle size={20} style={{ color: 'var(--color-warning)' }} />
              Low Stock Warnings
            </h3>
            <span className="badge badge-warning">{stats?.low_stock_count ?? 0} Items Warning</span>
          </div>

          {stats?.low_stock_products && stats.low_stock_products.length > 0 ? (
            <div className="table-container">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Product Name</th>
                    <th>SKU/Code</th>
                    <th>Price</th>
                    <th>Quantity left</th>
                    <th>Stock status</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.low_stock_products.map((product) => (
                    <tr key={product.id}>
                      <td><span style={{ fontWeight: '600' }}>{product.name}</span></td>
                      <td><code>{product.sku}</code></td>
                      <td>${product.price.toFixed(2)}</td>
                      <td>
                        <span style={{ fontWeight: 'bold', color: product.quantity === 0 ? 'var(--color-danger)' : 'var(--color-warning)' }}>
                          {product.quantity}
                        </span>
                      </td>
                      <td>
                        {product.quantity === 0 ? (
                          <span className="badge badge-danger">Out of Stock</span>
                        ) : (
                          <span className="badge badge-warning">Low Stock</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              ✓ All products have optimal stock levels. Excellent job!
            </div>
          )}
        </div>

        {/* Quick Instructions panel */}
        <div className="glass-card">
          <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>System Health</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.875rem' }}>
            <div style={{ borderLeft: '3px solid var(--color-success)', paddingLeft: '0.75rem' }}>
              <p style={{ fontWeight: 'bold' }}>Database Server</p>
              <p style={{ color: 'var(--text-muted)' }}>PostgreSQL - Online</p>
            </div>
            <div style={{ borderLeft: '3px solid var(--color-primary)', paddingLeft: '0.75rem' }}>
              <p style={{ fontWeight: 'bold' }}>API Endpoint</p>
              <p style={{ color: 'var(--text-muted)' }}>FastAPI - Connected</p>
            </div>
            <div style={{ marginTop: '0.5rem', background: 'rgba(255,255,255,0.02)', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
              <p style={{ fontWeight: '600', marginBottom: '0.25rem' }}>Business Rules Active:</p>
              <ul style={{ paddingLeft: '1.2rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <li>Unique SKU Validation</li>
                <li>Unique Email Validation</li>
                <li>Deducted Stock on Orders</li>
                <li>Insufficient Stock Blocker</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
