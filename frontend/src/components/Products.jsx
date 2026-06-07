import React, { useState, useEffect } from 'react'
import { Package, Plus, Trash2, Edit2, X } from 'lucide-react'
import { API_URL } from '../App'

function Products({ showNotification }) {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  
  // Form State
  const [name, setName] = useState('')
  const [sku, setSku] = useState('')
  const [price, setPrice] = useState('')
  const [quantity, setQuantity] = useState('')
  
  // Edit State
  const [editingId, setEditingId] = useState(null)

  const fetchProducts = async () => {
    try {
      setLoading(true)
      const res = await fetch(`${API_URL}/products`)
      if (!res.ok) throw new Error('Could not fetch products list')
      const data = await res.json()
      setProducts(data)
    } catch (err) {
      console.error(err)
      showNotification('error', 'Failed to retrieve products list.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProducts()
  }, [])

  const resetForm = () => {
    setName('')
    setSku('')
    setPrice('')
    setQuantity('')
    setEditingId(null)
  }

  const handleEditInit = (product) => {
    setEditingId(product.id)
    setName(product.name)
    setSku(product.sku)
    setPrice(product.price.toString())
    setQuantity(product.quantity.toString())
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Client-side validations
    if (!name.trim() || !sku.trim() || price === '' || quantity === '') {
      showNotification('error', 'Please fill in all fields.')
      return
    }

    const priceVal = parseFloat(price)
    const qtyVal = parseInt(quantity, 10)

    if (isNaN(priceVal) || priceVal < 0) {
      showNotification('error', 'Price cannot be negative.')
      return
    }

    if (isNaN(qtyVal) || qtyVal < 0) {
      showNotification('error', 'Quantity cannot be negative.')
      return
    }

    const payload = {
      name: name.trim(),
      sku: sku.trim().toUpperCase(),
      price: priceVal,
      quantity: qtyVal
    }

    try {
      let res
      if (editingId) {
        // PUT /products/{id}
        res = await fetch(`${API_URL}/products/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
      } else {
        // POST /products
        res = await fetch(`${API_URL}/products`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
      }

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.detail || 'Failed to save product details.')
      }

      showNotification('success', editingId ? 'Product details updated.' : 'Product registered successfully.')
      resetForm()
      fetchProducts()
    } catch (err) {
      console.error(err)
      showNotification('error', err.message || 'An error occurred while saving the product.')
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return

    try {
      const res = await fetch(`${API_URL}/products/${id}`, {
        method: 'DELETE'
      })
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.detail || 'Failed to delete product')
      }

      showNotification('success', 'Product deleted successfully.')
      fetchProducts()
      if (editingId === id) resetForm()
    } catch (err) {
      console.error(err)
      showNotification('error', err.message || 'Could not delete product.')
    }
  }

  return (
    <div>
      <div className="section-header">
        <h2>
          <Package size={24} style={{ color: 'var(--color-primary)' }} />
          Product Management
        </h2>
      </div>

      <div className="split-layout">
        {/* Left Side: Product Editor form */}
        <div className="glass-card">
          <h3 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Plus size={18} />
            {editingId ? 'Edit Product' : 'Add New Product'}
          </h3>

          <form onSubmit={handleSubmit} className="order-builder">
            <div className="form-group">
              <label>Product Name</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. Cyberpunk Hoodie"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>SKU / Product Code</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. CLOTH-HOOD-001"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>Price ($ USD)</label>
              <input
                type="number"
                step="0.01"
                className="form-control"
                placeholder="0.00"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>Initial Stock Quantity</label>
              <input
                type="number"
                className="form-control"
                placeholder="0"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                required
              />
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
              <button type="submit" className="btn btn-primary" style={{ flexGrow: 1 }}>
                {editingId ? 'Save Changes' : 'Register Product'}
              </button>
              {editingId && (
                <button type="button" className="btn btn-secondary" onClick={resetForm} title="Cancel editing">
                  <X size={16} />
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Right Side: Product table */}
        <div className="glass-card">
          <h3 style={{ fontSize: '1.25rem', marginBottom: '1.5rem' }}>Registered Products</h3>

          {loading ? (
            <div className="loading-indicator">
              <div className="spinner"></div>
              <span>Fetching products...</span>
            </div>
          ) : products.length > 0 ? (
            <div className="table-container">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Product Details</th>
                    <th>SKU/Code</th>
                    <th>Price</th>
                    <th>Stock</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr key={product.id}>
                      <td>
                        <span style={{ fontWeight: '600', display: 'block' }}>{product.name}</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ID: #{product.id}</span>
                      </td>
                      <td><code>{product.sku}</code></td>
                      <td>${product.price.toFixed(2)}</td>
                      <td>
                        <span style={{ 
                          fontWeight: 'bold', 
                          color: product.quantity === 0 ? 'var(--color-danger)' : 
                                 product.quantity < 10 ? 'var(--color-warning)' : 'var(--color-success)' 
                        }}>
                          {product.quantity} units
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                          <button 
                            className="btn btn-secondary btn-icon-only"
                            onClick={() => handleEditInit(product)}
                            title="Edit details"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button 
                            className="btn btn-danger btn-icon-only"
                            onClick={() => handleDelete(product.id)}
                            title="Delete product"
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
              No products registered in the database yet.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Products
