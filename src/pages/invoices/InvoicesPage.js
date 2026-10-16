import React, { useState, useEffect, useCallback, useRef } from 'react';
import api from '../../services/api';
import Modal from '../../components/Modal';
import { exportElementToPdf } from '../../utils/pdfUtils';
import { numberToWords } from '../../utils/numberToWords';
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
  Send,
  Mail,
  FileDown,
  CheckCircle2,
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
  const [generatingPdf, setGeneratingPdf] = useState(false);

  const invoicePrintRef = useRef(null);

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

  const handleOrderSelect = (orderId) => {
    if (!orderId) {
      setFormData((prev) => ({
        ...prev,
        relatedOrder: '',
      }));
      return;
    }

    const order = orders.find((o) => o._id === orderId);
    if (order) {
      // Auto fill Customer, Line Items, and notes from selected Order
      const customerId = order.customer?._id || order.customer || '';
      const orderItems = (order.items || []).map((it) => ({
        description: it.description || '',
        quantity: it.quantity || 1,
        unitPrice: it.unitPrice || 0,
        discount: it.discount || 0,
        taxRate: it.taxRate || 18,
      }));

      setFormData((prev) => ({
        ...prev,
        relatedOrder: orderId,
        customer: customerId || prev.customer,
        items: orderItems.length > 0 ? orderItems : [{ ...initialItem }],
        notes: order.notes ? `Invoice for Order #${order.orderId}. ${order.notes}` : `Invoice for Order #${order.orderId}`,
      }));
    }
  };

  const handleSendInvoice = (inv) => {
    if (!inv) return;
    const customerEmail = inv.customer?.email || '';
    const subject = encodeURIComponent(`Invoice ${inv.invoiceNumber} from Danza SON ERP`);
    const body = encodeURIComponent(
      `Dear ${inv.customer?.name || 'Customer'},\n\nPlease find attached the Tax Invoice ${inv.invoiceNumber} for the total amount of ₹${inv.grandTotal?.toLocaleString('en-IN')}.\n\nBalance Due: ₹${inv.balanceDue?.toLocaleString('en-IN')}\nDue Date: ${inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : 'N/A'}\n\nThank you for your business.\n\nBest Regards,\nDanza SON ERP Team`
    );

    if (customerEmail) {
      window.location.href = `mailto:${customerEmail}?subject=${subject}&body=${body}`;
    } else {
      window.location.href = `mailto:?subject=${subject}&body=${body}`;
    }
  };

  const handleDownloadPdf = async (inv) => {
    if (!invoicePrintRef.current) return;
    try {
      setGeneratingPdf(true);
      await exportElementToPdf(invoicePrintRef.current, `Tax_Invoice_${inv.invoiceNumber}.pdf`);
      setSuccess(`Tax Invoice ${inv.invoiceNumber} downloaded as PDF!`);
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError('Failed to generate PDF. Please try again.');
    } finally {
      setGeneratingPdf(false);
    }
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
    const balance = Math.round(Number(invoice.balanceDue || 0) * 100) / 100;
    setPaymentData({
      amount: balance > 0 ? balance : '',
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
    const numericAmount = Math.round(Number(paymentData.amount) * 100) / 100;
    if (isNaN(numericAmount) || numericAmount <= 0) {
      setError('Please enter a valid payment amount greater than 0');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      await api.post(`/invoices/${currentInvoice._id}/payments`, {
        ...paymentData,
        amount: numericAmount,
      });
      setSuccess(`Payment of ₹${numericAmount.toFixed(2)} recorded successfully!`);
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
                        ₹{Number(inv.grandTotal || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ color: '#059669', fontWeight: 600 }}>
                          ₹{Number(inv.amountPaid || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                        <div style={{ color: inv.balanceDue > 0 ? '#dc2626' : 'var(--color-text-muted)', fontSize: '11px' }}>
                          Due: ₹{Number(inv.balanceDue || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
                            onClick={() => handleSendInvoice(inv)}
                            title="Send Invoice to Customer Email"
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#149346',
                              cursor: 'pointer',
                              padding: '4px',
                            }}
                          >
                            <Mail size={16} />
                          </button>
                          <button
                            onClick={() => handleOpenView(inv)}
                            title="View Tax Invoice"
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
                          <button
                            onClick={() => handleOpenView(inv)}
                            title="Download PDF Bill"
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#149346',
                              cursor: 'pointer',
                              padding: '4px',
                            }}
                          >
                            <FileDown size={16} />
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
              <label className="form-label">
                Link Related Order (Auto-fills Customer & Items)
              </label>
              <select
                className="form-control"
                value={formData.relatedOrder}
                onChange={(e) => handleOrderSelect(e.target.value)}
              >
                <option value="">-- None / Direct Invoice --</option>
                {orders.map((o) => (
                  <option key={o._id} value={o._id}>
                    {o.orderId} - {o.customer?.name ? `${o.customer.name} - ` : ''}₹{o.grandTotal?.toLocaleString('en-IN')} [{o.status}]
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
          <div style={{ padding: '14px 16px', backgroundColor: '#f8fafc', borderRadius: 'var(--radius-md)', marginBottom: '16px', fontSize: '13px', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ color: '#64748b' }}>Total Invoice Bill:</span>
              <strong style={{ color: '#0f172a' }}>₹{Number(currentInvoice?.grandTotal || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ color: '#64748b' }}>Amount Paid So Far:</span>
              <strong style={{ color: '#059669' }}>₹{Number(currentInvoice?.amountPaid || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#dc2626', paddingTop: '6px', borderTop: '1px dashed #cbd5e1' }}>
              <span style={{ fontWeight: 600 }}>Current Balance Due:</span>
              <strong style={{ fontSize: '14px' }}>₹{Number(currentInvoice?.balanceDue || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
            </div>
          </div>

          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label className="form-label" style={{ marginBottom: 0 }}>Payment Amount (₹) *</label>
              <button
                type="button"
                onClick={() => setPaymentData({ ...paymentData, amount: Math.round(Number(currentInvoice?.balanceDue || 0) * 100) / 100 })}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#149346',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  padding: 0,
                  textDecoration: 'underline',
                }}
              >
                Pay Full Balance (₹{Number(currentInvoice?.balanceDue || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})
              </button>
            </div>
            <input
              type="number"
              step="any"
              min="0.01"
              max={Math.round(Number(currentInvoice?.balanceDue || 0) * 100) / 100 + 0.01}
              required
              className="form-control"
              placeholder="e.g. 1500.50"
              value={paymentData.amount}
              onChange={(e) => setPaymentData({ ...paymentData, amount: e.target.value })}
            />
            <small style={{ color: 'var(--color-text-muted)', fontSize: '11px', marginTop: '4px', display: 'block' }}>
              Point / Decimal values (e.g. ₹1250.50, ₹99.75) are fully supported.
            </small>
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

      {/* View & Print Professional Tax Invoice Modal */}
      <Modal
        isOpen={isViewOpen}
        onClose={() => setIsViewOpen(false)}
        title={`Official Tax Invoice: ${currentInvoice?.invoiceNumber}`}
        maxWidth="920px"
      >
        {currentInvoice && (
          <div>
            {/* The Print & PDF container */}
            <div
              id="invoice-document"
              ref={invoicePrintRef}
              style={{
                backgroundColor: '#ffffff',
                color: '#0f172a',
                padding: '32px 36px',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
                lineHeight: '1.45',
              }}
            >
              {/* Top Accent Strip */}
              <div
                style={{
                  height: '6px',
                  backgroundColor: '#149346',
                  borderRadius: '3px',
                  marginBottom: '22px',
                }}
              />

              {/* Header: Company & Tax Invoice Meta */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  paddingBottom: '20px',
                  borderBottom: '2px solid #149346',
                  gap: '24px',
                }}
              >
                {/* Left: Danza Son Brand & Details */}
                <div style={{ flex: '1 1 auto' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                    <span
                      style={{
                        background: '#149346',
                        color: '#ffffff',
                        fontWeight: 800,
                        fontSize: '14px',
                        padding: '4px 10px',
                        borderRadius: '4px',
                        letterSpacing: '1px',
                      }}
                    >
                      DANZA SON
                    </span>
                    <span style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a', letterSpacing: '0.5px' }}>
                      ENTERPRISE
                    </span>
                  </div>
                  <div
                    style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      color: '#149346',
                      textTransform: 'uppercase',
                      letterSpacing: '0.8px',
                      marginBottom: '8px',
                    }}
                  >
                    Industrial Manufacturing & Engineering Solutions
                  </div>
                  <div style={{ fontSize: '12px', color: '#475569', lineHeight: '1.5' }}>
                    <div>Plot No. 42, GIDC Phase-II, Vatva Industrial Estate</div>
                    <div>Ahmedabad, Gujarat - 382445, India</div>
                    <div style={{ marginTop: '3px' }}>
                      <strong>Phone:</strong> +91 98765 43210 &nbsp;|&nbsp; <strong>Email:</strong> accounts@danzason.com
                    </div>
                    <div style={{ marginTop: '4px', fontWeight: 600, color: '#1e293b' }}>
                      <span>GSTIN: <strong style={{ color: '#149346' }}>24AAACD1234A1Z5</strong></span>
                      <span style={{ margin: '0 8px', color: '#cbd5e1' }}>|</span>
                      <span>PAN: <strong>AAACD1234A</strong></span>
                      <span style={{ margin: '0 8px', color: '#cbd5e1' }}>|</span>
                      <span>State: <strong>24 (Gujarat)</strong></span>
                    </div>
                  </div>
                </div>

                {/* Right: Tax Invoice Particulars */}
                <div style={{ textAlign: 'right', minWidth: '240px' }}>
                  <div style={{ fontSize: '26px', fontWeight: 900, color: '#0f172a', letterSpacing: '1.5px', textTransform: 'uppercase' }}>
                    TAX INVOICE
                  </div>
                  <div
                    style={{
                      display: 'inline-block',
                      backgroundColor: '#e8f7ee',
                      color: '#149346',
                      border: '1px solid #a7f3d0',
                      fontSize: '10px',
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: '4px',
                      marginTop: '4px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                    }}
                  >
                    Original For Recipient
                  </div>

                  <div style={{ marginTop: '12px', fontSize: '12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                      <span style={{ color: '#64748b', fontWeight: 600 }}>Invoice No:</span>
                      <strong style={{ color: '#149346', fontSize: '13px' }}>{currentInvoice.invoiceNumber}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                      <span style={{ color: '#64748b', fontWeight: 600 }}>Invoice Date:</span>
                      <strong>
                        {new Date(currentInvoice.invoiceDate).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                      <span style={{ color: '#64748b', fontWeight: 600 }}>Due Date:</span>
                      <strong>
                        {currentInvoice.dueDate
                          ? new Date(currentInvoice.dueDate).toLocaleDateString('en-IN', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })
                          : 'Immediate'}
                      </strong>
                    </div>
                    {currentInvoice.relatedOrder && (
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                        <span style={{ color: '#64748b', fontWeight: 600 }}>Order Ref:</span>
                        <strong>
                          {currentInvoice.relatedOrder?.orderId
                            ? `#${currentInvoice.relatedOrder.orderId}`
                            : currentInvoice.relatedOrder}
                        </strong>
                      </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '4px', alignItems: 'center' }}>
                      <span style={{ color: '#64748b', fontWeight: 600 }}>Status:</span>
                      <span
                        style={{
                          padding: '2px 10px',
                          borderRadius: '12px',
                          fontSize: '11px',
                          fontWeight: 700,
                          backgroundColor: getPaymentStatusBadge(currentInvoice.paymentStatus).bg,
                          color: getPaymentStatusBadge(currentInvoice.paymentStatus).color,
                          textTransform: 'uppercase',
                        }}
                      >
                        {currentInvoice.paymentStatus}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Billed To & Shipped To Section */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '16px',
                  margin: '18px 0',
                  fontSize: '12px',
                }}
              >
                {/* Billed To */}
                <div style={{ border: '1px solid #e2e8f0', borderRadius: '6px', overflow: 'hidden' }}>
                  <div
                    style={{
                      backgroundColor: '#f1f5f9',
                      padding: '6px 12px',
                      fontWeight: 700,
                      fontSize: '11px',
                      color: '#334155',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      borderBottom: '1px solid #e2e8f0',
                    }}
                  >
                    Billed To (Buyer / Customer)
                  </div>
                  <div style={{ padding: '10px 12px', lineHeight: '1.6' }}>
                    <div style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a' }}>
                      {currentInvoice.customer?.name || 'Customer'}
                    </div>
                    {currentInvoice.customer?.companyName && (
                      <div style={{ fontWeight: 600, color: '#334155' }}>
                        {currentInvoice.customer.companyName}
                      </div>
                    )}
                    <div style={{ color: '#475569', marginTop: '2px' }}>
                      {currentInvoice.customer?.billingAddress || 'Billing address on record'}
                    </div>
                    <div style={{ color: '#475569', marginTop: '4px' }}>
                      <strong>Phone:</strong> {currentInvoice.customer?.phone || 'N/A'} &nbsp;|&nbsp; <strong>Email:</strong> {currentInvoice.customer?.email || 'N/A'}
                    </div>
                    <div style={{ marginTop: '4px', paddingTop: '4px', borderTop: '1px dashed #e2e8f0', color: '#1e293b' }}>
                      <strong>GSTIN / UIN:</strong>{' '}
                      {currentInvoice.customer?.gstNumber ? (
                        <span style={{ fontWeight: 700, color: '#149346' }}>{currentInvoice.customer.gstNumber}</span>
                      ) : (
                        <span style={{ color: '#94a3b8' }}>Unregistered Person (URP)</span>
                      )}
                    </div>
                    <div style={{ color: '#475569' }}>
                      <strong>Place of Supply:</strong> Gujarat (Code: 24)
                    </div>
                  </div>
                </div>

                {/* Shipped To & Dispatch */}
                <div style={{ border: '1px solid #e2e8f0', borderRadius: '6px', overflow: 'hidden' }}>
                  <div
                    style={{
                      backgroundColor: '#f1f5f9',
                      padding: '6px 12px',
                      fontWeight: 700,
                      fontSize: '11px',
                      color: '#334155',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      borderBottom: '1px solid #e2e8f0',
                    }}
                  >
                    Shipped To (Consignee) & Dispatch
                  </div>
                  <div style={{ padding: '10px 12px', lineHeight: '1.6' }}>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>
                      {currentInvoice.customer?.companyName || currentInvoice.customer?.name || 'Same as Billed Party'}
                    </div>
                    <div style={{ color: '#475569', marginTop: '2px' }}>
                      {currentInvoice.customer?.shippingAddress || currentInvoice.customer?.billingAddress || 'Same as Billed Address'}
                    </div>
                    <div style={{ marginTop: '6px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <div><strong>Place of Delivery:</strong> Gujarat (State Code: 24)</div>
                      <div><strong>Dispatch Mode:</strong> Road / Surface Transport</div>
                      <div><strong>Reverse Charge:</strong> No (Normal Charge Applicable)</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Line Items Table */}
              <table
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  fontSize: '12px',
                  margin: '18px 0',
                  border: '1px solid #cbd5e1',
                }}
              >
                <thead>
                  <tr
                    style={{
                      backgroundColor: '#149346',
                      color: '#ffffff',
                      textAlign: 'left',
                      fontWeight: 700,
                      fontSize: '11px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                    }}
                  >
                    <th style={{ padding: '9px 8px', border: '1px solid #149346', textAlign: 'center', width: '38px' }}>#</th>
                    <th style={{ padding: '9px 10px', border: '1px solid #149346' }}>Item Description & Specification</th>
                    <th style={{ padding: '9px 8px', border: '1px solid #149346', textAlign: 'center', width: '70px' }}>HSN/SAC</th>
                    <th style={{ padding: '9px 8px', border: '1px solid #149346', textAlign: 'center', width: '55px' }}>Qty</th>
                    <th style={{ padding: '9px 8px', border: '1px solid #149346', textAlign: 'right', width: '85px' }}>Rate (₹)</th>
                    <th style={{ padding: '9px 8px', border: '1px solid #149346', textAlign: 'right', width: '70px' }}>Disc (₹)</th>
                    <th style={{ padding: '9px 8px', border: '1px solid #149346', textAlign: 'center', width: '65px' }}>GST Rate</th>
                    <th style={{ padding: '9px 10px', border: '1px solid #149346', textAlign: 'right', width: '95px' }}>Amount (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {(currentInvoice.items || []).map((it, idx) => (
                    <tr
                      key={idx}
                      style={{
                        backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f8fafc',
                        borderBottom: '1px solid #e2e8f0',
                      }}
                    >
                      <td style={{ padding: '9px 8px', textAlign: 'center', borderRight: '1px solid #e2e8f0', color: '#64748b' }}>
                        {idx + 1}
                      </td>
                      <td style={{ padding: '9px 10px', borderRight: '1px solid #e2e8f0', fontWeight: 600, color: '#0f172a' }}>
                        {it.description}
                      </td>
                      <td style={{ padding: '9px 8px', textAlign: 'center', borderRight: '1px solid #e2e8f0', color: '#64748b' }}>
                        8481
                      </td>
                      <td style={{ padding: '9px 8px', textAlign: 'center', borderRight: '1px solid #e2e8f0', fontWeight: 600 }}>
                        {it.quantity}
                      </td>
                      <td style={{ padding: '9px 8px', textAlign: 'right', borderRight: '1px solid #e2e8f0' }}>
                        {Number(it.unitPrice || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td style={{ padding: '9px 8px', textAlign: 'right', borderRight: '1px solid #e2e8f0', color: it.discount > 0 ? '#dc2626' : '#94a3b8' }}>
                        {it.discount > 0 ? Number(it.discount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-'}
                      </td>
                      <td style={{ padding: '9px 8px', textAlign: 'center', borderRight: '1px solid #e2e8f0' }}>
                        {it.taxRate || 18}%
                      </td>
                      <td style={{ padding: '9px 10px', textAlign: 'right', fontWeight: 700, color: '#0f172a' }}>
                        {Number(
                          it.itemTotal ||
                          (it.quantity * it.unitPrice - (it.discount || 0)) * (1 + (it.taxRate || 18) / 100)
                        ).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Bottom Financial Breakdown & Bank Particulars */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1.2fr 0.8fr',
                  gap: '20px',
                  marginTop: '16px',
                  alignItems: 'start',
                }}
              >
                {/* Left Side: Amount in Words, Bank Details, Terms */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {/* Amount in words */}
                  <div
                    style={{
                      border: '1px solid #bbf7d0',
                      backgroundColor: '#f0fdf4',
                      padding: '10px 12px',
                      borderRadius: '6px',
                    }}
                  >
                    <div
                      style={{
                        fontSize: '10px',
                        fontWeight: 800,
                        color: '#166534',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                      }}
                    >
                      Invoice Amount in Words:
                    </div>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: '#14532d', marginTop: '3px' }}>
                      {numberToWords(currentInvoice.grandTotal)}
                    </div>
                  </div>

                  {/* Bank Details */}
                  <div
                    style={{
                      border: '1px solid #e2e8f0',
                      backgroundColor: '#f8fafc',
                      padding: '10px 12px',
                      borderRadius: '6px',
                      fontSize: '11px',
                      lineHeight: '1.6',
                    }}
                  >
                    <div
                      style={{
                        fontWeight: 800,
                        color: '#334155',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        marginBottom: '4px',
                      }}
                    >
                      Bank Details for Remittance / Payment:
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '95px 1fr', gap: '2px' }}>
                      <span style={{ color: '#64748b' }}>Bank Name:</span>
                      <strong style={{ color: '#0f172a' }}>HDFC Bank Ltd.</strong>
                      <span style={{ color: '#64748b' }}>Account Name:</span>
                      <strong style={{ color: '#0f172a' }}>DANZA SON ENTERPRISE</strong>
                      <span style={{ color: '#64748b' }}>Account No.:</span>
                      <strong style={{ color: '#149346', letterSpacing: '0.5px' }}>50200012345678</strong>
                      <span style={{ color: '#64748b' }}>IFSC Code:</span>
                      <strong style={{ color: '#0f172a' }}>HDFC0001234</strong>
                      <span style={{ color: '#64748b' }}>Branch:</span>
                      <span>Vatva GIDC, Ahmedabad</span>
                      <span style={{ color: '#64748b' }}>UPI VPA:</span>
                      <strong style={{ color: '#149346' }}>danzason@hdfcbank</strong>
                    </div>
                  </div>

                  {/* Notes if any */}
                  {currentInvoice.notes && (
                    <div
                      style={{
                        border: '1px solid #fef08a',
                        backgroundColor: '#fefce8',
                        padding: '8px 12px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        color: '#854d0e',
                      }}
                    >
                      <strong>Special Notes:</strong> {currentInvoice.notes}
                    </div>
                  )}

                  {/* Terms & Conditions */}
                  <div style={{ fontSize: '10px', color: '#64748b', lineHeight: '1.5' }}>
                    <div style={{ fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: '2px' }}>
                      Terms & Conditions:
                    </div>
                    <div>1. Goods once sold will not be accepted back or exchanged under any circumstances.</div>
                    <div>2. Payment is due strictly as per agreed payment terms. Interest @ 18% p.a. applies to overdue accounts.</div>
                    <div>3. All disputes are subject to Ahmedabad (Gujarat) jurisdiction only.</div>
                  </div>
                </div>

                {/* Right Side: Calculation Breakdown Box */}
                <div style={{ border: '1px solid #cbd5e1', borderRadius: '6px', overflow: 'hidden' }}>
                  <div
                    style={{
                      backgroundColor: '#f1f5f9',
                      padding: '8px 14px',
                      fontWeight: 700,
                      fontSize: '12px',
                      color: '#334155',
                      borderBottom: '1px solid #cbd5e1',
                      textTransform: 'uppercase',
                    }}
                  >
                    Summary & Total Breakdown
                  </div>
                  <div
                    style={{
                      padding: '12px 14px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                      fontSize: '12px',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#64748b' }}>Taxable Amount (Subtotal):</span>
                      <strong>₹{Number(currentInvoice.subtotal || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569' }}>
                      <span>Central GST (CGST - 9%):</span>
                      <span>₹{Number((currentInvoice.taxAmount || 0) / 2).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569' }}>
                      <span>State GST (SGST - 9%):</span>
                      <span>₹{Number((currentInvoice.taxAmount || 0) / 2).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '6px', borderTop: '1px dashed #e2e8f0', fontWeight: 600 }}>
                      <span style={{ color: '#64748b' }}>Total Tax (GST):</span>
                      <span>₹{Number(currentInvoice.taxAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b' }}>
                      <span>Round Off:</span>
                      <span>₹0.00</span>
                    </div>

                    {/* Grand Total Banner */}
                    <div
                      style={{
                        backgroundColor: '#149346',
                        color: '#ffffff',
                        margin: '4px -14px',
                        padding: '10px 14px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <span style={{ fontSize: '13px', fontWeight: 700, textTransform: 'uppercase' }}>Grand Total (INR):</span>
                      <span style={{ fontSize: '18px', fontWeight: 800 }}>
                        ₹{Number(currentInvoice.grandTotal || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#059669', fontWeight: 600, marginTop: '2px' }}>
                      <span>Amount Paid:</span>
                      <span>₹{Number(currentInvoice.amountPaid || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        color: (currentInvoice.balanceDue || 0) > 0 ? '#dc2626' : '#059669',
                        fontWeight: 800,
                        fontSize: '14px',
                        borderTop: '1px solid #e2e8f0',
                        paddingTop: '6px',
                      }}
                    >
                      <span>Balance Due:</span>
                      <span>₹{Number(currentInvoice.balanceDue || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Signatures & Declarations */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-end',
                  marginTop: '36px',
                  paddingTop: '16px',
                  borderTop: '1px solid #e2e8f0',
                }}
              >
                <div style={{ textAlign: 'left', minWidth: '180px' }}>
                  <div style={{ height: '40px' }} />
                  <div style={{ borderTop: '1px dashed #94a3b8', paddingTop: '4px', fontSize: '11px', fontWeight: 600, color: '#475569' }}>
                    Customer / Receiver's Signature & Stamp
                  </div>
                </div>

                <div style={{ textAlign: 'right', minWidth: '220px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    For DANZA SON ENTERPRISE
                  </div>
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '4px 10px',
                      backgroundColor: '#e8f7ee',
                      border: '1px solid #a7f3d0',
                      borderRadius: '4px',
                      marginBottom: '10px',
                    }}
                  >
                    <CheckCircle2 size={14} color="#149346" />
                    <span style={{ fontSize: '10px', fontWeight: 700, color: '#149346', textTransform: 'uppercase' }}>
                      Digitally Verified & Authorized
                    </span>
                  </div>
                  <div style={{ borderTop: '1px dashed #94a3b8', paddingTop: '4px', fontSize: '11px', fontWeight: 600, color: '#475569' }}>
                    Authorized Signatory
                  </div>
                </div>
              </div>

              {/* Computer Generated Notice */}
              <div
                style={{
                  textAlign: 'center',
                  fontSize: '10px',
                  color: '#94a3b8',
                  marginTop: '18px',
                  borderTop: '1px solid #f1f5f9',
                  paddingTop: '8px',
                }}
              >
                This is a computer-generated Tax Invoice generated by Danza SON ERP. Registered under GST Act, India.
              </div>
            </div>

            {/* Payment history log if present */}
            {currentInvoice.payments?.length > 0 && (
              <div style={{ marginTop: '20px', borderTop: '1px solid var(--color-border)', paddingTop: '12px' }}>
                <h5 style={{ fontSize: '13px', fontWeight: 700, marginBottom: '8px' }}>Payment History</h5>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {currentInvoice.payments.map((p, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: '12px',
                        background: '#f8fafc',
                        padding: '6px 12px',
                        borderRadius: '4px',
                      }}
                    >
                      <span>
                        {new Date(p.paymentDate).toLocaleDateString()} via {p.paymentMethod}{' '}
                        {p.referenceNumber ? `(${p.referenceNumber})` : ''}
                      </span>
                      <strong style={{ color: '#059669' }}>
                        ₹{Number(p.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </strong>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Modal Actions */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: '24px',
                flexWrap: 'wrap',
                gap: '10px',
              }}
            >
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => handleDownloadPdf(currentInvoice)}
                  disabled={generatingPdf}
                  title="Download Official PDF Tax Invoice"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                >
                  <FileDown size={17} />
                  <span>{generatingPdf ? 'Generating PDF...' : 'Download PDF Bill'}</span>
                </button>

                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => window.print()}
                  title="Print Tax Invoice or Save via Browser"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                >
                  <Printer size={17} />
                  <span>Print Bill</span>
                </button>

                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => handleSendInvoice(currentInvoice)}
                  title="Send Tax Invoice details directly to customer email"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    borderColor: '#149346',
                    color: '#149346',
                  }}
                >
                  <Send size={17} />
                  <span>Email to Customer</span>
                </button>
              </div>

              <button type="button" className="btn btn-outline" onClick={() => setIsViewOpen(false)}>
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
