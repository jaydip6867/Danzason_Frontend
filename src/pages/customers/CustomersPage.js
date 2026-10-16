import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import Modal from '../../components/Modal';
import {
  Users,
  Plus,
  Search,
  Edit2,
  Trash2,
  Eye,
  AlertCircle,
  Clock,
  FileText,
  ShoppingCart,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const CustomersPage = () => {
  const { hasPermission } = useAuth();
  const [customers, setCustomers] = useState([]);
  const [leads, setLeads] = useState([]);
  const [selectedLeadId, setSelectedLeadId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Search & Filters
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [currentCustomer, setCurrentCustomer] = useState(null);
  const [customerHistory, setCustomerHistory] = useState({ orders: [], quotations: [], invoices: [] });
  const [isEditMode, setIsEditMode] = useState(false);

  // Form State
  const initialFormState = {
    name: '',
    companyName: '',
    email: '',
    phone: '',
    alternatePhone: '',
    billingAddress: '',
    shippingAddress: '',
    gstNumber: '',
    panNumber: '',
    customerType: 'Corporate',
    notes: '',
  };
  const [formData, setFormData] = useState(initialFormState);
  const [submitting, setSubmitting] = useState(false);

  const fetchCustomers = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const params = {};
      if (search) params.search = search;
      if (typeFilter !== 'All') params.customerType = typeFilter;

      const [res, leadsRes] = await Promise.all([
        api.get('/customers', { params }),
        api.get('/leads?limit=100'),
      ]);

      if (res.data?.success) {
        setCustomers(res.data.data);
      }
      if (leadsRes.data?.success) {
        setLeads(leadsRes.data.data || []);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch customers');
    } finally {
      setLoading(false);
    }
  }, [search, typeFilter]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const handleOpenAdd = () => {
    setFormData(initialFormState);
    setSelectedLeadId('');
    setIsEditMode(false);
    setIsFormOpen(true);
  };

  const handleSelectLead = (leadId) => {
    setSelectedLeadId(leadId);
    if (!leadId) return;

    const lead = leads.find((l) => l._id === leadId);
    if (lead) {
      setFormData((prev) => ({
        ...prev,
        name: lead.name || prev.name,
        companyName: lead.companyName || prev.companyName,
        phone: lead.phone || prev.phone,
        alternatePhone: lead.alternatePhone || prev.alternatePhone,
        email: lead.email || prev.email,
        notes: lead.notes ? `Converted from Lead (${lead.leadId}): ${lead.notes}` : prev.notes,
      }));
    }
  };

  const handleOpenEdit = (customer) => {
    setFormData({
      name: customer.name || '',
      companyName: customer.companyName || '',
      email: customer.email || '',
      phone: customer.phone || '',
      alternatePhone: customer.alternatePhone || '',
      billingAddress: customer.billingAddress || '',
      shippingAddress: customer.shippingAddress || '',
      gstNumber: customer.gstNumber || '',
      panNumber: customer.panNumber || '',
      customerType: customer.customerType || 'Corporate',
      notes: customer.notes || '',
    });
    setCurrentCustomer(customer);
    setIsEditMode(true);
    setIsFormOpen(true);
  };

  const handleOpenView = async (customer) => {
    setCurrentCustomer(customer);
    setIsViewOpen(true);
    try {
      const res = await api.get(`/customers/${customer._id}`);
      if (res.data?.success) {
        setCustomerHistory({
          orders: res.data.data.orders || [],
          quotations: res.data.data.quotations || [],
          invoices: res.data.data.invoices || [],
        });
      }
    } catch (err) {
      console.error('Error fetching history:', err);
    }
  };

  const handleOpenDelete = (customer) => {
    setCurrentCustomer(customer);
    setIsDeleteOpen(true);
  };

  const handleSubmitForm = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      if (isEditMode) {
        await api.put(`/customers/${currentCustomer._id}`, formData);
        setSuccess('Customer updated successfully!');
      } else {
        await api.post('/customers', formData);
        setSuccess('Customer created successfully!');
      }
      setIsFormOpen(false);
      fetchCustomers();
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError(err.response?.data?.message || 'Error saving customer');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!currentCustomer) return;
    try {
      setSubmitting(true);
      await api.delete(`/customers/${currentCustomer._id}`);
      setSuccess('Customer deleted successfully!');
      setIsDeleteOpen(false);
      fetchCustomers();
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete customer');
    } finally {
      setSubmitting(false);
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
          <h2 style={{ fontSize: '20px', fontWeight: 700 }}>Customers Directory</h2>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '13px' }}>
            Manage client profiles, addresses, tax records, and purchase history
          </p>
        </div>

        {hasPermission('customers', 'create') && (
          <button onClick={handleOpenAdd} className="btn btn-primary">
            <Plus size={16} />
            <span>Add Customer</span>
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
            placeholder="Search by ID, name, company, email, phone..."
            style={{ paddingLeft: '38px' }}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select
          className="form-control"
          style={{ width: '180px' }}
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
        >
          <option value="All">All Customer Types</option>
          <option value="Corporate">Corporate</option>
          <option value="Individual">Individual</option>
          <option value="Wholesale">Wholesale</option>
          <option value="Retail">Retail</option>
        </select>
      </div>

      {/* Customers Table */}
      <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
        {loading ? (
          <div className="loading-box">
            <Clock className="animate-spin" size={28} color="var(--color-primary)" />
            <p>Loading customers...</p>
          </div>
        ) : customers.length === 0 ? (
          <div className="empty-state">
            <Users size={40} className="empty-state-icon" />
            <h4 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--color-text-main)' }}>
              No customers found
            </h4>
            <p style={{ fontSize: '13px', marginTop: '4px' }}>
              Add your first customer to establish client relationships.
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
                  <th style={{ padding: '14px 16px', fontWeight: 600 }}>Customer ID</th>
                  <th style={{ padding: '14px 16px', fontWeight: 600 }}>Customer Name</th>
                  <th style={{ padding: '14px 16px', fontWeight: 600 }}>Company</th>
                  <th style={{ padding: '14px 16px', fontWeight: 600 }}>Contact Details</th>
                  <th style={{ padding: '14px 16px', fontWeight: 600 }}>Type</th>
                  <th style={{ padding: '14px 16px', fontWeight: 600 }}>Tax / GST</th>
                  <th style={{ padding: '14px 16px', fontWeight: 600, textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((c) => (
                  <tr
                    key={c._id}
                    style={{ borderBottom: '1px solid var(--color-border-light)' }}
                  >
                    <td style={{ padding: '14px 16px', fontWeight: 700, color: 'var(--color-primary)' }}>
                      {c.customerId}
                    </td>
                    <td style={{ padding: '14px 16px', fontWeight: 600 }}>{c.name}</td>
                    <td style={{ padding: '14px 16px', color: 'var(--color-text-muted)' }}>
                      {c.companyName || '-'}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <div>{c.phone}</div>
                      {c.email && (
                        <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                          {c.email}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span
                        style={{
                          padding: '3px 8px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: 600,
                          backgroundColor: '#f1f5f9',
                          color: '#475569',
                        }}
                      >
                        {c.customerType}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: '12px' }}>
                      {c.gstNumber ? <span>GST: {c.gstNumber}</span> : <span style={{ color: 'var(--color-text-muted)' }}>-</span>}
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '8px' }}>
                        <button
                          onClick={() => handleOpenView(c)}
                          title="View Customer"
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
                        {hasPermission('customers', 'edit') && (
                          <button
                            onClick={() => handleOpenEdit(c)}
                            title="Edit Customer"
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
                        {hasPermission('customers', 'delete') && (
                          <button
                            onClick={() => handleOpenDelete(c)}
                            title="Delete Customer"
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
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Customer Modal */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={isEditMode ? `Edit Customer: ${currentCustomer?.customerId}` : 'Create New Customer'}
        maxWidth="700px"
      >
        <form onSubmit={handleSubmitForm}>
          {/* Select Lead Option (Shown only when creating a new customer) */}
          {!isEditMode && leads.length > 0 && (
            <div
              style={{
                marginBottom: '16px',
                padding: '12px 14px',
                backgroundColor: 'var(--color-primary-light)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border)',
              }}
            >
              <label className="form-label" style={{ color: 'var(--color-primary)', fontWeight: 700, marginBottom: '6px' }}>
                🔗 Select from Existing Leads (Optional)
              </label>
              <select
                className="form-control"
                value={selectedLeadId}
                onChange={(e) => handleSelectLead(e.target.value)}
                style={{ backgroundColor: '#ffffff' }}
              >
                <option value="">-- Choose Lead to Auto-fill details or enter manually --</option>
                {leads.map((l) => (
                  <option key={l._id} value={l._id}>
                    {l.name} {l.companyName ? `(${l.companyName})` : ''} - {l.leadId} [{l.status}]
                  </option>
                ))}
              </select>
              <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '4px', display: 'block' }}>
                Selecting a lead will automatically populate customer name, company, phone, email, and notes.
              </span>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">Customer Name *</label>
              <input
                type="text"
                className="form-control"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Full Client Name"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Company / Firm Name</label>
              <input
                type="text"
                className="form-control"
                value={formData.companyName}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                placeholder="Registered Business Name"
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">Primary Phone *</label>
              <input
                type="tel"
                className="form-control"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+91 9876543210"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Alternate Phone</label>
              <input
                type="tel"
                className="form-control"
                value={formData.alternatePhone}
                onChange={(e) => setFormData({ ...formData, alternatePhone: e.target.value })}
                placeholder="Secondary phone"
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                type="email"
                className="form-control"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="billing@client.com"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Customer Classification</label>
              <select
                className="form-control"
                value={formData.customerType}
                onChange={(e) => setFormData({ ...formData, customerType: e.target.value })}
              >
                <option value="Corporate">Corporate</option>
                <option value="Individual">Individual</option>
                <option value="Wholesale">Wholesale</option>
                <option value="Retail">Retail</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">GST Number</label>
              <input
                type="text"
                className="form-control"
                value={formData.gstNumber}
                onChange={(e) => setFormData({ ...formData, gstNumber: e.target.value.toUpperCase() })}
                placeholder="24ABCDE1234F1Z5"
              />
            </div>
            <div className="form-group">
              <label className="form-label">PAN Number</label>
              <input
                type="text"
                className="form-control"
                value={formData.panNumber}
                onChange={(e) => setFormData({ ...formData, panNumber: e.target.value.toUpperCase() })}
                placeholder="ABCDE1234F"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Billing Address</label>
            <textarea
              className="form-control"
              rows="2"
              value={formData.billingAddress}
              onChange={(e) => setFormData({ ...formData, billingAddress: e.target.value })}
              placeholder="Office / Invoicing Address"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Shipping Address</label>
            <textarea
              className="form-control"
              rows="2"
              value={formData.shippingAddress}
              onChange={(e) => setFormData({ ...formData, shippingAddress: e.target.value })}
              placeholder="Delivery / Warehouse Address"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Internal Notes</label>
            <input
              type="text"
              className="form-control"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Payment terms preference, key account manager remarks..."
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => setIsFormOpen(false)}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Saving...' : isEditMode ? 'Update Customer' : 'Create Customer'}
            </button>
          </div>
        </form>
      </Modal>

      {/* View Customer Details and History Modal */}
      <Modal
        isOpen={isViewOpen}
        onClose={() => setIsViewOpen(false)}
        title={`Customer Profile: ${currentCustomer?.customerId}`}
        maxWidth="750px"
      >
        {currentCustomer && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '16px', borderBottom: '1px solid var(--color-border)' }}>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 700 }}>{currentCustomer.name}</h3>
                <div style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>
                  {currentCustomer.companyName || 'Individual Customer'}
                </div>
              </div>
              <span
                style={{
                  padding: '4px 12px',
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontWeight: 600,
                  backgroundColor: '#f1f5f9',
                  color: '#334155',
                }}
              >
                {currentCustomer.customerType}
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '13px', margin: '16px 0' }}>
              <div>
                <strong style={{ color: 'var(--color-text-muted)', display: 'block' }}>Contact Phone:</strong>
                <span>{currentCustomer.phone}</span>
                {currentCustomer.alternatePhone && <span> / {currentCustomer.alternatePhone}</span>}
              </div>
              <div>
                <strong style={{ color: 'var(--color-text-muted)', display: 'block' }}>Email:</strong>
                <span>{currentCustomer.email || 'None'}</span>
              </div>
              <div>
                <strong style={{ color: 'var(--color-text-muted)', display: 'block' }}>GST Number:</strong>
                <span>{currentCustomer.gstNumber || 'Unregistered'}</span>
              </div>
              <div>
                <strong style={{ color: 'var(--color-text-muted)', display: 'block' }}>PAN Number:</strong>
                <span>{currentCustomer.panNumber || 'N/A'}</span>
              </div>
            </div>

            <div style={{ fontSize: '13px', marginBottom: '16px' }}>
              <strong style={{ color: 'var(--color-text-muted)', display: 'block' }}>Billing Address:</strong>
              <p style={{ marginTop: '2px' }}>{currentCustomer.billingAddress || 'No billing address provided'}</p>
            </div>

            {/* History Section: Orders, Quotations */}
            <div style={{ marginTop: '24px', borderTop: '1px solid var(--color-border)', paddingTop: '16px' }}>
              <h4 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '12px' }}>
                Customer Purchase & Quotation History
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div style={{ padding: '12px', background: '#f8fafc', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, fontSize: '13px', marginBottom: '8px' }}>
                    <ShoppingCart size={16} color="var(--color-primary)" />
                    <span>Orders ({customerHistory.orders.length})</span>
                  </div>
                  {customerHistory.orders.length === 0 ? (
                    <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>No orders placed yet.</div>
                  ) : (
                    customerHistory.orders.map((ord) => (
                      <div key={ord._id} style={{ fontSize: '12px', padding: '4px 0', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between' }}>
                        <span>{ord.orderId}</span>
                        <strong>₹{ord.grandTotal?.toLocaleString('en-IN')}</strong>
                      </div>
                    ))
                  )}
                </div>

                <div style={{ padding: '12px', background: '#f8fafc', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, fontSize: '13px', marginBottom: '8px' }}>
                    <FileText size={16} color="#d97706" />
                    <span>Quotations ({customerHistory.quotations.length})</span>
                  </div>
                  {customerHistory.quotations.length === 0 ? (
                    <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>No quotations generated yet.</div>
                  ) : (
                    customerHistory.quotations.map((qt) => (
                      <div key={qt._id} style={{ fontSize: '12px', padding: '4px 0', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between' }}>
                        <span>{qt.quotationNumber}</span>
                        <strong>₹{qt.grandTotal?.toLocaleString('en-IN')}</strong>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
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
        title="Confirm Delete Customer"
        maxWidth="440px"
      >
        <p style={{ fontSize: '14px', color: 'var(--color-text-muted)', marginBottom: '24px' }}>
          Are you sure you want to delete customer <strong>{currentCustomer?.name} ({currentCustomer?.customerId})</strong>?
        </p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <button className="btn btn-outline" onClick={() => setIsDeleteOpen(false)}>
            Cancel
          </button>
          <button className="btn btn-danger" onClick={handleDelete} disabled={submitting}>
            {submitting ? 'Deleting...' : 'Delete Customer'}
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default CustomersPage;
