import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import Modal from '../../components/Modal';
import {
  ShoppingCart,
  Plus,
  Search,
  Edit2,
  Trash2,
  Eye,
  AlertCircle,
  Clock,
  PlusCircle,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const OrdersPage = () => {
  const { hasPermission } = useAuth();
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Search & Filter
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [paymentFilter, setPaymentFilter] = useState('All');

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [currentOrder, setCurrentOrder] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);

  // Form State
  const initialItem = { description: '', quantity: 1, unitPrice: 0, discount: 0, taxRate: 18 };
  const initialFormState = {
    customer: '',
    orderDate: new Date().toISOString().split('T')[0],
    expectedDeliveryDate: '',
    status: 'Draft',
    paymentStatus: 'Unpaid',
    notes: '',
    items: [{ ...initialItem }],
  };
  const [formData, setFormData] = useState(initialFormState);
  const [submitting, setSubmitting] = useState(false);

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const params = {};
      if (search) params.search = search;
      if (statusFilter !== 'All') params.status = statusFilter;
      if (paymentFilter !== 'All') params.paymentStatus = paymentFilter;

      const [ordersRes, custRes] = await Promise.all([
        api.get('/orders', { params }),
        api.get('/customers'),
      ]);

      if (ordersRes.data?.success) setOrders(ordersRes.data.data);
      if (custRes.data?.success) setCustomers(custRes.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, paymentFilter]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleOpenAdd = () => {
    setFormData(initialFormState);
    setIsEditMode(false);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (order) => {
    setFormData({
      customer: order.customer?._id || order.customer || '',
      orderDate: order.orderDate ? order.orderDate.split('T')[0] : '',
      expectedDeliveryDate: order.expectedDeliveryDate ? order.expectedDeliveryDate.split('T')[0] : '',
      status: order.status || 'Draft',
      paymentStatus: order.paymentStatus || 'Unpaid',
      notes: order.notes || '',
      items: order.items && order.items.length > 0 ? order.items : [{ ...initialItem }],
    });
    setCurrentOrder(order);
    setIsEditMode(true);
    setIsFormOpen(true);
  };

  const handleOpenView = (order) => {
    setCurrentOrder(order);
    setIsViewOpen(true);
  };

  const handleOpenDelete = (order) => {
    setCurrentOrder(order);
    setIsDeleteOpen(true);
  };

  // Line item manipulation
  const handleItemChange = (index, field, value) => {
    const updated = [...formData.items];
    updated[index][field] = value;
    setFormData({ ...formData, items: updated });
  };

  const addItemRow = () => {
    setFormData({ ...formData, items: [...formData.items, { ...initialItem }] });
  };

  const removeItemRow = (index) => {
    if (formData.items.length === 1) return;
    const updated = formData.items.filter((_, i) => i !== index);
    setFormData({ ...formData, items: updated });
  };

  // Calculations for preview in modal
  const calculatePreviewTotals = () => {
    let subtotal = 0;
    let tax = 0;
    (formData.items || []).forEach((item) => {
      const q = Number(item.quantity) || 1;
      const p = Number(item.unitPrice) || 0;
      const d = Number(item.discount) || 0;
      const tr = Number(item.taxRate) || 0;
      const base = q * p - d > 0 ? q * p - d : 0;
      subtotal += base;
      tax += (base * tr) / 100;
    });
    return {
      subtotal: Math.round(subtotal * 100) / 100,
      tax: Math.round(tax * 100) / 100,
      grandTotal: Math.round((subtotal + tax) * 100) / 100,
    };
  };

  const preview = calculatePreviewTotals();

  const handleSubmitForm = async (e) => {
    e.preventDefault();
    if (!formData.customer) {
      setError('Please select a customer');
      return;
    }
    setSubmitting(true);
    setError('');

    try {
      if (isEditMode) {
        await api.put(`/orders/${currentOrder._id}`, formData);
        setSuccess('Order updated successfully!');
      } else {
        await api.post('/orders', formData);
        setSuccess('Order created successfully!');
      }
      setIsFormOpen(false);
      fetchOrders();
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError(err.response?.data?.message || 'Error saving order');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!currentOrder) return;
    try {
      setSubmitting(true);
      await api.delete(`/orders/${currentOrder._id}`);
      setSuccess('Order deleted successfully!');
      setIsDeleteOpen(false);
      fetchOrders();
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete order');
    } finally {
      setSubmitting(false);
    }
  };

  const getOrderStatusBadge = (st) => {
    switch (st) {
      case 'Draft': return { bg: '#f1f5f9', color: '#475569' };
      case 'Confirmed': return { bg: '#eff6ff', color: '#2563eb' };
      case 'Processing': return { bg: '#fef3c7', color: '#d97706' };
      case 'Completed': return { bg: '#ecfdf5', color: '#059669' };
      case 'Cancelled': return { bg: '#fef2f2', color: '#dc2626' };
      default: return { bg: '#f1f5f9', color: '#475569' };
    }
  };

  return (
    <div>
      {/* Alerts */}
      {success && (
        <div className="alert alert-success">
          <span>{success}</span>
        </div>
      )}
      {error && (
        <div className="alert alert-danger">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 700 }}>Orders Management</h2>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '13px' }}>
            Process customer orders, view status, and track fulfillment
          </p>
        </div>

        {hasPermission('orders', 'create') && (
          <button onClick={handleOpenAdd} className="btn btn-primary">
            <Plus size={16} />
            <span>Create New Order</span>
          </button>
        )}
      </div>

      {/* Search and Filters */}
      <div
        className="card"
        style={{
          padding: '16px 20px',
          marginBottom: '20px',
          display: 'flex',
          gap: '16px',
          flexWrap: 'wrap',
          alignItems: 'center',
        }}
      >
        <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
          <Search
            size={16}
            style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--color-text-muted)',
            }}
          />
          <input
            type="text"
            className="form-control"
            placeholder="Search by Order ID or notes..."
            style={{ paddingLeft: '38px' }}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select
          className="form-control"
          style={{ width: '160px' }}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="All">All Order Statuses</option>
          <option value="Draft">Draft</option>
          <option value="Confirmed">Confirmed</option>
          <option value="Processing">Processing</option>
          <option value="Completed">Completed</option>
          <option value="Cancelled">Cancelled</option>
        </select>

        <select
          className="form-control"
          style={{ width: '160px' }}
          value={paymentFilter}
          onChange={(e) => setPaymentFilter(e.target.value)}
        >
          <option value="All">All Payments</option>
          <option value="Unpaid">Unpaid</option>
          <option value="Partially Paid">Partially Paid</option>
          <option value="Paid">Paid</option>
        </select>
      </div>

      {/* Orders Table */}
      <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
        {loading ? (
          <div className="loading-box">
            <Clock className="animate-spin" size={28} color="var(--color-primary)" />
            <p>Loading orders...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="empty-state">
            <ShoppingCart size={40} className="empty-state-icon" />
            <h4 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--color-text-main)' }}>
              No orders found
            </h4>
            <p style={{ fontSize: '13px', marginTop: '4px' }}>
              Create an order directly or convert one from an accepted quotation.
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: '13px',
                textAlign: 'left',
              }}
            >
              <thead style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid var(--color-border)' }}>
                <tr>
                  <th style={{ padding: '14px 16px', fontWeight: 600 }}>Order ID</th>
                  <th style={{ padding: '14px 16px', fontWeight: 600 }}>Customer</th>
                  <th style={{ padding: '14px 16px', fontWeight: 600 }}>Order Date</th>
                  <th style={{ padding: '14px 16px', fontWeight: 600 }}>Items</th>
                  <th style={{ padding: '14px 16px', fontWeight: 600 }}>Grand Total</th>
                  <th style={{ padding: '14px 16px', fontWeight: 600 }}>Status</th>
                  <th style={{ padding: '14px 16px', fontWeight: 600 }}>Payment</th>
                  <th style={{ padding: '14px 16px', fontWeight: 600, textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => {
                  const statusStyle = getOrderStatusBadge(o.status);
                  return (
                    <tr
                      key={o._id}
                      style={{ borderBottom: '1px solid var(--color-border-light)' }}
                    >
                      <td style={{ padding: '14px 16px', fontWeight: 700, color: 'var(--color-primary)' }}>
                        {o.orderId}
                      </td>
                      <td style={{ padding: '14px 16px', fontWeight: 600 }}>
                        {o.customer?.name || 'Customer'}
                        {o.customer?.companyName && (
                          <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                            {o.customer.companyName}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        {new Date(o.orderDate).toLocaleDateString()}
                      </td>
                      <td style={{ padding: '14px 16px' }}>{o.items?.length || 0} items</td>
                      <td style={{ padding: '14px 16px', fontWeight: 700 }}>
                        ₹{Number(o.grandTotal).toLocaleString('en-IN')}
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <span
                          style={{
                            padding: '4px 10px',
                            borderRadius: '12px',
                            fontSize: '11px',
                            fontWeight: 600,
                            backgroundColor: statusStyle.bg,
                            color: statusStyle.color,
                          }}
                        >
                          {o.status}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <span
                          style={{
                            fontSize: '12px',
                            fontWeight: 600,
                            color: o.paymentStatus === 'Paid' ? '#059669' : o.paymentStatus === 'Partially Paid' ? '#d97706' : '#dc2626',
                          }}
                        >
                          {o.paymentStatus}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '8px' }}>
                          <button
                            onClick={() => handleOpenView(o)}
                            title="View Order"
                            style={{
                              background: 'none',
                              border: 'none',
                              color: 'var(--color-primary)',
                              cursor: 'pointer',
                              padding: '4px',
                            }}
                          >
                            <Eye size={16} />
                          </button>
                          {hasPermission('orders', 'edit') && (
                            <button
                              onClick={() => handleOpenEdit(o)}
                              title="Edit Order"
                              style={{
                                background: 'none',
                                border: 'none',
                                color: 'var(--color-text-muted)',
                                cursor: 'pointer',
                                padding: '4px',
                              }}
                            >
                              <Edit2 size={16} />
                            </button>
                          )}
                          {hasPermission('orders', 'delete') && (
                            <button
                              onClick={() => handleOpenDelete(o)}
                              title="Delete Order"
                              style={{
                                background: 'none',
                                border: 'none',
                                color: 'var(--color-danger)',
                                cursor: 'pointer',
                                padding: '4px',
                              }}
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Order Modal */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={isEditMode ? `Edit Order: ${currentOrder?.orderId}` : 'Create New Order'}
        maxWidth="850px"
      >
        <form onSubmit={handleSubmitForm}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">Select Customer *</label>
              <select
                className="form-control"
                required
                value={formData.customer}
                onChange={(e) => setFormData({ ...formData, customer: e.target.value })}
              >
                <option value="">-- Select Customer --</option>
                {customers.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name} {c.companyName ? `(${c.companyName})` : ''} - {c.customerId}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Order Date</label>
              <input
                type="date"
                className="form-control"
                required
                value={formData.orderDate}
                onChange={(e) => setFormData({ ...formData, orderDate: e.target.value })}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">Expected Delivery Date</label>
              <input
                type="date"
                className="form-control"
                value={formData.expectedDeliveryDate}
                onChange={(e) => setFormData({ ...formData, expectedDeliveryDate: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Order Status</label>
              <select
                className="form-control"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              >
                <option value="Draft">Draft</option>
                <option value="Confirmed">Confirmed</option>
                <option value="Processing">Processing</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Payment Status</label>
              <select
                className="form-control"
                value={formData.paymentStatus}
                onChange={(e) => setFormData({ ...formData, paymentStatus: e.target.value })}
              >
                <option value="Unpaid">Unpaid</option>
                <option value="Partially Paid">Partially Paid</option>
                <option value="Paid">Paid</option>
              </select>
            </div>
          </div>

          {/* Line Items Builder */}
          <div style={{ marginTop: '16px', marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <label className="form-label" style={{ marginBottom: 0 }}>Order Items *</label>
              <button type="button" onClick={addItemRow} className="btn btn-outline btn-sm">
                <PlusCircle size={14} /> Add Item Row
              </button>
            </div>

            <div style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '12px' }}>
              {formData.items.map((item, index) => (
                <div key={index} style={{ display: 'grid', gridTemplateColumns: '3fr 1fr 1.2fr 1fr 1fr auto', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Item / Service description"
                    required
                    value={item.description}
                    onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                  />
                  <input
                    type="number"
                    min="1"
                    className="form-control"
                    placeholder="Qty"
                    value={item.quantity}
                    onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                  />
                  <input
                    type="number"
                    min="0"
                    className="form-control"
                    placeholder="Price (₹)"
                    value={item.unitPrice}
                    onChange={(e) => handleItemChange(index, 'unitPrice', e.target.value)}
                  />
                  <input
                    type="number"
                    min="0"
                    className="form-control"
                    placeholder="Discount"
                    value={item.discount}
                    onChange={(e) => handleItemChange(index, 'discount', e.target.value)}
                  />
                  <input
                    type="number"
                    min="0"
                    className="form-control"
                    placeholder="GST %"
                    value={item.taxRate}
                    onChange={(e) => handleItemChange(index, 'taxRate', e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => removeItemRow(index)}
                    disabled={formData.items.length === 1}
                    style={{ background: 'none', border: 'none', color: 'var(--color-danger)', cursor: 'pointer' }}
                  >
                    <X size={18} />
                  </button>
                </div>
              ))}

              {/* Calculated Totals Box */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px', borderTop: '1px solid var(--color-border)', paddingTop: '10px' }}>
                <div style={{ width: '220px', fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--color-text-muted)' }}>Subtotal:</span>
                    <span>₹{preview.subtotal.toLocaleString('en-IN')}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--color-text-muted)' }}>Tax (GST):</span>
                    <span>₹{preview.tax.toLocaleString('en-IN')}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '15px', color: 'var(--color-primary)' }}>
                    <span>Grand Total:</span>
                    <span>₹{preview.grandTotal.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Order Notes / Instructions</label>
            <input
              type="text"
              className="form-control"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Delivery instructions, customer PO reference..."
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
            <button type="button" className="btn btn-outline" onClick={() => setIsFormOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Saving...' : isEditMode ? 'Update Order' : 'Create Order'}
            </button>
          </div>
        </form>
      </Modal>

      {/* View Order Modal */}
      <Modal
        isOpen={isViewOpen}
        onClose={() => setIsViewOpen(false)}
        title={`Order Summary: ${currentOrder?.orderId}`}
        maxWidth="700px"
      >
        {currentOrder && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--color-border)', paddingBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 700 }}>{currentOrder.customer?.name}</h3>
                <div style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>
                  {currentOrder.customer?.companyName || 'Retail Customer'}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>
                  Date: {new Date(currentOrder.orderDate).toLocaleDateString()}
                </div>
                <div style={{ marginTop: '4px' }}>
                  <span
                    style={{
                      padding: '3px 10px',
                      borderRadius: '12px',
                      fontSize: '11px',
                      fontWeight: 600,
                      backgroundColor: getOrderStatusBadge(currentOrder.status).bg,
                      color: getOrderStatusBadge(currentOrder.status).color,
                    }}
                  >
                    {currentOrder.status}
                  </span>
                </div>
              </div>
            </div>

            {/* Line items list */}
            <div style={{ margin: '20px 0' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--color-border)', textAlign: 'left', color: 'var(--color-text-muted)' }}>
                    <th style={{ padding: '8px 4px' }}>Description</th>
                    <th style={{ padding: '8px 4px', textAlign: 'center' }}>Qty</th>
                    <th style={{ padding: '8px 4px', textAlign: 'right' }}>Price</th>
                    <th style={{ padding: '8px 4px', textAlign: 'right' }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {(currentOrder.items || []).map((it, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '10px 4px', fontWeight: 500 }}>{it.description}</td>
                      <td style={{ padding: '10px 4px', textAlign: 'center' }}>{it.quantity}</td>
                      <td style={{ padding: '10px 4px', textAlign: 'right' }}>₹{it.unitPrice}</td>
                      <td style={{ padding: '10px 4px', textAlign: 'right', fontWeight: 600 }}>₹{it.itemTotal}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
                <div style={{ width: '220px', fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--color-text-muted)' }}>Subtotal:</span>
                    <span>₹{currentOrder.subtotal?.toLocaleString('en-IN')}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--color-text-muted)' }}>Tax:</span>
                    <span>₹{currentOrder.taxAmount?.toLocaleString('en-IN')}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '15px', color: 'var(--color-primary)' }}>
                    <span>Grand Total:</span>
                    <span>₹{currentOrder.grandTotal?.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
              <button className="btn btn-outline" onClick={() => setIsViewOpen(false)}>
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        title="Confirm Delete Order"
        maxWidth="440px"
      >
        <p style={{ fontSize: '14px', color: 'var(--color-text-muted)', marginBottom: '24px' }}>
          Are you sure you want to delete order <strong>{currentOrder?.orderId}</strong>?
        </p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <button className="btn btn-outline" onClick={() => setIsDeleteOpen(false)}>
            Cancel
          </button>
          <button className="btn btn-danger" onClick={handleDelete} disabled={submitting}>
            {submitting ? 'Deleting...' : 'Delete Order'}
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default OrdersPage;
