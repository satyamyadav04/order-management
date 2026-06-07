import React, { useState, useEffect } from 'react'
import { ShoppingCart, Plus, Trash2, Eye, X, Calendar, User, DollarSign, ListOrdered } from 'lucide-react'
import { API_URL } from '../App'

function Orders({ showNotification }) {
  const [orders, setOrders] = useState([])
  const [customers, setCustomers] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

  // Order Placement form state
  const [selectedCustomerId, setSelectedCustomerId] = useState('')
  const [selectedProductId, setSelectedProductId] = useState('')
  const [itemQuantity, setItemQuantity] = useState('1')
  
  // Temporary Cart items list for the order being built
  // Each item is: { product_id, name, quantity, price, stock }
  const [cartItems, setCartItems] = useState([])

  // Details Modal state
  const [activeOrderDetails, setActiveOrderDetails] = useState(null)
  const [detailsLoading, setDetailsLoading] = useState(false)

  const fetchData = async () => {
    try {
      setLoading(true)
      
      // Fetch Orders, Customers, and Products concurrently
      const [ordersRes, customersRes, productsRes] = await Promise.all([
        fetch(`${API_URL}/orders`),
        fetch(`${API_URL}/customers`),
        fetch(`${API_URL}/products`)
      ])

      if (!ordersRes.ok || !customersRes.ok || !productsRes.ok) {
        throw new Error('Failed to load dependency data streams.')
      }

      const [ordersData, customersData, productsData] = await Promise.all([
        ordersRes.json(),
        customersRes.json(),
        productsRes.json()
      ])

      setOrders(ordersData)
      setCustomers(customersData)
      setProducts(productsData)
    } catch (err) {
      console.error(err)
      showNotification('error', 'Failed to retrieve order records and catalogs.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  // Cart operations
  const handleAddItemToCart = () => {
    if (!selectedProductId) {
      showNotification('error', 'Please select a product first.')
      return
    }

    const qty = parseInt(itemQuantity, 10)
    if (isNaN(qty) || qty <= 0) {
      showNotification('error', 'Quantity must be a positive integer.')
      return
    }

    const product = products.find(p => p.id === parseInt(selectedProductId, 10))
    if (!product) {
      showNotification('error', 'Selected product is invalid.')
      return
    }

    // Check available stock
    const existingCartItem = cartItems.find(item => item.product_id === product.id)
    const existingQty = existingCartItem ? existingCartItem.quantity : 0
    const totalRequestedQty = existingQty + qty

    if (totalRequestedQty > product.quantity) {
      showNotification('error', `Insufficient stock for '${product.name}'. Available: ${product.quantity}, Selected: ${totalRequestedQty}`)
      return
    }

    if (existingCartItem) {
      // Update quantity
      setCartItems(cartItems.map(item => 
        item.product_id === product.id 
          ? { ...item, quantity: totalRequestedQty } 
          : item
      ))
    } else {
      // Add new item
      setCartItems([...cartItems, {
        product_id: product.id,
        name: product.name,
        quantity: qty,
        price: product.price,
        stock: product.quantity
      }])
    }

    // Reset product selection input
    setSelectedProductId('')
    setItemQuantity('1')
    showNotification('success', `Added ${qty} × '${product.name}' to the order list.`)
  }

  const handleRemoveFromCart = (productId) => {
    setCartItems(cartItems.filter(item => item.product_id !== productId))
  }

  // Calculate estimated order total (client-side)
  const cartTotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)

  // Submit Order
  const handlePlaceOrder = async (e) => {
    e.preventDefault()

    if (!selectedCustomerId) {
      showNotification('error', 'Please select a customer.')
      return
    }

    if (cartItems.length === 0) {
      showNotification('error', 'Your order must contain at least one product.')
      return
    }

    const payload = {
      customer_id: parseInt(selectedCustomerId, 10),
      items: cartItems.map(item => ({
        product_id: item.product_id,
        quantity: item.quantity
      }))
    }

    try {
      const res = await fetch(`${API_URL}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.detail || 'Could not register order.')
      }

      showNotification('success', `Order #${data.id} placed successfully. Total: $${data.total_amount.toFixed(2)}`)
      
      // Clear forms
      setCartItems([])
      setSelectedCustomerId('')
      
      // Refresh list to update stock and orders list
      fetchData()
    } catch (err) {
      console.error(err)
      showNotification('error', err.message || 'Error occurred while submitting order.')
    }
  }

  // View order detail
  const handleViewDetails = async (id) => {
    try {
      setDetailsLoading(true)
      const res = await fetch(`${API_URL}/orders/${id}`)
      if (!res.ok) throw new Error('Could not fetch order details')
      const data = await res.json()
      setActiveOrderDetails(data)
    } catch (err) {
      console.error(err)
      showNotification('error', 'Failed to fetch detailed order summary.')
    } finally {
      setDetailsLoading(false)
    }
  }

  // Delete/Cancel Order
  const handleDeleteOrder = async (id) => {
    if (!window.confirm('Cancelling this order will restore the quantities to the product stock. Continue?')) return

    try {
      const res = await fetch(`${API_URL}/orders/${id}`, {
        method: 'DELETE'
      })
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.detail || 'Could not cancel order')
      }

      showNotification('success', `Order #${id} cancelled and stock inventory restored.`)
      fetchData()
    } catch (err) {
      console.error(err)
      showNotification('error', err.message || 'Failed to cancel the order.')
    }
  }

  return (
    <div>
      <div className="section-header">
        <h2>
          <ShoppingCart size={24} style={{ color: 'var(--color-primary)' }} />
          Order Management
        </h2>
      </div>

      <div className="split-layout">
        {/* Left Side: Create Order Form Builder */}
        <div className="glass-card">
          <h3 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Plus size={18} />
            Create New Order
          </h3>

          <form onSubmit={handlePlaceOrder} className="order-builder">
            <div className="form-group">
              <label>Select Customer</label>
              <select
                className="form-control"
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                required
              >
                <option value="">-- Choose Customer --</option>
                {customers.map(c => (
                  <option key={c.id} value={c.id}>{c.name} ({c.email})</option>
                ))}
              </select>
            </div>

            <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.01)', border: '1px dashed var(--glass-border)', borderRadius: '12px' }}>
              <p style={{ fontSize: '0.8125rem', fontWeight: 'bold', marginBottom: '0.75rem', color: 'var(--text-muted)' }}>Add Products</p>
              
              <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                <select
                  className="form-control"
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                >
                  <option value="">-- Select Product --</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id} disabled={p.quantity === 0}>
                      {p.name} - ${p.price.toFixed(2)} ({p.quantity === 0 ? 'Out of Stock' : `${p.quantity} left`})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <input
                  type="number"
                  min="1"
                  className="form-control"
                  style={{ width: '80px' }}
                  placeholder="Qty"
                  value={itemQuantity}
                  onChange={(e) => setItemQuantity(e.target.value)}
                />
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ flexGrow: 1 }}
                  onClick={handleAddItemToCart}
                >
                  Add to Cart
                </button>
              </div>
            </div>

            {/* Added products list */}
            <div>
              <p style={{ fontSize: '0.8125rem', fontWeight: 'bold', color: 'var(--text-muted)' }}>Order Items List</p>
              {cartItems.length > 0 ? (
                <div className="added-items-list">
                  {cartItems.map((item) => (
                    <div key={item.product_id} className="added-item-row">
                      <div>
                        <span style={{ fontWeight: '600', fontSize: '0.875rem', display: 'block' }}>{item.name}</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>${item.price.toFixed(2)} each</span>
                      </div>
                      <div style={{ textAlign: 'center', fontSize: '0.875rem' }}>
                        Qty: <strong>{item.quantity}</strong>
                      </div>
                      <div style={{ textAlign: 'right', fontWeight: 'bold', fontSize: '0.875rem' }}>
                        ${(item.price * item.quantity).toFixed(2)}
                      </div>
                      <button 
                        type="button" 
                        className="btn btn-danger btn-icon-only" 
                        style={{ padding: '0.25rem' }}
                        onClick={() => handleRemoveFromCart(item.product_id)}
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem', border: '1px dashed var(--glass-border)', borderRadius: '8px', marginTop: '0.5rem' }}>
                  No items added to the order yet.
                </div>
              )}
            </div>

            {cartItems.length > 0 && (
              <div className="total-summary-box">
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase' }}>Estimated Total</span>
                  <span style={{ fontSize: '0.8125rem', color: 'var(--color-primary)' }}>{cartItems.length} distinct item(s)</span>
                </div>
                <div className="total-price-text">
                  ${cartTotal.toFixed(2)}
                </div>
              </div>
            )}

            <button 
              type="submit" 
              className="btn btn-primary" 
              style={{ marginTop: '0.5rem' }}
              disabled={cartItems.length === 0}
            >
              Submit Order
            </button>
          </form>
        </div>

        {/* Right Side: Orders Table List */}
        <div className="glass-card">
          <h3 style={{ fontSize: '1.25rem', marginBottom: '1.5rem' }}>Orders Ledger</h3>

          {loading ? (
            <div className="loading-indicator">
              <div className="spinner"></div>
              <span>Fetching order history...</span>
            </div>
          ) : orders.length > 0 ? (
            <div className="table-container">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Order Info</th>
                    <th>Customer Name</th>
                    <th>Total Amount</th>
                    <th>Items</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((ord) => (
                    <tr key={ord.id}>
                      <td>
                        <span style={{ fontWeight: '600', display: 'block' }}>Order #{ord.id}</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <Calendar size={11} />
                          {new Date(ord.created_at).toLocaleDateString()}
                        </span>
                      </td>
                      <td>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <User size={13} style={{ color: 'var(--text-muted)' }} />
                          {ord.customer_name}
                        </span>
                      </td>
                      <td>
                        <strong style={{ color: 'var(--color-success)' }}>
                          ${ord.total_amount.toFixed(2)}
                        </strong>
                      </td>
                      <td>
                        <span className="badge badge-info">
                          {ord.items.reduce((sum, i) => sum + i.quantity, 0)} units
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                          <button 
                            className="btn btn-secondary btn-icon-only"
                            onClick={() => handleViewDetails(ord.id)}
                            title="View Order Details"
                          >
                            <Eye size={14} />
                          </button>
                          <button 
                            className="btn btn-danger btn-icon-only"
                            onClick={() => handleDeleteOrder(ord.id)}
                            title="Cancel Order"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              No orders registered in the system ledger.
            </div>
          )}
        </div>
      </div>

      {/* Pop-up Overlay Details Modal */}
      {activeOrderDetails && (
        <div className="modal-overlay" onClick={() => setActiveOrderDetails(null)}>
          <div className="glass-card modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="section-header" style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.75rem' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ShoppingCart size={20} style={{ color: 'var(--color-primary)' }} />
                Order #{activeOrderDetails.id} Details
              </h3>
              <button 
                className="btn btn-secondary btn-icon-only" 
                style={{ padding: '0.25rem' }}
                onClick={() => setActiveOrderDetails(null)}
              >
                <X size={16} />
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
              <div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Customer Reference</p>
                <p style={{ fontWeight: 'bold', fontSize: '1rem' }}>{activeOrderDetails.customer_name}</p>
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>ID: #{activeOrderDetails.customer_id}</p>
              </div>
              <div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Order Placed At</p>
                <p style={{ fontWeight: 'bold', fontSize: '1rem' }}>{new Date(activeOrderDetails.created_at).toLocaleString()}</p>
              </div>
            </div>

            <h4 style={{ fontSize: '1rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <ListOrdered size={16} />
              Line Items
            </h4>
            
            <div className="table-container" style={{ marginBottom: '1.5rem' }}>
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Product Item</th>
                    <th style={{ textAlign: 'center' }}>Quantity</th>
                    <th style={{ textAlign: 'right' }}>Unit Price</th>
                    <th style={{ textAlign: 'right' }}>Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {activeOrderDetails.items.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <span style={{ fontWeight: '600' }}>{item.product_name}</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Product ID: #{item.product_id}</span>
                      </td>
                      <td style={{ textAlign: 'center' }}>{item.quantity}</td>
                      <td style={{ textAlign: 'right' }}>${(item.product_price ?? 0).toFixed(2)}</td>
                      <td style={{ textAlign: 'right', fontWeight: 'bold' }}>
                        ${((item.product_price ?? 0) * item.quantity).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="total-summary-box" style={{ marginTop: '0' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase' }}>Grand Total</span>
                <span style={{ fontSize: '0.8125rem', color: 'var(--color-success)' }}>Calculated by backend API</span>
              </div>
              <div className="total-price-text" style={{ color: 'var(--color-success)' }}>
                ${activeOrderDetails.total_amount.toFixed(2)}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
              <button className="btn btn-secondary" onClick={() => setActiveOrderDetails(null)}>Close View</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Orders
