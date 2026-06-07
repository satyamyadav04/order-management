import React, { useState, useEffect } from 'react'
import { Users, Plus, Trash2, Mail, Phone, User } from 'lucide-react'
import { API_URL } from '../App'

function Customers({ showNotification }) {
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)

  // Form State
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')

  const fetchCustomers = async () => {
    try {
      setLoading(true)
      const res = await fetch(`${API_URL}/customers`)
      if (!res.ok) throw new Error('Could not fetch customers list')
      const data = await res.json()
      setCustomers(data)
    } catch (err) {
      console.error(err)
      showNotification('error', 'Failed to retrieve customer records.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCustomers()
  }, [])

  const resetForm = () => {
    setName('')
    setEmail('')
    setPhone('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!name.trim() || !email.trim() || !phone.trim()) {
      showNotification('error', 'All fields are required.')
      return
    }

    // Basic email validation regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email.trim())) {
      showNotification('error', 'Please enter a valid email address.')
      return
    }

    const payload = {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim()
    }

    try {
      const res = await fetch(`${API_URL}/customers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.detail || 'Failed to create customer record.')
      }

      showNotification('success', 'Customer record registered.')
      resetForm()
      fetchCustomers()
    } catch (err) {
      console.error(err)
      showNotification('error', err.message || 'An error occurred while registering the customer.')
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Deleting this customer will cancel/delete all associated orders. Continue?')) return

    try {
      const res = await fetch(`${API_URL}/customers/${id}`, {
        method: 'DELETE'
      })
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.detail || 'Could not delete customer')
      }

      showNotification('success', 'Customer record removed successfully.')
      fetchCustomers()
    } catch (err) {
      console.error(err)
      showNotification('error', err.message || 'Failed to remove customer.')
    }
  }

  return (
    <div>
      <div className="section-header">
        <h2>
          <Users size={24} style={{ color: 'var(--color-primary)' }} />
          Customer Management
        </h2>
      </div>

      <div className="split-layout">
        {/* Left Side: Register Customer Form */}
        <div className="glass-card">
          <h3 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Plus size={18} />
            Register Customer
          </h3>

          <form onSubmit={handleSubmit} className="order-builder">
            <div className="form-group">
              <label>Full Name</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>Email Address</label>
              <input
                type="email"
                className="form-control"
                placeholder="e.g. john@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>Phone Number</label>
              <input
                type="tel"
                className="form-control"
                placeholder="e.g. +1 (555) 019-2834"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="btn btn-primary" style={{ marginTop: '0.5rem' }}>
              Add Customer
            </button>
          </form>
        </div>

        {/* Right Side: Customers Table List */}
        <div className="glass-card">
          <h3 style={{ fontSize: '1.25rem', marginBottom: '1.5rem' }}>Active Customer Registry</h3>

          {loading ? (
            <div className="loading-indicator">
              <div className="spinner"></div>
              <span>Fetching customer registry...</span>
            </div>
          ) : customers.length > 0 ? (
            <div className="table-container">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Customer Name</th>
                    <th>Email Address</th>
                    <th>Phone Number</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map((cust) => (
                    <tr key={cust.id}>
                      <td>
                        <span style={{ fontWeight: '600', display: 'block' }}>{cust.name}</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ID: #{cust.id}</span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <Mail size={13} style={{ color: 'var(--text-muted)' }} />
                          <code>{cust.email}</code>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <Phone size={13} style={{ color: 'var(--text-muted)' }} />
                          <span>{cust.phone}</span>
                        </div>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button 
                          className="btn btn-danger btn-icon-only"
                          onClick={() => handleDelete(cust.id)}
                          title="Remove customer"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              No customer records found in the database.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Customers
