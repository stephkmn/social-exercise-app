import React, { useState } from 'react';
import { supabase } from './supabaseClient'; // Adjust the import path to your Supabase client

const SignUpForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      alert('Passwords do not match!');
      return;
    }

    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: displayName,
        },
      },
    });

    if (error) {
      alert(`Error: ${error.message}`);
    } else if (data.user) {
      alert('Sign-up successful! Please check your email to verify your account.');
      // Clear form
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setDisplayName('');
    }
    setLoading(false);
  };

  return (
    <div style={{ maxWidth: '420px', margin: '96px auto', padding: '24px', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
      <h2 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '24px' }}>Create a new account</h2>
      <form onSubmit={handleSignUp}>
        <div style={{ marginBottom: '16px' }}>
          <label htmlFor="displayName" style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Display Name</label>
          <input
            id="displayName"
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            required
            style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '4px' }}
          />
        </div>
        <div style={{ marginBottom: '16px' }}>
          <label htmlFor="email" style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '4px' }}
          />
        </div>
        <div style={{ marginBottom: '16px' }}>
          <label htmlFor="password" style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Password</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '4px' }}
          />
        </div>
        <div style={{ marginBottom: '24px' }}>
          <label htmlFor="confirmPassword" style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Confirm Password</label>
          <input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '4px' }}
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          style={{
            width: '100%',
            padding: '12px',
            border: 'none',
            borderRadius: '4px',
            backgroundColor: loading ? '#a0aec0' : '#2d3748',
            color: 'white',
            fontWeight: '700',
            cursor: 'pointer',
          }}
        >
          {loading ? 'Loading...' : 'Create Account'}
        </button>
      </form>
    </div>
  );
};

export default SignUpForm;
