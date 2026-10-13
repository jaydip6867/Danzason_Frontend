import React from 'react';
import { Sliders } from 'lucide-react';

const SettingsPage = () => {
  return (
    <div className="card" style={{ maxWidth: '640px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
        <Sliders size={24} color="var(--color-primary)" />
        <h2 style={{ fontSize: '18px', fontWeight: 600 }}>System Settings (Placeholder)</h2>
      </div>
      <p style={{ color: 'var(--color-text-muted)', fontSize: '14px', lineHeight: '1.6' }}>
        The Settings module is reserved as a placeholder for future ERP expansion (e.g., company profile, tax configuration, role access management, email templates).
      </p>
    </div>
  );
};

export default SettingsPage;
