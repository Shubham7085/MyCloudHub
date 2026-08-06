import React from 'react';
import { Link } from 'react-router-dom';

export function Login() {
  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column',
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh', 
      textAlign: 'center', 
      padding: '20px',
      backgroundColor: '#f9fafb',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '40px',
        borderRadius: '12px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        maxWidth: '400px',
        width: '100%'
      }}>
        <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#111827', marginBottom: '16px' }}>
          Login Temporarily Disabled
        </h2>
        <p style={{ color: '#4b5563', marginBottom: '24px', lineHeight: '1.5' }}>
          We are currently performing maintenance on our backend systems. Please check back later.
        </p>
        <Link 
          to="/" 
          style={{ 
            display: 'inline-block',
            backgroundColor: '#111827', 
            color: 'white', 
            padding: '10px 20px', 
            borderRadius: '6px', 
            textDecoration: 'none',
            fontWeight: '500'
          }}
        >
          Go back to Home
        </Link>
      </div>
    </div>
  );
}
