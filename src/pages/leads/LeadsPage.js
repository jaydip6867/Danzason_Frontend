import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import Modal from '../../components/Modal';
import {
  UserCheck,
  Plus,
  Search,
  Edit2,
  Trash2,
  Eye,
  AlertCircle,
  Clock,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const LeadsPage = () => {
  const { hasPermission } = useAuth();
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Search & Filter
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sourceFilter, setSourceFilter] = useState('All');

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [currentLead, setCurrentLead] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);

  // Form inputs
  const initialFormState = {
    name: '',
    companyName: '',
    email: '',
    phone: '',
    alternatePhone: '',
    source: 'Website',
    interestedProduct: '',
    estimatedValue: '',
    status: 'New',
    followUpDate: '',
    notes: '',
  };
  const [formData, setFormData] = useState(initialFormState);
  const [submitting, setSubmitting] = useState(false);

  const fetchLeads = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const params = {};
      if (search) params.search = search;
      if (statusFilter !== 'All') params.status = statusFilter;
      if (sourceFilter !== 'All') params.source = sourceFilter;

      const res = await api.get('/leads', { params });
      if (res.data?.success) {
        setLeads(res.data.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch leads');
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, sourceFilter]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  const handleOpenAdd = () => {
    setFormData(initialFormState);
    setIsEditMode(false);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (lead) => {
    setFormData({
      name: lead.name || '',
      companyName: lead.companyName || '',
      email: lead.email || '',
      phone: lead.phone || '',
      alternatePhone: lead.alternatePhone || '',
      source: lead.source || 'Website',
      interestedProduct: lead.interestedProduct || '',
      estimatedValue: lead.estimatedValue || '',
      status: lead.status || 'New',
      followUpDate: lead.followUpDate ? lead.followUpDate.split('T')[0] : '',
      notes: lead.notes || '',
    });
    setCurrentLead(lead);
    setIsEditMode(true);
    setIsFormOpen(true);
  };

  const handleOpenView = (lead) => {
    setCurrentLead(lead);
    setIsViewOpen(true);
  };

  const handleOpenDelete = (lead) => {
    setCurrentLead(lead);
    setIsDeleteOpen(true);
  };

  const handleSubmitForm = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      if (isEditMode) {
        await api.put(`/leads/${currentLead._id}`, formData);
        setSuccess('Lead updated successfully!');
      } else {
        await api.post('/leads', formData);
        setSuccess('Lead added successfully!');
      }
      setIsFormOpen(false);
      fetchLeads();
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError(err.response?.data?.message || 'Error saving lead');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!currentLead) return;
    try {
      setSubmitting(true);
      await api.delete(`/leads/${currentLead._id}`);
      setSuccess('Lead deleted successfully!');
      setIsDeleteOpen(false);
      fetchLeads();
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete lead');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'New': return { bg: '#eff6ff', color: '#2563eb' };
      case 'Contacted': return { bg: '#fef3c7', color: '#d97706' };
      case 'Qualified': return { bg: '#f0fdf4', color: '#16a34a' };
      case 'Proposal': return { bg: '#faf5ff', color: '#9333ea' };
      case 'Won': return { bg: '#ecfdf5', color: '#059669' };
      case 'Lost': return { bg: '#fef2f2', color: '#dc2626' };
      default: return { bg: '#f1f5f9', color: '#475569' };
    }
  };

  return (
    <div>
      {/* Notifications */}
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

      {/* Header with Title and Add Button */}
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
          <h2 style={{ fontSize: '20px', fontWeight: 700 }}>Leads Management</h2>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '13px' }}>
            Track and manage sales prospects and follow-ups
          </p>
        </div>

        {hasPermission('leads', 'create') && (
          <button onClick={handleOpenAdd} className="btn btn-primary">
            <Plus size={16} />
            <span>Add New Lead</span>
          </button>
        )}
      </div>

      {/* Search and Filters Bar */}
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

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <select
            className="form-control"
            style={{ width: '160px' }}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="All">All Statuses</option>
            <option value="New">New</option>
            <option value="Contacted">Contacted</option>
            <option value="Qualified">Qualified</option>
            <option value="Proposal">Proposal</option>
            <option value="Won">Won</option>
            <option value="Lost">Lost</option>
          </select>

          <select
            className="form-control"
            style={{ width: '160px' }}
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
          >
            <option value="All">All Sources</option>
            <option value="Website">Website</option>
            <option value="Referral">Referral</option>
            <option value="Social Media">Social Media</option>
            <option value="Direct Call">Direct Call</option>
            <option value="Cold Outreach">Cold Outreach</option>
            <option value="Trade Show">Trade Show</option>
            <option value="Other">Other</option>
          </select>
        </div>
      </div>

      {/* Leads Table */}
      <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
        {loading ? (
          <div className="loading-box">
            <Clock className="animate-spin" size={28} color="var(--color-primary)" />
            <p>Loading leads...</p>
          </div>
        ) : leads.length === 0 ? (
          <div className="empty-state">
            <UserCheck size={40} className="empty-state-icon" />
            <h4 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--color-text-main)' }}>
              No leads found
            </h4>
            <p style={{ fontSize: '13px', marginTop: '4px' }}>
              Create your first lead to start tracking opportunities.
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
                  <th style={{ padding: '14px 16px', fontWeight: 600 }}>Lead ID</th>
                  <th style={{ padding: '14px 16px', fontWeight: 600 }}>Name</th>
                  <th style={{ padding: '14px 16px', fontWeight: 600 }}>Company</th>
                  <th style={{ padding: '14px 16px', fontWeight: 600 }}>Contact</th>
                  <th style={{ padding: '14px 16px', fontWeight: 600 }}>Source</th>
                  <th style={{ padding: '14px 16px', fontWeight: 600 }}>Estimated Value</th>
                  <th style={{ padding: '14px 16px', fontWeight: 600 }}>Status</th>
                  <th style={{ padding: '14px 16px', fontWeight: 600, textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {leads.map((lead) => {
                  const statusStyle = getStatusColor(lead.status);
                  return (
                    <tr
                      key={lead._id}
                      style={{ borderBottom: '1px solid var(--color-border-light)' }}
                    >
                      <td style={{ padding: '14px 16px', fontWeight: 700, color: 'var(--color-primary)' }}>
                        {lead.leadId}
                      </td>
                      <td style={{ padding: '14px 16px', fontWeight: 600 }}>{lead.name}</td>
                      <td style={{ padding: '14px 16px', color: 'var(--color-text-muted)' }}>
                        {lead.companyName || '-'}
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <div>{lead.phone}</div>
                        {lead.email && (
                          <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                            {lead.email}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '14px 16px' }}>{lead.source}</td>
                      <td style={{ padding: '14px 16px', fontWeight: 600 }}>
                        {lead.estimatedValue ? `₹${Number(lead.estimatedValue).toLocaleString('en-IN')}` : '-'}
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
                          {lead.status}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '8px' }}>
                          <button
                            onClick={() => handleOpenView(lead)}
                            title="View Lead"
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
                          {hasPermission('leads', 'edit') && (
                            <button
                              onClick={() => handleOpenEdit(lead)}
                              title="Edit Lead"
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
                          {hasPermission('leads', 'delete') && (
                            <button
                              onClick={() => handleOpenDelete(lead)}
                              title="Delete Lead"
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

      {/* Add / Edit Lead Modal */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={isEditMode ? `Edit Lead: ${currentLead?.leadId}` : 'Create New Lead'}
        maxWidth="680px"
      >
        <form onSubmit={handleSubmitForm}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">Full Name *</label>
              <input
                type="text"
                className="form-control"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Prospect Name"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Company Name</label>
              <input
                type="text"
                className="form-control"
                value={formData.companyName}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                placeholder="Organization or Firm"
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">Phone Number *</label>
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
                placeholder="Optional backup number"
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
                placeholder="lead@company.com"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Lead Source</label>
              <select
                className="form-control"
                value={formData.source}
                onChange={(e) => setFormData({ ...formData, source: e.target.value })}
              >
                <option value="Website">Website</option>
                <option value="Referral">Referral</option>
                <option value="Social Media">Social Media</option>
                <option value="Direct Call">Direct Call</option>
                <option value="Cold Outreach">Cold Outreach</option>
                <option value="Trade Show">Trade Show</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">Estimated Value (₹)</label>
              <input
                type="number"
                className="form-control"
                min="0"
                value={formData.estimatedValue}
                onChange={(e) => setFormData({ ...formData, estimatedValue: e.target.value })}
                placeholder="e.g. 50000"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Lead Status</label>
              <select
                className="form-control"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              >
                <option value="New">New</option>
                <option value="Contacted">Contacted</option>
                <option value="Qualified">Qualified</option>
                <option value="Proposal">Proposal</option>
                <option value="Won">Won</option>
                <option value="Lost">Lost</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">Interested Product / Service</label>
              <input
                type="text"
                className="form-control"
                value={formData.interestedProduct}
                onChange={(e) => setFormData({ ...formData, interestedProduct: e.target.value })}
                placeholder="Software, Service, or Consulting"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Follow-up Date</label>
              <input
                type="date"
                className="form-control"
                value={formData.followUpDate}
                onChange={(e) => setFormData({ ...formData, followUpDate: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Notes & Comments</label>
            <textarea
              className="form-control"
              rows="3"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Key discussion points, customer background, follow-up notes..."
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
              {submitting ? 'Saving...' : isEditMode ? 'Update Lead' : 'Create Lead'}
            </button>
          </div>
        </form>
      </Modal>

      {/* View Lead Details Modal */}
      <Modal
        isOpen={isViewOpen}
        onClose={() => setIsViewOpen(false)}
        title={`Lead Overview: ${currentLead?.leadId}`}
        maxWidth="600px"
      >
        {currentLead && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '12px', borderBottom: '1px solid var(--color-border)' }}>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 700 }}>{currentLead.name}</h3>
                <div style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>
                  {currentLead.companyName || 'Independent Prospect'}
                </div>
              </div>
              <span
                style={{
                  padding: '4px 12px',
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontWeight: 600,
                  backgroundColor: getStatusColor(currentLead.status).bg,
                  color: getStatusColor(currentLead.status).color,
                }}
              >
                {currentLead.status}
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '13px' }}>
              <div>
                <strong style={{ color: 'var(--color-text-muted)', display: 'block' }}>Phone:</strong>
                <span>{currentLead.phone}</span>
                {currentLead.alternatePhone && <span style={{ color: 'var(--color-text-muted)' }}> / {currentLead.alternatePhone}</span>}
              </div>
              <div>
                <strong style={{ color: 'var(--color-text-muted)', display: 'block' }}>Email:</strong>
                <span>{currentLead.email || 'None'}</span>
              </div>
              <div>
                <strong style={{ color: 'var(--color-text-muted)', display: 'block' }}>Source:</strong>
                <span>{currentLead.source}</span>
              </div>
              <div>
                <strong style={{ color: 'var(--color-text-muted)', display: 'block' }}>Estimated Value:</strong>
                <span style={{ fontWeight: 600 }}>
                  {currentLead.estimatedValue ? `₹${Number(currentLead.estimatedValue).toLocaleString('en-IN')}` : 'N/A'}
                </span>
              </div>
              <div>
                <strong style={{ color: 'var(--color-text-muted)', display: 'block' }}>Interested Product:</strong>
                <span>{currentLead.interestedProduct || 'N/A'}</span>
              </div>
              <div>
                <strong style={{ color: 'var(--color-text-muted)', display: 'block' }}>Follow-up Date:</strong>
                <span>{currentLead.followUpDate ? new Date(currentLead.followUpDate).toLocaleDateString() : 'Not scheduled'}</span>
              </div>
            </div>

            {currentLead.notes && (
              <div style={{ marginTop: '8px', padding: '12px', background: 'var(--color-bg-main)', borderRadius: 'var(--radius-md)' }}>
                <strong style={{ fontSize: '12px', color: 'var(--color-text-muted)', display: 'block', marginBottom: '4px' }}>
                  Notes & Details:
                </strong>
                <p style={{ fontSize: '13px', whiteSpace: 'pre-line' }}>{currentLead.notes}</p>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
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
        title="Confirm Delete Lead"
        maxWidth="440px"
      >
        <p style={{ fontSize: '14px', color: 'var(--color-text-muted)', marginBottom: '24px' }}>
          Are you sure you want to permanently delete lead <strong>{currentLead?.name} ({currentLead?.leadId})</strong>? This action cannot be undone.
        </p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <button className="btn btn-outline" onClick={() => setIsDeleteOpen(false)}>
            Cancel
          </button>
          <button className="btn btn-danger" onClick={handleDelete} disabled={submitting}>
            {submitting ? 'Deleting...' : 'Delete Lead'}
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default LeadsPage;
