import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  UserCheck,
  Users,
  ShoppingCart,
  FileText,
  Receipt,
  Package,
  Settings,
  LogOut,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Sidebar = ({ mobileOpen, setMobileOpen }) => {
  const { logout, hasPermission } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItems = [
    {
      to: '/dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      module: null, // always accessible to logged in
    },
    {
      to: '/leads',
      label: 'Leads',
      icon: UserCheck,
      module: 'leads',
    },
    {
      to: '/customers',
      label: 'Customers',
      icon: Users,
      module: 'customers',
    },
    {
      to: '/orders',
      label: 'Orders',
      icon: ShoppingCart,
      module: 'orders',
    },
    {
      to: '/purchases',
      label: 'Purchases',
      icon: Package,
      module: 'purchases',
    },
    {
      to: '/quotations',
      label: 'Quotations',
      icon: FileText,
      module: 'quotations',
    },
    {
      to: '/invoices',
      label: 'Invoices',
      icon: Receipt,
      module: 'invoices',
    },
  ];

  return (
    <aside className={`sidebar ${mobileOpen ? 'mobile-open' : ''}`}>
      <div className="sidebar-brand">
        <div className="brand-badge">DZS</div>
        <div className="brand-title">DANZA SON ERP</div>
        {mobileOpen && (
          <button
            onClick={() => setMobileOpen(false)}
            style={{
              marginLeft: 'auto',
              background: 'transparent',
              border: 'none',
              color: '#fff',
              cursor: 'pointer',
            }}
          >
            <X size={20} />
          </button>
        )}
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => {
          // If item is restricted, check permission
          if (item.module && !hasPermission(item.module, 'view')) {
            return null;
          }
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `nav-link ${isActive ? 'active' : ''}`
              }
              onClick={() => setMobileOpen(false)}
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <NavLink
          to="/settings"
          className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          onClick={() => setMobileOpen(false)}
        >
          <Settings size={18} />
          <span>Settings</span>
        </NavLink>
        <button
          onClick={handleLogout}
          className="nav-link"
          style={{
            background: 'transparent',
            border: 'none',
            width: '100%',
            cursor: 'pointer',
            textAlign: 'left',
          }}
        >
          <LogOut size={18} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
