import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import Modal from '../../components/Modal';
import {
  Package,
  Plus,
  Search,
  Edit2,
  Trash2,
  Eye,
  AlertCircle,
  Clock,
  PlusCircle,
  X,
  Printer,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const PurchasesPage = () => {
  const { hasPermission } = useAuth();
  const [purchases, setPurchases] = useState([]);
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
  const [currentPurchase, setCurrentPurchase] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);

  // Form State
  const initialItem = { description: '', quantity: 1, unitPrice: 0, discount: 0, taxRate: 18 };
  const initialFormState = {
    supplierName: '',
    supplierCompany: '',
    supplierPhone: '',
    supplierEmail: '',
    supplierGst: '',
    purchaseDate: new Date().toISOString().split('T')[0],
    expectedDeliveryDate: '',
    status: 'Pending',
    paymentStatus: 'Unpaid',
    paymentMethod: 'Bank Transfer',
    referenceNumber: '',
    notes: '',
    items: [{ ...initialItem }],
  };
  const [formData, setFormData] = useState(initialFormState);
  const [submitting, setSubmitting] = useState(false);

  const fetchPurchases = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const params = {};
      if (search) params.search = search;
      if (statusFilter !== 'All') params.status = statusFilter;
      if (paymentFilter !== 'All') params.paymentStatus = paymentFilter;

      const res = await api.get('/purchases', { params });
      if (res.data?.success) {
        setPurchases(res.data.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch purchase orders');
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, paymentFilter]);

  useEffect(() => {
    fetchPurchases();
  }, [fetchPurchases]);

  const handleOpenAdd = () => {
    setFormData(initialFormState);
    setIsEditMode(false);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (purchase) => {
    setFormData({
      supplierName: purchase.supplierName || '',
      supplierCompany: purchase.supplierCompany || '',
      supplierPhone: purchase.supplierPhone || '',
      supplierEmail: purchase.supplierEmail || '',
      supplierGst: purchase.supplierGst || '',
      purchaseDate: purchase.purchaseDate ? purchase.purchaseDate.split('T')[0] : '',
      expectedDeliveryDate: purchase.expectedDeliveryDate ? purchase.expectedDeliveryDate.split('T')[0] : '',
      status: purchase.status || 'Pending',
      paymentStatus: purchase.paymentStatus || 'Unpaid',
      paymentMethod: purchase.paymentMethod || 'Bank Transfer',
      referenceNumber: purchase.referenceNumber || '',
      notes: purchase.notes || '',
      items: purchase.items && purchase.items.length > 0 ? purchase.items : [{ ...initialItem }],
    });
    setCurrentPurchase(purchase);
    setIsEditMode(true);
    setIsFormOpen(true);
  };

  const handleOpenView = (purchase) => {
    setCurrentPurchase(purchase);
    setIsViewOpen(true);
  };

  const handleOpenDelete = (purchase) => {
    setCurrentPurchase(purchase);
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
    if (!formData.supplierName) {
      setError('Please provide supplier name');
      return;
    }
    setSubmitting(true);
    setError('');

    try {
      if (isEditMode) {
        await api.put(`/purchases/${currentPurchase._id}`, formData);
        setSuccess('Purchase order updated successfully!');
      } else {
        await api.post('/purchases', formData);
        setSuccess('Purchase order created successfully!');
      }
      setIsFormOpen(false);
      fetchPurchases();
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError(err.response?.data?.message || 'Error saving purchase order');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!currentPurchase) return;
    try {
      setSubmitting(true);
      await api.delete(`/purchases/${currentPurchase._id}`);
      setSuccess('Purchase order deleted successfully!');
      setIsDeleteOpen(false);
      fetchPurchases();
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete purchase record');
    } finally {
      setSubmitting(false);
    }
  };

  const getPurchaseStatusBadge = (st) => {
    switch (st) {
      case 'Ordered': return { bg: '#eff6ff', color: '#2563eb' };
      case 'Received': return { bg: '#ecfdf5', color: '#149346' };
      case 'Pending': return { bg: '#fef3c7', color: '#d97706' };
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
          <h2 style={{ fontSize: '20px', fontWeight: 700 }}>Purchase Management</h2>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '13px' }}>
            Manage supplier purchase orders, vendor invoices, delivery, and procurement expenses
          </p>
        </div>

        {hasPermission('purchases', 'create') && (
          <button onClick={handleOpenAdd} className="btn btn-primary">
            <Plus size={16} />
            <span>Create Purchase Order</span>
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
            placeholder="Search by Purchase ID, Supplier, Reference..."
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
          <option value="Pending">Pending</option>
          <option value="Ordered">Ordered</option>
          <option value="Received">Received</option>
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

      {/* Purchases Table */}
      <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
        {loading ? (
          <div className="loading-box">
            <Clock className="animate-spin" size={28} color="var(--color-primary)" />
            <p>Loading purchase records...</p>
          </div>
        ) : purchases.length === 0 ? (
          <div className="empty-state">
            <Package size={40} className="empty-state-icon" />
            <h4 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--color-text-main)' }}>
              No purchase orders found
            </h4>
            <p style={{ fontSize: '13px', marginTop: '4px' }}>
              Create your first purchase order to manage vendor procurement.
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
                  <th style={{ padding: '14px 16px', fontWeight: 600 }}>Purchase ID</th>
                  <th style={{ padding: '14px 16px', fontWeight: 600 }}>Supplier / Vendor</th>
                  <th style={{ padding: '14px 16px', fontWeight: 600 }}>Purchase Date</th>
                  <th style={{ padding: '14px 16px', fontWeight: 600 }}>Items</th>
                  <th style={{ padding: '14px 16px', fontWeight: 600 }}>Grand Total</th>
                  <th style={{ padding: '14px 16px', fontWeight: 600 }}>Order Status</th>
                  <th style={{ padding: '14px 16px', fontWeight: 600 }}>Payment</th>
                  <th style={{ padding: '14px 16px', fontWeight: 600, textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {purchases.map((p) => {
                  const statusStyle = getPurchaseStatusBadge(p.status);
                  return (
                    <tr
                      key={p._id}
                      style={{ borderBottom: '1px solid var(--color-border-light)' }}
                    >
                      <td style={{ padding: '14px 16px', fontWeight: 700, color: 'var(--color-primary)' }}>
                        {p.purchaseId}
                      </td>
                      <td style={{ padding: '14px 16px', fontWeight: 600 }}>
                        {p.supplierName}
                        {p.supplierCompany && (
                          <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                            {p.supplierCompany}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        {new Date(p.purchaseDate).toLocaleDateString()}
                      </td>
                      <td style={{ padding: '14px 16px' }}>{p.items?.length || 0} items</td>
                      <td style={{ padding: '14px 16px', fontWeight: 700 }}>
                        ₹{Number(p.grandTotal).toLocaleString('en-IN')}
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
                          {p.status}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <span
                          style={{
                            fontSize: '12px',
                            fontWeight: 600,
                            color: p.paymentStatus === 'Paid' ? '#149346' : p.paymentStatus === 'Partially Paid' ? '#d97706' : '#dc2626',
                          }}
                        >
                          {p.paymentStatus}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '8px' }}>
                          <button
                            onClick={() => handleOpenView(p)}
                            title="View Purchase Order"
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
                          {hasPermission('purchases', 'edit') && (
                            <button
                              onClick={() => handleOpenEdit(p)}
                              title="Edit Purchase"
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
                          {hasPermission('purchases', 'delete') && (
                            <button
                              onClick={() => handleOpenDelete(p)}
                              title="Delete Purchase"
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

      {/* Add / Edit Purchase Modal */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={isEditMode ? `Edit Purchase Order: ${currentPurchase?.purchaseId}` : 'Create New Purchase Order'}
        maxWidth="850px"
      >
        <form onSubmit={handleSubmitForm}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">Supplier / Vendor Name *</label>
              <input
                type="text"
                className="form-control"
                required
                placeholder="Vendor or Contact Person"
                value={formData.supplierName}
                onChange={(e) => setFormData({ ...formData, supplierName: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Supplier Company / Firm</label>
              <input
                type="text"
                className="form-control"
                placeholder="Supplier Company Name"
                value={formData.supplierCompany}
                onChange={(e) => setFormData({ ...formData, supplierCompany: e.target.value })}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">Supplier Phone</label>
              <input
                type="tel"
                className="form-control"
                placeholder="+91 9876543210"
                value={formData.supplierPhone}
                onChange={(e) => setFormData({ ...formData, supplierPhone: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Supplier Email</label>
              <input
                type="email"
                className="form-control"
                placeholder="vendor@company.com"
                value={formData.supplierEmail}
                onChange={(e) => setFormData({ ...formData, supplierEmail: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Supplier GST Number</label>
              <input
                type="text"
                className="form-control"
                placeholder="24ABCDE1234F1Z5"
                value={formData.supplierGst}
                onChange={(e) => setFormData({ ...formData, supplierGst: e.target.value.toUpperCase() })}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">Purchase Date</label>
              <input
                type="date"
                className="form-control"
                required
                value={formData.purchaseDate}
                onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Expected Delivery Date</label>
              <input
                type="date"
                className="form-control"
                value={formData.expectedDeliveryDate}
                onChange={(e) => setFormData({ ...formData, expectedDeliveryDate: e.target.value })}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">Order Status</label>
              <select
                className="form-control"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              >
                <option value="Pending">Pending</option>
                <option value="Ordered">Ordered</option>
                <option value="Received">Received</option>
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
            <div className="form-group">
              <label className="form-label">Payment Method</label>
              <select
                className="form-control"
                value={formData.paymentMethod}
                onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
              >
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="UPI">UPI / QR</option>
                <option value="Cheque">Cheque</option>
                <option value="Cash">Cash</option>
                <option value="Credit Card">Credit Card</option>
              </select>
            </div>
          </div>

          {/* Line Items Builder with Field Labels */}
          <div style={{ marginTop: '16px', marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <label className="form-label" style={{ marginBottom: 0 }}>Purchase Items *</label>
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
                    placeholder="Raw material / Goods / Service"
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
                    placeholder="Cost (₹)"
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

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">Vendor Reference / Bill #</label>
              <input
                type="text"
                className="form-control"
                placeholder="Vendor Invoice / Challan Number"
                value={formData.referenceNumber}
                onChange={(e) => setFormData({ ...formData, referenceNumber: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Procurement Notes</label>
              <input
                type="text"
                className="form-control"
                placeholder="Payment terms, delivery instructions..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
            <button type="button" className="btn btn-outline" onClick={() => setIsFormOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Saving...' : isEditMode ? 'Update Purchase' : 'Create Purchase'}
            </button>
          </div>
        </form>
      </Modal>

      {/* View Purchase Modal */}
      <Modal
        isOpen={isViewOpen}
        onClose={() => setIsViewOpen(false)}
        title={`Purchase Order: ${currentPurchase?.purchaseId}`}
        maxWidth="750px"
      >
        {currentPurchase && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--color-border)', paddingBottom: '16px' }}>
              <div>
                <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--color-primary)' }}>DANZA SON ERP</div>
                <div style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>PURCHASE ORDER</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '16px', fontWeight: 700 }}>{currentPurchase.purchaseId}</div>
                <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                  Date: {new Date(currentPurchase.purchaseDate).toLocaleDateString()}
                </div>
                {currentPurchase.expectedDeliveryDate && (
                  <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                    Expected: {new Date(currentPurchase.expectedDeliveryDate).toLocaleDateString()}
                  </div>
                )}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', margin: '16px 0', fontSize: '13px' }}>
              <div>
                <strong>Supplier / Vendor:</strong>
                <div style={{ fontWeight: 600 }}>{currentPurchase.supplierName}</div>
                {currentPurchase.supplierCompany && <div>{currentPurchase.supplierCompany}</div>}
                <div>{currentPurchase.supplierPhone} | {currentPurchase.supplierEmail}</div>
                {currentPurchase.supplierGst && <div>GST: {currentPurchase.supplierGst}</div>}
              </div>
              <div style={{ textAlign: 'right' }}>
                <span
                  style={{
                    padding: '4px 12px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: 600,
                    backgroundColor: getPurchaseStatusBadge(currentPurchase.status).bg,
                    color: getPurchaseStatusBadge(currentPurchase.status).color,
                  }}
                >
                  {currentPurchase.status}
                </span>
                <div style={{ marginTop: '8px', fontSize: '12px', color: 'var(--color-text-muted)' }}>
                  Payment: <strong>{currentPurchase.paymentStatus}</strong> ({currentPurchase.paymentMethod})
                </div>
                {currentPurchase.referenceNumber && (
                  <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                    Ref #: {currentPurchase.referenceNumber}
                  </div>
                )}
              </div>
            </div>

            {/* Line items table */}
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', margin: '16px 0' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border)', textAlign: 'left', color: 'var(--color-text-muted)' }}>
                  <th style={{ padding: '8px 4px' }}>Item Description</th>
                  <th style={{ padding: '8px 4px', textAlign: 'center' }}>Qty</th>
                  <th style={{ padding: '8px 4px', textAlign: 'right' }}>Price</th>
                  <th style={{ padding: '8px 4px', textAlign: 'right' }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {(currentPurchase.items || []).map((it, idx) => (
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
                  <span>₹{currentPurchase.subtotal?.toLocaleString('en-IN')}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--color-text-muted)' }}>Tax (GST):</span>
                  <span>₹{currentPurchase.taxAmount?.toLocaleString('en-IN')}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '15px', color: 'var(--color-primary)' }}>
                  <span>Grand Total:</span>
                  <span>₹{currentPurchase.grandTotal?.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>

            {currentPurchase.notes && (
              <div style={{ marginTop: '16px', fontSize: '12px', color: 'var(--color-text-muted)', borderTop: '1px solid var(--color-border)', paddingTop: '10px' }}>
                <strong>Notes:</strong> {currentPurchase.notes}
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
        title="Confirm Delete Purchase Order"
        maxWidth="440px"
      >
        <p style={{ fontSize: '14px', color: 'var(--color-text-muted)', marginBottom: '24px' }}>
          Are you sure you want to delete purchase order <strong>{currentPurchase?.purchaseId}</strong> from <strong>{currentPurchase?.supplierName}</strong>?
        </p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <button className="btn btn-outline" onClick={() => setIsDeleteOpen(false)}>
            Cancel
          </button>
          <button className="btn btn-danger" onClick={handleDelete} disabled={submitting}>
            {submitting ? 'Deleting...' : 'Delete Purchase'}
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default PurchasesPage;
