import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import Modal from '../../components/Modal';
import {
  FileText,
  Plus,
  Search,
  Edit2,
  Trash2,
  Eye,
  AlertCircle,
  Clock,
  PlusCircle,
  X,
  ArrowRight,
  Printer,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const QuotationsPage = () => {
  const { hasPermission } = useAuth();
  const [quotations, setQuotations] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Search & Filter
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [currentQuotation, setCurrentQuotation] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);

  // Line items state
  const initialItem = { description: '', quantity: 1, unitPrice: 0, discount: 0, taxRate: 18 };
  const initialFormState = {
    customer: '',
    validUntil: '',
    termsAndConditions: 'Payment within 30 days. Delivery within 2 weeks of purchase order confirmation.',
    notes: '',
    status: 'Draft',
    items: [{ ...initialItem }],
  };
  const [formData, setFormData] = useState(initialFormState);
  const [submitting, setSubmitting] = useState(false);

  const fetchQuotations = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const params = {};
      if (search) params.search = search;
      if (statusFilter !== 'All') params.status = statusFilter;

      const [quotRes, custRes] = await Promise.all([
        api.get('/quotations', { params }),
        api.get('/customers'),
      ]);

      if (quotRes.data?.success) setQuotations(quotRes.data.data);
      if (custRes.data?.success) setCustomers(custRes.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch quotations');
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => {
    fetchQuotations();
  }, [fetchQuotations]);

  const handleOpenAdd = () => {
    setFormData(initialFormState);
    setIsEditMode(false);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (quotation) => {
    setFormData({
      customer: quotation.customer?._id || quotation.customer || '',
      validUntil: quotation.validUntil ? quotation.validUntil.split('T')[0] : '',
      termsAndConditions: quotation.termsAndConditions || '',
      notes: quotation.notes || '',
      status: quotation.status || 'Draft',
      items: quotation.items && quotation.items.length > 0 ? quotation.items : [{ ...initialItem }],
    });
    setCurrentQuotation(quotation);
    setIsEditMode(true);
    setIsFormOpen(true);
  };

  const handleOpenView = (quotation) => {
    setCurrentQuotation(quotation);
    setIsViewOpen(true);
  };

  const handleOpenDelete = (quotation) => {
    setCurrentQuotation(quotation);
    setIsDeleteOpen(true);
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
        await api.put(`/quotations/${currentQuotation._id}`, formData);
        setSuccess('Quotation updated successfully!');
      } else {
        await api.post('/quotations', formData);
        setSuccess('Quotation created successfully!');
      }
      setIsFormOpen(false);
      fetchQuotations();
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError(err.response?.data?.message || 'Error saving quotation');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!currentQuotation) return;
    try {
      setSubmitting(true);
      await api.delete(`/quotations/${currentQuotation._id}`);
      setSuccess('Quotation deleted successfully!');
      setIsDeleteOpen(false);
      fetchQuotations();
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete quotation');
    } finally {
      setSubmitting(false);
    }
  };

  // Convert to Order functionality
  const handleConvertToOrder = async (quotationId) => {
    try {
      setSubmitting(true);
      const res = await api.post(`/quotations/${quotationId}/convert-to-order`);
      if (res.data?.success) {
        setSuccess(`Quotation converted to Order ${res.data.data?.orderId || ''}!`);
        setIsViewOpen(false);
        fetchQuotations();
        setTimeout(() => setSuccess(''), 4000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to convert quotation to order');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (st) => {
    switch (st) {
      case 'Draft': return { bg: '#f1f5f9', color: '#475569' };
      case 'Sent': return { bg: '#eff6ff', color: '#2563eb' };
      case 'Accepted': return { bg: '#ecfdf5', color: '#059669' };
      case 'Rejected': return { bg: '#fef2f2', color: '#dc2626' };
      case 'Expired': return { bg: '#fef3c7', color: '#d97706' };
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
          <h2 style={{ fontSize: '20px', fontWeight: 700 }}>Quotations Management</h2>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '13px' }}>
            Prepare client estimates, print formal proposals, and convert into orders
          </p>
        </div>

        {hasPermission('quotations', 'create') && (
          <button onClick={handleOpenAdd} className="btn btn-primary">
            <Plus size={16} />
            <span>Create Quotation</span>
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
            placeholder="Search by Quotation # or notes..."
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
          <option value="All">All Statuses</option>
          <option value="Draft">Draft</option>
          <option value="Sent">Sent</option>
          <option value="Accepted">Accepted</option>
          <option value="Rejected">Rejected</option>
          <option value="Expired">Expired</option>
        </select>
      </div>

      {/* Quotations Table */}
      <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
        {loading ? (
          <div className="loading-box">
            <Clock className="animate-spin" size={28} color="var(--color-primary)" />
            <p>Loading quotations...</p>
          </div>
        ) : quotations.length === 0 ? (
          <div className="empty-state">
            <FileText size={40} className="empty-state-icon" />
            <h4 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--color-text-main)' }}>
              No quotations found
            </h4>
            <p style={{ fontSize: '13px', marginTop: '4px' }}>
              Create your first quotation estimate for a client.
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
                  <th style={{ padding: '14px 16px', fontWeight: 600 }}>Quotation #</th>
                  <th style={{ padding: '14px 16px', fontWeight: 600 }}>Customer</th>
                  <th style={{ padding: '14px 16px', fontWeight: 600 }}>Date</th>
                  <th style={{ padding: '14px 16px', fontWeight: 600 }}>Grand Total</th>
                  <th style={{ padding: '14px 16px', fontWeight: 600 }}>Status</th>
                  <th style={{ padding: '14px 16px', fontWeight: 600 }}>Converted</th>
                  <th style={{ padding: '14px 16px', fontWeight: 600, textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {quotations.map((q) => {
                  const statusStyle = getStatusColor(q.status);
                  return (
                    <tr
                      key={q._id}
                      style={{ borderBottom: '1px solid var(--color-border-light)' }}
                    >
                      <td style={{ padding: '14px 16px', fontWeight: 700, color: 'var(--color-primary)' }}>
                        {q.quotationNumber}
                      </td>
                      <td style={{ padding: '14px 16px', fontWeight: 600 }}>
                        {q.customer?.name || 'Customer'}
                        {q.customer?.companyName && (
                          <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                            {q.customer.companyName}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        {new Date(q.quotationDate).toLocaleDateString()}
                      </td>
                      <td style={{ padding: '14px 16px', fontWeight: 700 }}>
                        ₹{Number(q.grandTotal).toLocaleString('en-IN')}
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
                          {q.status}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        {q.convertedToOrder ? (
                          <span style={{ color: '#059669', fontWeight: 600, fontSize: '12px' }}>
                            ✓ Converted
                          </span>
                        ) : (
                          <span style={{ color: 'var(--color-text-muted)', fontSize: '12px' }}>
                            Pending
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '8px' }}>
                          <button
                            onClick={() => handleOpenView(q)}
                            title="View / Print Quotation"
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
                          {hasPermission('quotations', 'edit') && (
                            <button
                              onClick={() => handleOpenEdit(q)}
                              title="Edit Quotation"
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
                          {hasPermission('quotations', 'delete') && (
                            <button
                              onClick={() => handleOpenDelete(q)}
                              title="Delete Quotation"
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

      {/* Add / Edit Quotation Modal */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={isEditMode ? `Edit Quotation: ${currentQuotation?.quotationNumber}` : 'Create New Quotation'}
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
              <label className="form-label">Valid Until</label>
              <input
                type="date"
                className="form-control"
                value={formData.validUntil}
                onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Status</label>
            <select
              className="form-control"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            >
              <option value="Draft">Draft</option>
              <option value="Sent">Sent</option>
              <option value="Accepted">Accepted</option>
              <option value="Rejected">Rejected</option>
              <option value="Expired">Expired</option>
            </select>
          </div>

          {/* Line items builder */}
          <div style={{ marginTop: '16px', marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <label className="form-label" style={{ marginBottom: 0 }}>Quotation Items *</label>
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
            <label className="form-label">Terms and Conditions</label>
            <textarea
              className="form-control"
              rows="2"
              value={formData.termsAndConditions}
              onChange={(e) => setFormData({ ...formData, termsAndConditions: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Notes</label>
            <input
              type="text"
              className="form-control"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Commercial remarks or special instructions"
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
            <button type="button" className="btn btn-outline" onClick={() => setIsFormOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Saving...' : isEditMode ? 'Update Quotation' : 'Create Quotation'}
            </button>
          </div>
        </form>
      </Modal>

      {/* View & Print Quotation Modal */}
      <Modal
        isOpen={isViewOpen}
        onClose={() => setIsViewOpen(false)}
        title={`Quotation: ${currentQuotation?.quotationNumber}`}
        maxWidth="750px"
      >
        {currentQuotation && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--color-border)', paddingBottom: '16px' }}>
              <div>
                <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--color-primary)' }}>DANZA SON ERP</div>
                <div style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>Commercial Quotation / Estimate</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '16px', fontWeight: 700 }}>{currentQuotation.quotationNumber}</div>
                <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                  Date: {new Date(currentQuotation.quotationDate).toLocaleDateString()}
                </div>
                {currentQuotation.validUntil && (
                  <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                    Valid until: {new Date(currentQuotation.validUntil).toLocaleDateString()}
                  </div>
                )}
              </div>
            </div>

            <div style={{ margin: '16px 0', fontSize: '13px' }}>
              <strong>Quotation For:</strong>
              <div>{currentQuotation.customer?.name}</div>
              {currentQuotation.customer?.companyName && <div>{currentQuotation.customer.companyName}</div>}
              <div>{currentQuotation.customer?.phone} | {currentQuotation.customer?.email}</div>
            </div>

            {/* Items Table */}
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
                {(currentQuotation.items || []).map((it, idx) => (
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
              <div style={{ width: '220px', fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--color-text-muted)' }}>Subtotal:</span>
                  <span>₹{currentQuotation.subtotal?.toLocaleString('en-IN')}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--color-text-muted)' }}>Tax (GST):</span>
                  <span>₹{currentQuotation.taxAmount?.toLocaleString('en-IN')}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '15px', color: 'var(--color-primary)' }}>
                  <span>Grand Total:</span>
                  <span>₹{currentQuotation.grandTotal?.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>

            {currentQuotation.termsAndConditions && (
              <div style={{ marginTop: '16px', fontSize: '12px', color: 'var(--color-text-muted)', borderTop: '1px solid var(--color-border)', paddingTop: '10px' }}>
                <strong>Terms:</strong> {currentQuotation.termsAndConditions}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '24px' }}>
              <button
                className="btn btn-outline btn-sm"
                onClick={() => window.print()}
              >
                <Printer size={16} /> Print / Save PDF
              </button>

              <div style={{ display: 'flex', gap: '8px' }}>
                {!currentQuotation.convertedToOrder && hasPermission('orders', 'create') && (
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => handleConvertToOrder(currentQuotation._id)}
                    disabled={submitting}
                  >
                    <ArrowRight size={16} /> Convert to Order
                  </button>
                )}
                <button className="btn btn-outline btn-sm" onClick={() => setIsViewOpen(false)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        title="Confirm Delete Quotation"
        maxWidth="440px"
      >
        <p style={{ fontSize: '14px', color: 'var(--color-text-muted)', marginBottom: '24px' }}>
          Are you sure you want to delete quotation <strong>{currentQuotation?.quotationNumber}</strong>?
        </p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <button className="btn btn-outline" onClick={() => setIsDeleteOpen(false)}>
            Cancel
          </button>
          <button className="btn btn-danger" onClick={handleDelete} disabled={submitting}>
            {submitting ? 'Deleting...' : 'Delete Quotation'}
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default QuotationsPage;
