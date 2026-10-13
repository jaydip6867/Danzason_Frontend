import React, { useState } from 'react';
import { Menu, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Topbar = ({ pageTitle, breadcrumb, onToggleSidebar }) => {
  const { user, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  return (
    <header className="topbar">
      <div className="topbar-left">
        <button
          onClick={onToggleSidebar}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            color: 'var(--color-text-main)',
          }}
          className="menu-button"
        >
          <Menu size={22} />
        </button>
        <div>
          <h1 className="page-title">{pageTitle || 'Dashboard'}</h1>
          <div className="breadcrumb">{breadcrumb || 'Home / Dashboard'}</div>
        </div>
      </div>

      <div className="topbar-right">
        <div style={{ position: 'relative' }}>
          <div
            className="user-badge"
            onClick={() => setDropdownOpen(!dropdownOpen)}
          >
            <div className="avatar">{getInitials(user?.name)}</div>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: '14px', fontWeight: 600 }}>
                {user?.name || 'User'}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                {user?.role || 'Role'}
              </div>
            </div>
          </div>

          {dropdownOpen && (
            <div
              style={{
                position: 'absolute',
                top: '115%',
                right: 0,
                width: '180px',
                background: '#ffffff',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                boxShadow: 'var(--shadow-md)',
                zIndex: 100,
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  padding: '12px 16px',
                  borderBottom: '1px solid var(--color-border)',
                }}
              >
                <div style={{ fontSize: '13px', fontWeight: 600 }}>{user?.name}</div>
                <div
                  style={{
                    fontSize: '11px',
                    color: 'var(--color-text-muted)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {user?.email}
                </div>
              </div>
              <button
                onClick={handleLogout}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 16px',
                  background: 'none',
                  border: 'none',
                  color: 'var(--color-danger)',
                  cursor: 'pointer',
                  fontSize: '13px',
                }}
              >
                <LogOut size={16} />
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Topbar;
