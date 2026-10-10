import React, { useState, useEffect } from 'react';
import {
  RadioTower, Shield, Key, Eye, EyeOff, Copy, Check, AlertTriangle,
  RefreshCw, Database, Lock, Server, ShieldAlert
} from 'lucide-react';
import {
  isSupabaseConfigured,
  getSupabaseAnonKey,
  setSupabaseAnonKey,
  checkDatabaseSetup,
  completeSystemSetupInDB,
  verifyStationLoginDB,
  checkDroneRelayProvisioned,
  provisionDroneRelayCredentials,
  SUPABASE_PROJECT_URL,
  type StationId,
} from '../../lib/supabase';
import { generateSecurePassword } from '../../lib/cryptoAuth';

interface LoginPageProps {
  onLoginSuccess: (station: StationId) => void;
}

export function LoginPage({ onLoginSuccess }: LoginPageProps) {
  // Setup & Configuration States
  const [hasAnonKey, setHasAnonKey] = useState(isSupabaseConfigured());
  const [anonKeyInput, setAnonKeyInput] = useState(getSupabaseAnonKey());
  const [isCheckingDB, setIsCheckingDB] = useState(false);
  const [isSetupDone, setIsSetupDone] = useState(false);
  const [configError, setConfigError] = useState<string | null>(null);

  // First-time generated credentials state
  const [generatedPassA, setGeneratedPassA] = useState('');
  const [generatedPassC, setGeneratedPassC] = useState('');
  const [generatedPassRelay, setGeneratedPassRelay] = useState('');
  const [copiedA, setCopiedA] = useState(false);
  const [copiedC, setCopiedC] = useState(false);
  const [copiedRelay, setCopiedRelay] = useState(false);
  const [isProvisioning, setIsProvisioning] = useState(false);
  const [provisionError, setProvisionError] = useState<string | null>(null);
  const [isRelayProvisioned, setIsRelayProvisioned] = useState(true);
  const [showRelayModal, setShowRelayModal] = useState(false);

  // Login form state
  const [selectedStation, setSelectedStation] = useState<StationId>('BASE_A');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Check database configuration and setup on mount
  useEffect(() => {
    async function checkStatus() {
      if (!isSupabaseConfigured()) {
        setHasAnonKey(false);
        return;
      }
      setIsCheckingDB(true);
      setConfigError(null);
      const res = await checkDatabaseSetup();
      setIsCheckingDB(false);

      if (res.error) {
        setConfigError(res.error);
        setIsSetupDone(false);
      } else {
        setIsSetupDone(res.isSetupCompleted);
        if (!res.isSetupCompleted) {
          // Generate fresh passwords ready for provisioning
          setGeneratedPassA(generateSecurePassword('ALPHA'));
          setGeneratedPassC(generateSecurePassword('CHARLIE'));
          setGeneratedPassRelay(generateSecurePassword('RELAY'));
        } else {
          // Check if Drone Relay is provisioned
          const relayDone = await checkDroneRelayProvisioned();
          setIsRelayProvisioned(relayDone);
          if (!relayDone) {
            setGeneratedPassRelay(generateSecurePassword('RELAY'));
          }
        }
      }
    }

    checkStatus();
  }, [hasAnonKey]);

  // Handle saving Anon Key from UI
  function handleSaveAnonKey(e: React.FormEvent) {
    e.preventDefault();
    if (!anonKeyInput.trim()) return;
    setSupabaseAnonKey(anonKeyInput.trim(), true);
    setHasAnonKey(true);
  }

  // Handle first-time setup confirmation
  async function handleConfirmSetup() {
    setIsProvisioning(true);
    setProvisionError(null);
    const res = await completeSystemSetupInDB(generatedPassA, generatedPassC, generatedPassRelay);
    setIsProvisioning(false);

    if (!res.success) {
      setProvisionError(res.error || 'Failed to initialize credentials in database.');
    } else {
      setIsSetupDone(true);
      setIsRelayProvisioned(true);
    }
  }

  // Handle dedicated Drone Relay provisioning
  async function handleProvisionRelay() {
    setIsProvisioning(true);
    setProvisionError(null);
    const res = await provisionDroneRelayCredentials(generatedPassRelay);
    setIsProvisioning(false);

    if (!res.success) {
      setProvisionError(res.error || 'Failed to provision Drone Relay in database. (Check if migration_drone_relay.sql was run)');
    } else {
      setIsRelayProvisioned(true);
      setShowRelayModal(false);
    }
  }

  // Detect matching station from password prefix
  const detectedStation = (() => {
    const p = password.trim().toUpperCase();
    if (p.startsWith('FRIDAY-CHARLIE-') || p.startsWith('CHARLIE-')) return 'BASE_C';
    if (p.startsWith('FRIDAY-ALPHA-') || p.startsWith('ALPHA-')) return 'BASE_A';
    if (p.startsWith('FRIDAY-RELAY-') || p.startsWith('RELAY-')) return 'DRONE_RELAY';
    return null;
  })();

  // Handle Login submission
  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!password.trim()) {
      setAuthError('Please enter the station password.');
      return;
    }

    // Auto-align station if password prefix clearly indicates another station
    let stationToVerify = selectedStation;
    if (detectedStation && detectedStation !== selectedStation) {
      stationToVerify = detectedStation;
      setSelectedStation(detectedStation);
    }

    setIsAuthenticating(true);
    setAuthError(null);

    const res = await verifyStationLoginDB(stationToVerify, password);
    setIsAuthenticating(false);

    if (!res.success) {
      setAuthError(res.error || 'Authentication failed. Please verify credentials.');
    } else {
      // Save authenticated station in session
      sessionStorage.setItem('friday_authenticated_station', stationToVerify);
      onLoginSuccess(stationToVerify);
    }
  }

  // Copy helper
  function copyToClipboard(text: string, type: 'A' | 'C' | 'RELAY') {
    navigator.clipboard.writeText(text);
    if (type === 'A') {
      setCopiedA(true);
      setTimeout(() => setCopiedA(false), 2500);
    } else if (type === 'C') {
      setCopiedC(true);
      setTimeout(() => setCopiedC(false), 2500);
    } else {
      setCopiedRelay(true);
      setTimeout(() => setCopiedRelay(false), 2500);
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#0A0A0A',
      backgroundImage: 'radial-gradient(circle at 50% 0%, rgba(192, 0, 0, 0.12) 0%, transparent 70%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      fontFamily: 'var(--font-sans)',
      color: '#F5F5F5',
    }}>
      <div style={{
        width: '100%',
        maxWidth: '520px',
        backgroundColor: '#141414',
        border: '1px solid #282828',
        borderRadius: '14px',
        boxShadow: '0 20px 40px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.03)',
        overflow: 'hidden',
      }}>
        {/* Header Branding */}
        <div style={{
          padding: '32px 32px 24px',
          borderBottom: '1px solid #222',
          textAlign: 'center',
        }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #2A1010, #171717)',
            border: '1px solid #800000',
            marginBottom: '16px',
          }}>
            <RadioTower style={{ width: '24px', height: '24px', color: '#C00000' }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <h1 style={{ fontSize: '22px', fontWeight: 800, letterSpacing: '0.04em', margin: 0 }}>
              F.R.I.D.A.Y.
            </h1>
            <span style={{
              fontSize: '10px',
              fontFamily: 'var(--font-mono)',
              padding: '2px 6px',
              borderRadius: '4px',
              backgroundColor: '#202020',
              border: '1px solid #333',
              color: '#B8B8B8',
            }}>
              v2.4 LTS
            </span>
          </div>
          <p style={{ fontSize: '13px', color: '#858585', margin: '6px 0 0' }}>
            Flying Relay Infrastructure for Dynamic Area · Emergency Mission Control
          </p>
        </div>

        {/* Checking Database Status Spinner */}
        {isCheckingDB && (
          <div style={{ padding: '32px', textAlign: 'center', color: '#B8B8B8', fontSize: '13px' }}>
            <RefreshCw style={{ width: '20px', height: '20px', margin: '0 auto 12px', animation: 'spin 1s linear infinite', color: '#C00000' }} />
            <div>Checking Supabase PostgreSQL connection & credentials...</div>
          </div>
        )}

        {/* Database Config Error Warning */}
        {configError && (
          <div style={{
            margin: '24px 32px 0',
            padding: '14px 16px',
            borderRadius: '8px',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#FCA5A5',
            fontSize: '12.5px',
          }}>
            <div style={{ fontWeight: 700, marginBottom: '4px', color: '#EF4444' }}>Database Status Alert</div>
            <div>{configError}</div>
            <div style={{ marginTop: '6px', fontSize: '11.5px', color: '#B8B8B8' }}>
              Ensure you have executed <code style={{ color: '#FFF' }}>supabase/schema.sql</code> in your Supabase SQL Editor.
            </div>
          </div>
        )}

        {/* ─── CASE 1: Missing Supabase Anon Key ─── */}
        {!hasAnonKey && !isCheckingDB && (
          <div style={{ padding: '32px' }}>
            <div style={{
              padding: '16px',
              borderRadius: '8px',
              backgroundColor: 'rgba(245, 158, 11, 0.08)',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              marginBottom: '24px',
              fontSize: '12.5px',
              color: '#FCD34D',
              display: 'flex',
              gap: '12px',
            }}>
              <Database style={{ width: '18px', height: '18px', flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong style={{ display: 'block', marginBottom: '4px', color: '#FBBF24' }}>
                  Supabase Cloud Database Setup Required
                </strong>
                Target URL: <code style={{ fontFamily: 'var(--font-mono)', color: '#FFF' }}>{SUPABASE_PROJECT_URL}</code>
                <p style={{ margin: '6px 0 0', color: '#E5E5E5' }}>
                  Enter your Supabase Project Public/Anon key below, or define <code style={{ color: '#FBBF24' }}>VITE_SUPABASE_ANON_KEY</code> in Vercel environment variables.
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveAnonKey} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label" style={{ fontSize: '12px', color: '#B8B8B8' }}>
                  Supabase Public/Anon API Key
                </label>
                <input
                  type="text"
                  required
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  value={anonKeyInput}
                  onChange={e => setAnonKeyInput(e.target.value)}
                  className="input"
                  style={{ fontFamily: 'var(--font-mono)', fontSize: '12px' }}
                />
              </div>

              <button type="submit" className="btn btn-primary" style={{ padding: '12px', fontSize: '13px' }}>
                <Server style={{ width: '14px', height: '14px' }} />
                Save & Connect Database
              </button>
            </form>

            <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #222', fontSize: '11.5px', color: '#858585' }}>
              Note: Ensure you have executed the schema migration script located at <code style={{ color: '#FFF' }}>supabase/schema.sql</code> in your Supabase SQL editor.
            </div>
          </div>
        )}

        {/* ─── CASE 2: Supabase configured, but First-Time Setup pending ─── */}
        {hasAnonKey && !isSetupDone && (
          <div style={{ padding: '32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <Shield style={{ width: '20px', height: '20px', color: '#C00000' }} />
              <h2 style={{ fontSize: '16px', fontWeight: 700, margin: 0 }}>
                First-Time Security Provisioning
              </h2>
            </div>

            <p style={{ fontSize: '12.5px', color: '#A3A3A3', marginBottom: '20px', lineHeight: 1.5 }}>
              Separate cryptographically secure passwords have been generated for each station.
              Copy and save these credentials now for your presentation.
            </p>

            {/* Station A Password Box */}
            <div style={{
              background: '#1A1A1A',
              border: '1px solid #2D2D2D',
              borderRadius: '8px',
              padding: '14px 16px',
              marginBottom: '12px',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ fontSize: '12px', fontWeight: 600, color: '#C00000' }}>
                  Base Station Alpha (0xFA) Password
                </span>
                <span style={{ fontSize: '10px', color: '#777', fontFamily: 'var(--font-mono)' }}>ORIGIN GROUND</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                <code style={{ fontSize: '14px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: '#F5F5F5', letterSpacing: '0.04em' }}>
                  {generatedPassA}
                </code>
                <button
                  type="button"
                  onClick={() => copyToClipboard(generatedPassA, 'A')}
                  className="btn btn-secondary"
                  style={{ padding: '6px 12px', fontSize: '11px', flexShrink: 0 }}
                >
                  {copiedA ? <Check style={{ width: '12px', height: '12px', color: '#4ADE80' }} /> : <Copy style={{ width: '12px', height: '12px' }} />}
                  {copiedA ? 'Copied' : 'Copy'}
                </button>
              </div>
            </div>

            {/* Station C Password Box */}
            <div style={{
              background: '#1A1A1A',
              border: '1px solid #2D2D2D',
              borderRadius: '8px',
              padding: '14px 16px',
              marginBottom: '20px',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ fontSize: '12px', fontWeight: 600, color: '#800000' }}>
                  Base Station Charlie (0xFF) Password
                </span>
                <span style={{ fontSize: '10px', color: '#777', fontFamily: 'var(--font-mono)' }}>COMMAND HQ</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                <code style={{ fontSize: '14px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: '#F5F5F5', letterSpacing: '0.04em' }}>
                  {generatedPassC}
                </code>
                <button
                  type="button"
                  onClick={() => copyToClipboard(generatedPassC, 'C')}
                  className="btn btn-secondary"
                  style={{ padding: '6px 12px', fontSize: '11px', flexShrink: 0 }}
                >
                  {copiedC ? <Check style={{ width: '12px', height: '12px', color: '#4ADE80' }} /> : <Copy style={{ width: '12px', height: '12px' }} />}
                  {copiedC ? 'Copied' : 'Copy'}
                </button>
              </div>
            </div>

            {/* Drone Relay Password Box */}
            <div style={{
              background: '#1A1A1A',
              border: '1px solid #2D2D2D',
              borderRadius: '8px',
              padding: '14px 16px',
              marginBottom: '20px',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ fontSize: '12px', fontWeight: 600, color: '#FFAAAA' }}>
                  Drone Relay Monitoring Operator Password
                </span>
                <span style={{ fontSize: '10px', color: '#777', fontFamily: 'var(--font-mono)' }}>AIRBORNE MONITOR</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                <code style={{ fontSize: '14px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: '#F5F5F5', letterSpacing: '0.04em' }}>
                  {generatedPassRelay}
                </code>
                <button
                  type="button"
                  onClick={() => copyToClipboard(generatedPassRelay, 'RELAY')}
                  className="btn btn-secondary"
                  style={{ padding: '6px 12px', fontSize: '11px', flexShrink: 0 }}
                >
                  {copiedRelay ? <Check style={{ width: '12px', height: '12px', color: '#4ADE80' }} /> : <Copy style={{ width: '12px', height: '12px' }} />}
                  {copiedRelay ? 'Copied' : 'Copy'}
                </button>
              </div>
            </div>

            {provisionError && (
              <div style={{
                padding: '12px',
                borderRadius: '6px',
                background: 'rgba(255, 0, 0, 0.1)',
                border: '1px solid rgba(255, 0, 0, 0.3)',
                color: '#FF6B6B',
                fontSize: '12px',
                marginBottom: '16px',
              }}>
                {provisionError}
              </div>
            )}

            <button
              type="button"
              disabled={isProvisioning}
              onClick={handleConfirmSetup}
              className="btn btn-primary"
              style={{ width: '100%', padding: '12px', fontSize: '13px' }}
            >
              <Lock style={{ width: '14px', height: '14px' }} />
              {isProvisioning ? 'Hashing & Storing Credentials...' : 'Store Salted Hashes & Proceed to Login'}
            </button>
          </div>
        )}

        {/* ─── CASE 3: Standard Station Login ─── */}
        {hasAnonKey && isSetupDone && (
          <div style={{ padding: '32px' }}>
            {/* Optional Drone Relay Provisioning Alert if not yet provisioned */}
            {!isRelayProvisioned && (
              <div style={{
                marginBottom: '20px',
                padding: '14px 16px',
                borderRadius: '8px',
                background: 'rgba(128, 0, 0, 0.15)',
                border: '1px solid rgba(192, 0, 0, 0.4)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <ShieldAlert style={{ width: '16px', height: '16px', color: '#FF6B6B' }} />
                    <span style={{ fontSize: '12.5px', fontWeight: 700, color: '#F5F5F5' }}>
                      Drone Relay Role Not Provisioned Yet
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowRelayModal(!showRelayModal)}
                    className="btn btn-secondary"
                    style={{ fontSize: '11px', padding: '4px 8px' }}
                  >
                    {showRelayModal ? 'Dismiss' : 'Provision Relay'}
                  </button>
                </div>
                <p style={{ fontSize: '11.5px', color: '#B8B8B8', margin: 0, lineHeight: 1.4 }}>
                  To enable third-station unified monitoring, generate and save the Drone Relay password.
                </p>

                {showRelayModal && (
                  <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '10px' }}>
                      <code style={{ fontSize: '13px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: '#FFAAAA' }}>
                        {generatedPassRelay}
                      </code>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(generatedPassRelay, 'RELAY')}
                        className="btn btn-secondary"
                        style={{ padding: '4px 8px', fontSize: '11px' }}
                      >
                        {copiedRelay ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                    {provisionError && (
                      <div style={{ fontSize: '11.5px', color: '#FF6B6B', marginBottom: '8px' }}>
                        {provisionError}
                      </div>
                    )}
                    <button
                      type="button"
                      disabled={isProvisioning}
                      onClick={handleProvisionRelay}
                      className="btn btn-primary"
                      style={{ width: '100%', fontSize: '12px', padding: '8px' }}
                    >
                      {isProvisioning ? 'Saving Hash...' : 'Save Relay Hash to Database'}
                    </button>
                  </div>
                )}
              </div>
            )}

            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Station Selection */}
              <div>
                <label className="form-label" style={{ fontSize: '12px', color: '#B8B8B8', marginBottom: '8px' }}>
                  Target Station Role & Dashboard
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => { setSelectedStation('BASE_A'); setAuthError(null); }}
                    style={{
                      padding: '10px 8px',
                      borderRadius: '8px',
                      border: '1px solid',
                      borderColor: selectedStation === 'BASE_A' ? '#C00000' : '#2D2D2D',
                      background: selectedStation === 'BASE_A' ? 'rgba(192, 0, 0, 0.14)' : '#181818',
                      color: selectedStation === 'BASE_A' ? '#F5F5F5' : '#888',
                      cursor: 'pointer',
                      textAlign: 'center',
                      transition: 'all 120ms ease',
                    }}
                  >
                    <div style={{ fontSize: '12px', fontWeight: 700, color: selectedStation === 'BASE_A' ? '#FFF' : '#B8B8B8' }}>
                      Base Station A
                    </div>
                    <div style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', marginTop: '2px', opacity: 0.8 }}>
                      0xFA · Field
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => { setSelectedStation('BASE_C'); setAuthError(null); }}
                    style={{
                      padding: '10px 8px',
                      borderRadius: '8px',
                      border: '1px solid',
                      borderColor: selectedStation === 'BASE_C' ? '#C00000' : '#2D2D2D',
                      background: selectedStation === 'BASE_C' ? 'rgba(192, 0, 0, 0.14)' : '#181818',
                      color: selectedStation === 'BASE_C' ? '#F5F5F5' : '#888',
                      cursor: 'pointer',
                      textAlign: 'center',
                      transition: 'all 120ms ease',
                    }}
                  >
                    <div style={{ fontSize: '12px', fontWeight: 700, color: selectedStation === 'BASE_C' ? '#FFF' : '#B8B8B8' }}>
                      Base Station C
                    </div>
                    <div style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', marginTop: '2px', opacity: 0.8 }}>
                      0xFF · HQ
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => { setSelectedStation('DRONE_RELAY'); setAuthError(null); }}
                    style={{
                      padding: '10px 8px',
                      borderRadius: '8px',
                      border: '1px solid',
                      borderColor: selectedStation === 'DRONE_RELAY' ? '#C00000' : '#2D2D2D',
                      background: selectedStation === 'DRONE_RELAY' ? 'rgba(192, 0, 0, 0.14)' : '#181818',
                      color: selectedStation === 'DRONE_RELAY' ? '#F5F5F5' : '#888',
                      cursor: 'pointer',
                      textAlign: 'center',
                      transition: 'all 120ms ease',
                    }}
                  >
                    <div style={{ fontSize: '12px', fontWeight: 700, color: selectedStation === 'DRONE_RELAY' ? '#FFF' : '#FFAAAA' }}>
                      Drone Relay
                    </div>
                    <div style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', marginTop: '2px', opacity: 0.8 }}>
                      AIRBORNE
                    </div>
                  </button>
                </div>
              </div>

              {/* Password Input */}
              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label className="form-label" style={{ fontSize: '12px', color: '#B8B8B8' }}>
                    {selectedStation === 'BASE_A'
                      ? 'Base Station A Password'
                      : selectedStation === 'BASE_C'
                      ? 'Base Station C Password'
                      : 'Drone Relay Operator Password'}
                  </label>
                </div>

                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Enter station password..."
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="input"
                    style={{ paddingRight: '40px', fontFamily: 'var(--font-mono)', fontSize: '13px' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: '#858585',
                      cursor: 'pointer',
                      padding: '4px',
                    }}
                  >
                    {showPassword ? <EyeOff style={{ width: '16px', height: '16px' }} /> : <Eye style={{ width: '16px', height: '16px' }} />}
                  </button>
                </div>

                {detectedStation && detectedStation !== selectedStation && (
                  <div style={{
                    marginTop: '8px',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    backgroundColor: 'rgba(59, 130, 246, 0.12)',
                    border: '1px solid rgba(59, 130, 246, 0.35)',
                    color: '#93C5FD',
                    fontSize: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '8px',
                  }}>
                    <span>
                      💡 Password matches <strong>{detectedStation === 'BASE_A' ? 'Base Station A' : detectedStation === 'BASE_C' ? 'Base Station C' : 'Drone Relay'}</strong>.
                    </span>
                    <button
                      type="button"
                      onClick={() => { setSelectedStation(detectedStation); setAuthError(null); }}
                      className="btn btn-secondary"
                      style={{ fontSize: '11px', padding: '3px 8px', borderColor: '#3B82F6', color: '#93C5FD', whiteSpace: 'nowrap' }}
                    >
                      Switch Station
                    </button>
                  </div>
                )}
              </div>

              {/* Error Message */}
              {authError && (
                <div style={{
                  padding: '12px 14px',
                  borderRadius: '6px',
                  backgroundColor: 'rgba(255, 0, 0, 0.08)',
                  border: '1px solid rgba(255, 0, 0, 0.3)',
                  color: '#FF6B6B',
                  fontSize: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}>
                  <AlertTriangle style={{ width: '14px', height: '14px', flexShrink: 0 }} />
                  <span>{authError}</span>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isAuthenticating}
                className="btn btn-primary"
                style={{ padding: '12px', fontSize: '13px', display: 'flex', justifyContent: 'center' }}
              >
                {isAuthenticating ? (
                  <>
                    <RefreshCw style={{ width: '14px', height: '14px', animation: 'spin 1s linear infinite' }} />
                    Verifying Credentials...
                  </>
                ) : (
                  <>
                    <Key style={{ width: '14px', height: '14px' }} />
                    Authenticate & Enter {selectedStation === 'BASE_A' ? 'Station A' : selectedStation === 'BASE_C' ? 'Station C' : 'Drone Relay'}
                  </>
                )}
              </button>
            </form>

            {/* Bottom Footer Actions */}
            <div style={{
              marginTop: '24px',
              paddingTop: '16px',
              borderTop: '1px solid #222',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: '11.5px',
              color: '#777',
            }}>
              <span>Cloud Realtime: Active</span>
              <button
                type="button"
                onClick={() => {
                  setGeneratedPassA(generateSecurePassword('ALPHA'));
                  setGeneratedPassC(generateSecurePassword('CHARLIE'));
                  setGeneratedPassRelay(generateSecurePassword('RELAY'));
                  setIsSetupDone(false);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#858585',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                }}
              >
                Rotate Station Passwords
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
