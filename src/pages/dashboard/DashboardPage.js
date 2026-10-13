import React, { useEffect, useState, useCallback } from 'react';
import api from '../../services/api';
import {
  Users,
  UserCheck,
  ShoppingCart,
  FileText,
  Receipt,
  IndianRupee,
  AlertCircle,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { Link } from 'react-router-dom';

const DashboardPage = () => {
  const [stats, setStats] = useState(null);
  const [recent, setRecent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const [statsRes, recentRes] = await Promise.all([
        api.get('/dashboard/stats'),
        api.get('/dashboard/recent'),
      ]);

      if (statsRes.data?.success) {
        setStats(statsRes.data.data);
      }
      if (recentRes.data?.success) {
        setRecent(recentRes.data.data);
      }
    } catch (err) {
      setError(
        err.response?.data?.message || 'Failed to load dashboard metrics.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  if (loading) {
    return (
      <div className="loading-box">
        <Clock className="animate-spin" size={32} color="var(--color-primary)" />
        <p>Loading real-time enterprise metrics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-danger">
        <AlertCircle size={20} />
        <span>{error}</span>
      </div>
    );
  }

  const { cards, distributions } = stats || {
    cards: {
      totalLeads: 0,
      totalCustomers: 0,
      totalOrders: 0,
      totalQuotations: 0,
      totalInvoices: 0,
      totalInvoiceAmount: 0,
      totalCollected: 0,
      totalDue: 0,
    },
    distributions: {
      leads: {},
      orders: {},
      invoices: {},
    },
  };

  const statCards = [
    {
      label: 'Total Leads',
      value: cards?.totalLeads || 0,
      icon: UserCheck,
      color: '#3b82f6',
      bg: '#eff6ff',
      link: '/leads',
    },
    {
      label: 'Total Customers',
      value: cards?.totalCustomers || 0,
      icon: Users,
      color: '#10b981',
      bg: '#ecfdf5',
      link: '/customers',
    },
    {
      label: 'Total Orders',
      value: cards?.totalOrders || 0,
      icon: ShoppingCart,
      color: '#8b5cf6',
      bg: '#f5f3ff',
      link: '/orders',
    },
    {
      label: 'Total Quotations',
      value: cards?.totalQuotations || 0,
      icon: FileText,
      color: '#f59e0b',
      bg: '#fffbeb',
      link: '/quotations',
    },
    {
      label: 'Total Invoices',
      value: cards?.totalInvoices || 0,
      icon: Receipt,
      color: '#06b6d4',
      bg: '#ecfeff',
      link: '/invoices',
    },
    {
      label: 'Total Invoiced Value',
      value: `₹${(cards?.totalInvoiceAmount || 0).toLocaleString('en-IN')}`,
      icon: IndianRupee,
      color: '#059669',
      bg: '#f0fdf4',
      link: '/invoices',
    },
  ];

  return (
    <div>
      {/* 6 Key Metrics Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '20px',
          marginBottom: '28px',
        }}
      >
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              className="card"
              style={{
                marginBottom: 0,
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                padding: '20px',
              }}
            >
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '10px',
                  backgroundColor: card.bg,
                  color: card.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Icon size={24} />
              </div>
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    fontSize: '13px',
                    color: 'var(--color-text-muted)',
                    fontWeight: 500,
                  }}
                >
                  {card.label}
                </div>
                <div
                  style={{
                    fontSize: '22px',
                    fontWeight: 700,
                    color: 'var(--color-text-main)',
                    marginTop: '2px',
                  }}
                >
                  {card.value}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Status Overviews Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '20px',
          marginBottom: '28px',
        }}
      >
        {/* Lead Status Overview */}
        <div className="card" style={{ marginBottom: 0 }}>
          <h3
            style={{
              fontSize: '15px',
              fontWeight: 600,
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span>Lead Status Overview</span>
            <Link
              to="/leads"
              style={{
                fontSize: '12px',
                color: 'var(--color-primary)',
                textDecoration: 'none',
              }}
            >
              View all
            </Link>
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {Object.entries(distributions?.leads || {}).map(([key, count]) => (
              <div
                key={key}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '13px',
                }}
              >
                <span style={{ color: 'var(--color-text-muted)' }}>{key}</span>
                <span
                  style={{
                    fontWeight: 600,
                    padding: '2px 8px',
                    borderRadius: '12px',
                    backgroundColor: '#f1f5f9',
                  }}
                >
                  {count}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Order Status Overview */}
        <div className="card" style={{ marginBottom: 0 }}>
          <h3
            style={{
              fontSize: '15px',
              fontWeight: 600,
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span>Order Status Overview</span>
            <Link
              to="/orders"
              style={{
                fontSize: '12px',
                color: 'var(--color-primary)',
                textDecoration: 'none',
              }}
            >
              View all
            </Link>
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {Object.entries(distributions?.orders || {}).map(([key, count]) => (
              <div
                key={key}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '13px',
                }}
              >
                <span style={{ color: 'var(--color-text-muted)' }}>{key}</span>
                <span
                  style={{
                    fontWeight: 600,
                    padding: '2px 8px',
                    borderRadius: '12px',
                    backgroundColor: '#f1f5f9',
                  }}
                >
                  {count}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Invoice Payment Overview */}
        <div className="card" style={{ marginBottom: 0 }}>
          <h3
            style={{
              fontSize: '15px',
              fontWeight: 600,
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span>Invoice Payment Status</span>
            <Link
              to="/invoices"
              style={{
                fontSize: '12px',
                color: 'var(--color-primary)',
                textDecoration: 'none',
              }}
            >
              View all
            </Link>
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {Object.entries(distributions?.invoices || {}).map(([key, count]) => (
              <div
                key={key}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '13px',
                }}
              >
                <span style={{ color: 'var(--color-text-muted)' }}>{key}</span>
                <span
                  style={{
                    fontWeight: 600,
                    padding: '2px 8px',
                    borderRadius: '12px',
                    backgroundColor: '#f1f5f9',
                  }}
                >
                  {count}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activity Tables */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))',
          gap: '20px',
        }}
      >
        {/* Recent Leads */}
        <div className="card" style={{ marginBottom: 0 }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '16px',
            }}
          >
            <h3 style={{ fontSize: '15px', fontWeight: 600 }}>Recent Leads</h3>
            <Link
              to="/leads"
              className="btn btn-outline btn-sm"
              style={{ textDecoration: 'none' }}
            >
              View Leads <ArrowRight size={14} />
            </Link>
          </div>
          {recent?.recentLeads?.length > 0 ? (
            <div style={{ overflowX: 'auto' }}>
              <table
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  fontSize: '13px',
                }}
              >
                <thead>
                  <tr
                    style={{
                      borderBottom: '1px solid var(--color-border)',
                      textAlign: 'left',
                      color: 'var(--color-text-muted)',
                    }}
                  >
                    <th style={{ padding: '8px' }}>Lead ID</th>
                    <th style={{ padding: '8px' }}>Name</th>
                    <th style={{ padding: '8px' }}>Company</th>
                    <th style={{ padding: '8px' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recent.recentLeads.map((lead) => (
                    <tr
                      key={lead._id}
                      style={{ borderBottom: '1px solid #f1f5f9' }}
                    >
                      <td style={{ padding: '10px 8px', fontWeight: 600 }}>
                        {lead.leadId}
                      </td>
                      <td style={{ padding: '10px 8px' }}>{lead.name}</td>
                      <td
                        style={{
                          padding: '10px 8px',
                          color: 'var(--color-text-muted)',
                        }}
                      >
                        {lead.companyName || '-'}
                      </td>
                      <td style={{ padding: '10px 8px' }}>
                        <span
                          style={{
                            padding: '3px 8px',
                            borderRadius: '4px',
                            fontSize: '12px',
                            background: '#eff6ff',
                            color: '#2563eb',
                            fontWeight: 600,
                          }}
                        >
                          {lead.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state" style={{ padding: '24px 0' }}>
              No leads added yet.
            </div>
          )}
        </div>

        {/* Recent Orders */}
        <div className="card" style={{ marginBottom: 0 }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '16px',
            }}
          >
            <h3 style={{ fontSize: '15px', fontWeight: 600 }}>Recent Orders</h3>
            <Link
              to="/orders"
              className="btn btn-outline btn-sm"
              style={{ textDecoration: 'none' }}
            >
              View Orders <ArrowRight size={14} />
            </Link>
          </div>
          {recent?.recentOrders?.length > 0 ? (
            <div style={{ overflowX: 'auto' }}>
              <table
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  fontSize: '13px',
                }}
              >
                <thead>
                  <tr
                    style={{
                      borderBottom: '1px solid var(--color-border)',
                      textAlign: 'left',
                      color: 'var(--color-text-muted)',
                    }}
                  >
                    <th style={{ padding: '8px' }}>Order ID</th>
                    <th style={{ padding: '8px' }}>Customer</th>
                    <th style={{ padding: '8px' }}>Total</th>
                    <th style={{ padding: '8px' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recent.recentOrders.map((ord) => (
                    <tr
                      key={ord._id}
                      style={{ borderBottom: '1px solid #f1f5f9' }}
                    >
                      <td style={{ padding: '10px 8px', fontWeight: 600 }}>
                        {ord.orderId}
                      </td>
                      <td style={{ padding: '10px 8px' }}>
                        {ord.customer?.name || 'Customer'}
                      </td>
                      <td style={{ padding: '10px 8px', fontWeight: 600 }}>
                        ₹{ord.grandTotal?.toLocaleString('en-IN')}
                      </td>
                      <td style={{ padding: '10px 8px' }}>
                        <span
                          style={{
                            padding: '3px 8px',
                            borderRadius: '4px',
                            fontSize: '12px',
                            background: '#f5f3ff',
                            color: '#7c3aed',
                            fontWeight: 600,
                          }}
                        >
                          {ord.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state" style={{ padding: '24px 0' }}>
              No orders placed yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
