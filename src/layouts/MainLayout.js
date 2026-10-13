import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';

const MainLayout = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  const getPageMeta = (pathname) => {
    if (pathname.startsWith('/dashboard')) {
      return { title: 'Dashboard Overview', breadcrumb: 'Danza SON ERP / Dashboard' };
    }
    if (pathname.startsWith('/leads')) {
      return { title: 'Leads Management', breadcrumb: 'Danza SON ERP / Leads' };
    }
    if (pathname.startsWith('/customers')) {
      return { title: 'Customers Directory', breadcrumb: 'Danza SON ERP / Customers' };
    }
    if (pathname.startsWith('/orders')) {
      return { title: 'Orders Management', breadcrumb: 'Danza SON ERP / Orders' };
    }
    if (pathname.startsWith('/quotations')) {
      return { title: 'Quotations Management', breadcrumb: 'Danza SON ERP / Quotations' };
    }
    if (pathname.startsWith('/invoices')) {
      return { title: 'Invoices & Billing', breadcrumb: 'Danza SON ERP / Invoices' };
    }
    if (pathname.startsWith('/settings')) {
      return { title: 'System Settings', breadcrumb: 'Danza SON ERP / Settings' };
    }
    return { title: 'Danza SON ERP', breadcrumb: 'ERP Portal' };
  };

  const { title, breadcrumb } = getPageMeta(location.pathname);

  return (
    <div className="app-container">
      <Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />
      <div className="main-wrapper">
        <Topbar
          pageTitle={title}
          breadcrumb={breadcrumb}
          onToggleSidebar={() => setMobileOpen(!mobileOpen)}
        />
        <main className="content-area">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
