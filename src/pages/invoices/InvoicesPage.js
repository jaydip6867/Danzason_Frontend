import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import Modal from '../../components/Modal';
import {
  Receipt,
  Plus,
  Search,
  Edit2,
  Trash2,
  Eye,
  AlertCircle,
  Clock,
  PlusCircle,
  X,
  CreditCard,
  Printer,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const InvoicesPage = () => {
  const { hasPermission } = useAuth();
  const [invoices, setInvoices] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Search & Filters
  const [search, setSearch] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('All');

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [currentInvoice, setCurrentInvoice] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);

  // Line item state
  const initialItem = { description: '', quantity: 1, unitPrice: 0, discount: 0, taxRate: 18 };
  const initialFormState = {
    customer: '',
    relatedOrder: '',
    invoiceDate: new Date().toISOString().split('T')[0],
    dueDate: new Date(+new Date() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    notes: '',
    items: [{ ...initialItem }],
  };
  const [formData, setFormData] = useState(initialFormState);
  const [submitting, setSubmitting] = useState(false);

  // Payment form state
  const [paymentData, setPaymentData] = useState({
    amount: '',
    paymentMethod: 'Bank Transfer',
    referenceNumber: '',
    notes: '',
    paymentDate: new Date().toISOString().split('T')[0],
  });

  const fetchInvoices = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const params = {};
      if (search) params.search = search;
      if (paymentFilter !== 'All') params.paymentStatus = paymentFilter;

      const [invRes, custRes, ordRes] = await Promise.all([
        api.get('/invoices', { params }),
        api.get('/customers'),
        api.get('/orders'),
      ]);

      if (invRes.data?.success) setInvoices(invRes.data.data);
      if (custRes.data?.success) setCustomers(custRes.data.data);
      if (ordRes.data?.success) setOrders(ordRes.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch invoices');
    } finally {
      setLoading(false);
    }
  }, [search, paymentFilter]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  const handleOpenAdd = () => {
    setFormData(initialFormState);
    setIsEditMode(false);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (invoice) => {
    setFormData({
      customer: invoice.customer?._id || invoice.customer || '',
      relatedOrder: invoice.relatedOrder?._id || invoice.relatedOrder || '',
      invoiceDate: invoice.invoiceDate ? invoice.invoiceDate.split('T')[0] : '',
      dueDate: invoice.dueDate ? invoice.dueDate.split('T')[0] : '',
      notes: invoice.notes || '',
      items: invoice.items && invoice.items.length > 0 ? invoice.items : [{ ...initialItem }],
    });
    setCurrentInvoice(invoice);
    setIsEditMode(true);
    setIsFormOpen(true);
  };

  const handleOpenView = (invoice) => {
    setCurrentInvoice(invoice);
    setIsViewOpen(true);
  };

  const handleOpenDelete = (invoice) => {
    setCurrentInvoice(invoice);
    setIsDeleteOpen(true);
  };

  const handleOpenRecordPayment = (invoice) => {
    setCurrentInvoice(invoice);
    setPaymentData({
      amount: invoice.balanceDue || '',
      paymentMethod: 'Bank Transfer',
      referenceNumber: '',
      notes: '',
      paymentDate: new Date().toISOString().split('T')[0],
    });
    setIsPaymentOpen(true);
  };

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
        await api.put(`/invoices/${currentInvoice._id}`, formData);
        setSuccess('Invoice updated successfully!');
      } else {
        await api.post('/invoices', formData);
        setSuccess('Invoice created successfully!');
      }
      setIsFormOpen(false);
      fetchInvoices();
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError(err.response?.data?.message || 'Error saving invoice');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRecordPaymentSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      await api.post(`/invoices/${currentInvoice._id}/payments`, paymentData);
      setSuccess(`Payment of ₹${paymentData.amount} recorded!`);
      setIsPaymentOpen(false);
      fetchInvoices();
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to record payment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!currentInvoice) return;
    try {
      setSubmitting(true);
      await api.delete(`/invoices/${currentInvoice._id}`);
      setSuccess('Invoice deleted successfully!');
      setIsDeleteOpen(false);
      fetchInvoices();
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete invoice');
    } finally {
      setSubmitting(false);
    }
  };

  const getPaymentStatusBadge = (st) => {
    switch (st) {
      case 'Paid': return { bg: '#ecfdf5', color: '#059669' };
      case 'Partially Paid': return { bg: '#fef3c7', color: '#d97706' };
      case 'Overdue': return { bg: '#fef2f2', color: '#dc2626' };
      case 'Unpaid':
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
          <h2 style={{ fontSize: '20px', fontWeight: 700 }}>Invoices & Billing</h2>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '13px' }}>
            Generate tax invoices, track collections, record payments, and manage balances
          </p>
        </div>

        {hasPermission('invoices', 'create') && (
          <button onClick={handleOpenAdd} className="btn btn-primary">
            <Plus size={16} />
            <span>Create New Invoice</span>
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
            placeholder="Search by Invoice # or notes..."
            style={{ paddingLeft: '38px' }}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select
          className="form-control"
          style={{ width: '180px' }}
          value={paymentFilter}
          onChange={(e) => setPaymentFilter(e.target.value)}
        >
          <option value="All">All Payment Statuses</option>
          <option value="Unpaid">Unpaid</option>
          <option value="Partially Paid">Partially Paid</option>
          <option value="Paid">Paid</option>
          <option value="Overdue">Overdue</option>
        </select>
      </div>

      {/* Invoices Table */}
      <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
        {loading ? (
          <div className="loading-box">
            <Clock className="animate-spin" size={28} color="var(--color-primary)" />
            <p>Loading invoices...</p>
          </div>
        ) : invoices.length === 0 ? (
          <div className="empty-state">
            <Receipt size={40} className="empty-state-icon" />
            <h4 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--color-text-main)' }}>
              No invoices found
            </h4>
            <p style={{ fontSize: '13px', marginTop: '4px' }}>
              Create your first invoice to start recording revenue and collections.
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
                  <th style={{ padding: '14px 16px', fontWeight: 600 }}>Invoice #</th>
                  <th style={{ padding: '14px 16px', fontWeight: 600 }}>Customer</th>
                  <th style={{ padding: '14px 16px', fontWeight: 600 }}>Invoice Date</th>
                  <th style={{ padding: '14px 16px', fontWeight: 600 }}>Due Date</th>
                  <th style={{ padding: '14px 16px', fontWeight: 600 }}>Grand Total</th>
                  <th style={{ padding: '14px 16px', fontWeight: 600 }}>Paid / Due</th>
                  <th style={{ padding: '14px 16px', fontWeight: 600 }}>Status</th>
                  <th style={{ padding: '14px 16px', fontWeight: 600, textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => {
                  const statusStyle = getPaymentStatusBadge(inv.paymentStatus);
                  return (
                    <tr
                      key={inv._id}
                      style={{ borderBottom: '1px solid var(--color-border-light)' }}
                    >
                      <td style={{ padding: '14px 16px', fontWeight: 700, color: 'var(--color-primary)' }}>
                        {inv.invoiceNumber}
                      </td>
                      <td style={{ padding: '14px 16px', fontWeight: 600 }}>
                        {inv.customer?.name || 'Customer'}
                        {inv.customer?.companyName && (
                          <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                            {inv.customer.companyName}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        {new Date(inv.invoiceDate).toLocaleDateString()}
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        {inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : '-'}
                      </td>
                      <td style={{ padding: '14px 16px', fontWeight: 700 }}>
                        ₹{Number(inv.grandTotal).toLocaleString('en-IN')}
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ color: '#059669', fontWeight: 600 }}>
                          ₹{Number(inv.amountPaid || 0).toLocaleString('en-IN')}
                        </div>
                        <div style={{ color: inv.balanceDue > 0 ? '#dc2626' : 'var(--color-text-muted)', fontSize: '11px' }}>
                          Due: ₹{Number(inv.balanceDue || 0).toLocaleString('en-IN')}
                        </div>
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
                          {inv.paymentStatus}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '8px' }}>
                          {inv.balanceDue > 0 && hasPermission('invoices', 'edit') && (
                            <button
                              onClick={() => handleOpenRecordPayment(inv)}
                              title="Record Payment"
                              style={{
                                background: 'none',
                                border: 'none',
                                color: '#059669',
                                cursor: 'pointer',
                                padding: '4px',
                              }}
                            >
                              <CreditCard size={16} />
                            </button>
                          )}
                          <button
                            onClick={() => handleOpenView(inv)}
                            title="View / Print Invoice"
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
                          {hasPermission('invoices', 'edit') && (
                            <button
                              onClick={() => handleOpenEdit(inv)}
                              title="Edit Invoice"
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
                          {hasPermission('invoices', 'delete') && (
                            <button
                              onClick={() => handleOpenDelete(inv)}
                              title="Delete Invoice"
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

      {/* Add / Edit Invoice Modal */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={isEditMode ? `Edit Invoice: ${currentInvoice?.invoiceNumber}` : 'Create New Invoice'}
        maxWidth="850px"
      >
        <form onSubmit={handleSubmitForm}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">Customer *</label>
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
              <label className="form-label">Link Related Order (Optional)</label>
              <select
                className="form-control"
                value={formData.relatedOrder}
                onChange={(e) => setFormData({ ...formData, relatedOrder: e.target.value })}
              >
                <option value="">-- None / Direct Invoice --</option>
                {orders.map((o) => (
                  <option key={o._id} value={o._id}>
                    {o.orderId} - ₹{o.grandTotal}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">Invoice Date</label>
              <input
                type="date"
                className="form-control"
                required
                value={formData.invoiceDate}
                onChange={(e) => setFormData({ ...formData, invoiceDate: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Due Date</label>
              <input
                type="date"
                className="form-control"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              />
            </div>
          </div>

          {/* Items Table Builder */}
          <div style={{ marginTop: '16px', marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <label className="form-label" style={{ marginBottom: 0 }}>Invoice Items *</label>
              <button type="button" onClick={addItemRow} className="btn btn-outline btn-sm">
                <PlusCircle size={14} /> Add Item Row
              </button>
            </div>

            <div style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '12px' }}>
              {/* Field Column Headers */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '3fr 1fr 1.2fr 1fr 1fr 28px',
                  gap: '8px',
                  alignItems: 'center',
                  marginBottom: '8px',
                  paddingBottom: '6px',
                  borderBottom: '1px solid var(--color-border)',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: 'var(--color-text-muted)',
                }}
              >
                <div>Item Description *</div>
                <div>Qty *</div>
                <div>Price (₹) *</div>
                <div>Discount (₹)</div>
                <div>GST (%)</div>
                <div></div>
              </div>

              {formData.items.map((item, index) => (
                <div key={index} style={{ display: 'grid', gridTemplateColumns: '3fr 1fr 1.2fr 1fr 1fr 28px', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Product / Service description"
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
            <label className="form-label">Notes & Payment Instructions</label>
            <input
              type="text"
              className="form-control"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Bank account details, UPI ID, terms..."
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
            <button type="button" className="btn btn-outline" onClick={() => setIsFormOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Saving...' : isEditMode ? 'Update Invoice' : 'Create Invoice'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Record Payment Modal */}
      <Modal
        isOpen={isPaymentOpen}
        onClose={() => setIsPaymentOpen(false)}
        title={`Record Payment for ${currentInvoice?.invoiceNumber}`}
        maxWidth="500px"
      >
        <form onSubmit={handleRecordPaymentSubmit}>
          <div style={{ padding: '12px', backgroundColor: '#f8fafc', borderRadius: 'var(--radius-md)', marginBottom: '16px', fontSize: '13px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span>Total Bill:</span>
              <strong>₹{currentInvoice?.grandTotal?.toLocaleString('en-IN')}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#dc2626' }}>
              <span>Current Balance Due:</span>
              <strong>₹{currentInvoice?.balanceDue?.toLocaleString('en-IN')}</strong>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Payment Amount (₹) *</label>
            <input
              type="number"
              min="1"
              max={currentInvoice?.balanceDue}
              required
              className="form-control"
              value={paymentData.amount}
              onChange={(e) => setPaymentData({ ...paymentData, amount: e.target.value })}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">Payment Method</label>
              <select
                className="form-control"
                value={paymentData.paymentMethod}
                onChange={(e) => setPaymentData({ ...paymentData, paymentMethod: e.target.value })}
              >
                <option value="Bank Transfer">Bank Transfer (NEFT/RTGS)</option>
                <option value="UPI">UPI / QR</option>
                <option value="Cheque">Cheque</option>
                <option value="Cash">Cash</option>
                <option value="Credit Card">Credit Card</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Payment Date</label>
              <input
                type="date"
                className="form-control"
                value={paymentData.paymentDate}
                onChange={(e) => setPaymentData({ ...paymentData, paymentDate: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Reference / UTR / Transaction #</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. UTR123456789"
              value={paymentData.referenceNumber}
              onChange={(e) => setPaymentData({ ...paymentData, referenceNumber: e.target.value })}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
            <button type="button" className="btn btn-outline" onClick={() => setIsPaymentOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Recording...' : 'Record Payment'}
            </button>
          </div>
        </form>
      </Modal>

      {/* View & Print Invoice Modal */}
      <Modal
        isOpen={isViewOpen}
        onClose={() => setIsViewOpen(false)}
        title={`Tax Invoice: ${currentInvoice?.invoiceNumber}`}
        maxWidth="800px"
      >
        {currentInvoice && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--color-border)', paddingBottom: '16px' }}>
              <div>
                <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--color-primary)' }}>DANZA SON ERP</div>
                <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>TAX INVOICE</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '17px', fontWeight: 700 }}>{currentInvoice.invoiceNumber}</div>
                <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                  Date: {new Date(currentInvoice.invoiceDate).toLocaleDateString()}
                </div>
                {currentInvoice.dueDate && (
                  <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                    Due: {new Date(currentInvoice.dueDate).toLocaleDateString()}
                  </div>
                )}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', margin: '16px 0', fontSize: '13px' }}>
              <div>
                <strong>Billed To:</strong>
                <div style={{ fontWeight: 600 }}>{currentInvoice.customer?.name}</div>
                {currentInvoice.customer?.companyName && <div>{currentInvoice.customer.companyName}</div>}
                <div>{currentInvoice.customer?.billingAddress}</div>
                <div>{currentInvoice.customer?.phone} | {currentInvoice.customer?.email}</div>
                {currentInvoice.customer?.gstNumber && <div>GST: {currentInvoice.customer.gstNumber}</div>}
              </div>
              <div style={{ textAlign: 'right' }}>
                <span
                  style={{
                    padding: '4px 12px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: 600,
                    backgroundColor: getPaymentStatusBadge(currentInvoice.paymentStatus).bg,
                    color: getPaymentStatusBadge(currentInvoice.paymentStatus).color,
                  }}
                >
                  {currentInvoice.paymentStatus}
                </span>
              </div>
            </div>

            {/* Line items */}
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', margin: '16px 0' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border)', textAlign: 'left', color: 'var(--color-text-muted)' }}>
                  <th style={{ padding: '8px 4px' }}>Item</th>
                  <th style={{ padding: '8px 4px', textAlign: 'center' }}>Qty</th>
                  <th style={{ padding: '8px 4px', textAlign: 'right' }}>Price</th>
                  <th style={{ padding: '8px 4px', textAlign: 'right' }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {(currentInvoice.items || []).map((it, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '10px 4px', fontWeight: 500 }}>{it.description}</td>
                    <td style={{ padding: '10px 4px', textAlign: 'center' }}>{it.quantity}</td>
                    <td style={{ padding: '10px 4px', textAlign: 'right' }}>₹{it.unitPrice}</td>
                    <td style={{ padding: '10px 4px', textAlign: 'right', fontWeight: 600 }}>₹{it.itemTotal}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
              <div style={{ width: '240px', fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--color-text-muted)' }}>Subtotal:</span>
                  <span>₹{currentInvoice.subtotal?.toLocaleString('en-IN')}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--color-text-muted)' }}>Tax (GST):</span>
                  <span>₹{currentInvoice.taxAmount?.toLocaleString('en-IN')}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '15px' }}>
                  <span>Grand Total:</span>
                  <span>₹{currentInvoice.grandTotal?.toLocaleString('en-IN')}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#059669', fontWeight: 600 }}>
                  <span>Paid:</span>
                  <span>₹{Number(currentInvoice.amountPaid || 0).toLocaleString('en-IN')}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#dc2626', fontWeight: 700, fontSize: '15px', borderTop: '1px solid var(--color-border)', paddingTop: '4px' }}>
                  <span>Balance Due:</span>
                  <span>₹{Number(currentInvoice.balanceDue || 0).toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>

            {/* Payment history log */}
            {currentInvoice.payments?.length > 0 && (
              <div style={{ marginTop: '20px', borderTop: '1px solid var(--color-border)', paddingTop: '12px' }}>
                <h5 style={{ fontSize: '13px', fontWeight: 700, marginBottom: '8px' }}>Payment History</h5>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {currentInvoice.payments.map((p, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', background: '#f8fafc', padding: '6px 12px', borderRadius: '4px' }}>
                      <span>{new Date(p.paymentDate).toLocaleDateString()} via {p.paymentMethod} {p.referenceNumber ? `(${p.referenceNumber})` : ''}</span>
                      <strong style={{ color: '#059669' }}>₹{Number(p.amount).toLocaleString('en-IN')}</strong>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '24px' }}>
              <button className="btn btn-outline btn-sm" onClick={() => window.print()}>
                <Printer size={16} /> Print / Save PDF
              </button>
              <button className="btn btn-outline btn-sm" onClick={() => setIsViewOpen(false)}>
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
        title="Confirm Delete Invoice"
        maxWidth="440px"
      >
        <p style={{ fontSize: '14px', color: 'var(--color-text-muted)', marginBottom: '24px' }}>
          Are you sure you want to delete invoice <strong>{currentInvoice?.invoiceNumber}</strong>?
        </p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <button className="btn btn-outline" onClick={() => setIsDeleteOpen(false)}>
            Cancel
          </button>
          <button className="btn btn-danger" onClick={handleDelete} disabled={submitting}>
            {submitting ? 'Deleting...' : 'Delete Invoice'}
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default InvoicesPage;
