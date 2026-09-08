/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Database, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  Copy, 
  ExternalLink, 
  RefreshCw, 
  Server, 
  Layers, 
  ShieldCheck,
  Code2,
  Table
} from 'lucide-react';

interface DatabaseStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
}
import { useModalKeyboard } from '../lib/useModalKeyboard';

interface DbHealthResponse {
  connected: boolean;
  configured: boolean;
  dialect: string;
  error?: string | null;
  timestamp: string;
}

export const DatabaseStatusModal: React.FC<DatabaseStatusModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [dbHealth, setDbHealth] = useState<DbHealthResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'status' | 'schema' | 'fastapi'>('status');

  // Accessible keyboard Escape handling and focus return
  useModalKeyboard(isOpen, onClose);

  const fetchHealth = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/db/health');
      const data = await res.json();
      setDbHealth(data);
    } catch {
      setDbHealth({
        connected: false,
        configured: false,
        dialect: 'In-Memory (Local Open Civic Data Store)',
        error: 'Backend DB diagnostic endpoint unavailable. Running on zero-dependency local store.',
        timestamp: new Date().toISOString(),
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchHealth();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(label);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  return (
    <div 
      role="presentation"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1A1A1A]/80 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div 
        role="dialog"
        aria-modal="true"
        aria-labelledby="db-status-title"
        className="bg-[#FDFDFC] max-w-2xl w-full border-2 border-[#1A1A1A] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        
        {/* Masthead Header */}
        <div className="bg-[#1A1A1A] text-[#FDFDFC] px-6 py-4 flex items-center justify-between border-b border-[#1A1A1A]">
          <div className="flex items-center gap-3">
            <div className="p-1.5 bg-[#FDFDFC] text-[#1A1A1A]">
              <Database className="w-5 h-5" aria-hidden="true" />
            </div>
            <div>
              <h3 id="db-status-title" className="font-serif font-medium text-lg text-white flex items-center gap-2">
                PostgreSQL Database Architecture
                <span className={`text-[10px] text-white font-mono font-bold uppercase tracking-wider px-2 py-0.5 ${
                  dbHealth?.connected ? 'bg-[#2D6A4F]' : 'bg-[#E63946]'
                }`}>
                  {dbHealth?.connected ? 'Live PostgreSQL' : 'In-Memory Mode (Ready)'}
                </span>
              </h3>
              <p className="text-[11px] text-[#D1D5DB] font-sans">
                Open Civic Data (OCD-ID) schema, PostgreSQL repository layer, and migration setup
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close database status dialog"
            className="text-[#D1D5DB] hover:text-white p-1 hover:bg-[#333] transition-colors focus-visible:ring-2 focus-visible:ring-white"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* Modal Navigation Tabs */}
        <div 
          role="tablist" 
          aria-label="Database Status Sections"
          className="bg-[#F2F0EA] border-b border-[#1A1A1A]/20 px-6 pt-3 flex gap-2 text-xs font-bold uppercase tracking-wider font-mono"
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'status'}
            onClick={() => setActiveTab('status')}
            className={`px-3 py-1.5 border-t border-x border-[#1A1A1A] transition-colors focus-visible:ring-2 focus-visible:ring-[#1A1A1A] ${
              activeTab === 'status' ? 'bg-[#FDFDFC] text-[#1A1A1A]' : 'bg-[#E5E2D9] text-[#525252] hover:text-[#1A1A1A]'
            }`}
          >
            Connection Status
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'schema'}
            onClick={() => setActiveTab('schema')}
            className={`px-3 py-1.5 border-t border-x border-[#1A1A1A] transition-colors focus-visible:ring-2 focus-visible:ring-[#1A1A1A] ${
              activeTab === 'schema' ? 'bg-[#FDFDFC] text-[#1A1A1A]' : 'bg-[#E5E2D9] text-[#525252] hover:text-[#1A1A1A]'
            }`}
          >
            Postgres DDL Schema
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'fastapi'}
            onClick={() => setActiveTab('fastapi')}
            className={`px-3 py-1.5 border-t border-x border-[#1A1A1A] transition-colors focus-visible:ring-2 focus-visible:ring-[#1A1A1A] ${
              activeTab === 'fastapi' ? 'bg-[#FDFDFC] text-[#1A1A1A]' : 'bg-[#E5E2D9] text-[#525252] hover:text-[#1A1A1A]'
            }`}
          >
            FastAPI / Python Models
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs font-sans text-[#1A1A1A]">
          
          {/* TAB 1: STATUS */}
          {activeTab === 'status' && (
            <div className="space-y-4">
              {/* Current Status Box */}
              <div className="bg-[#F2F0EA] border border-[#1A1A1A]/20 p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold uppercase tracking-wider text-[10px] text-[#777] font-mono">
                    Runtime Connection State:
                  </span>
                  <button
                    onClick={fetchHealth}
                    disabled={isLoading}
                    className="text-[11px] font-bold font-mono text-[#1A1A1A] hover:underline flex items-center gap-1"
                  >
                    <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
                    <span>Check Connection</span>
                  </button>
                </div>

                <div className="flex items-center gap-3 pt-1">
                  {dbHealth?.connected ? (
                    <CheckCircle2 className="w-5 h-5 text-[#2D6A4F] shrink-0" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-[#E63946] shrink-0" />
                  )}
                  <div>
                    <p className="font-serif font-bold text-sm text-[#1A1A1A]">
                      {dbHealth?.connected ? 'Connected to Live PostgreSQL' : 'Operating with In-Memory Open Civic Data Store'}
                    </p>
                    <p className="text-[11px] text-[#555] font-mono mt-0.5">
                      Dialect: {dbHealth?.dialect || 'PostgreSQL'} • {dbHealth?.timestamp}
                    </p>
                  </div>
                </div>

                {!dbHealth?.connected && (
                  <p className="text-[11px] text-[#666] leading-relaxed pt-2 border-t border-[#1A1A1A]/10">
                    The app is fully operational right now using typed municipal OCD datasets. Once you provision a database on Supabase, Neon, Cloud SQL, or RDS, provide the <code className="bg-[#E5E2D9] px-1 py-0.5 font-mono text-[#1A1A1A]">DATABASE_URL</code> in your environment, and CivicDigest will automatically connect.
                  </p>
                )}
              </div>

              {/* How to Connect Step-by-Step */}
              <div className="space-y-2">
                <h4 className="font-serif font-bold text-sm text-[#1A1A1A]">
                  How to Attach Your PostgreSQL Instance:
                </h4>
                <ol className="list-decimal list-inside space-y-2 text-[#444] bg-[#FDFDFC] p-3.5 border border-[#1A1A1A]/20">
                  <li className="leading-relaxed">
                    <strong>Create Database:</strong> Launch a PostgreSQL database on Neon, Supabase, Cloud SQL, or locally.
                  </li>
                  <li className="leading-relaxed">
                    <strong>Run Migrations:</strong> Execute <code className="bg-[#F2F0EA] px-1 py-0.5 font-mono text-[#1A1A1A]">src/db/schema.sql</code> and <code className="bg-[#F2F0EA] px-1 py-0.5 font-mono text-[#1A1A1A]">src/db/seed.sql</code> in your PostgreSQL query console.
                  </li>
                  <li className="leading-relaxed">
                    <strong>Set Environment Variable:</strong> Add your connection string in <code className="bg-[#F2F0EA] px-1 py-0.5 font-mono text-[#1A1A1A]">.env</code>:
                    <div className="mt-1.5 flex items-center justify-between bg-[#1A1A1A] text-[#FDFDFC] p-2 font-mono text-[10px]">
                      <span>DATABASE_URL=postgresql://user:pass@host:5432/civicdigest?sslmode=require</span>
                      <button
                        onClick={() => copyToClipboard('DATABASE_URL=postgresql://user:password@hostname:5432/civicdigest?sslmode=require', 'env')}
                        className="text-[#aaa] hover:text-white"
                      >
                        {copiedSection === 'env' ? <CheckCircle2 className="w-3.5 h-3.5 text-[#2D6A4F]" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </li>
                </ol>
              </div>
            </div>
          )}

          {/* TAB 2: SCHEMA */}
          {activeTab === 'schema' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold uppercase tracking-wider text-[10px] text-[#777] font-mono">
                  Tables Defined in src/db/schema.sql
                </span>
                <span className="text-[10px] font-mono text-[#555]">
                  Open Civic Data (OCD-ID) v3 Standard
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 font-mono text-[11px]">
                <div className="p-2.5 bg-[#F2F0EA] border border-[#1A1A1A]/20">
                  <strong className="text-[#1A1A1A] block">1. jurisdictions</strong>
                  <span className="text-[#555] text-[10px]">OCD-ID municipality records &amp; hearing dates</span>
                </div>
                <div className="p-2.5 bg-[#F2F0EA] border border-[#1A1A1A]/20">
                  <strong className="text-[#1A1A1A] block">2. bills</strong>
                  <span className="text-[#555] text-[10px]">Ordinances, fiscal notes, categories, ward tags</span>
                </div>
                <div className="p-2.5 bg-[#F2F0EA] border border-[#1A1A1A]/20">
                  <strong className="text-[#1A1A1A] block">3. primary_source_receipts</strong>
                  <span className="text-[#555] text-[10px]">Clerk matter IDs, PDF links, exact excerpts</span>
                </div>
                <div className="p-2.5 bg-[#F2F0EA] border border-[#1A1A1A]/20">
                  <strong className="text-[#1A1A1A] block">4. council_members</strong>
                  <span className="text-[#555] text-[10px]">Elected representatives, attendance &amp; bills</span>
                </div>
                <div className="p-2.5 bg-[#F2F0EA] border border-[#1A1A1A]/20">
                  <strong className="text-[#1A1A1A] block">5. vote_records</strong>
                  <span className="text-[#555] text-[10px]">Roll calls (Aye, Nay, Abstain, Absent)</span>
                </div>
                <div className="p-2.5 bg-[#F2F0EA] border border-[#1A1A1A]/20">
                  <strong className="text-[#1A1A1A] block">6. resident_sentiment_pulse</strong>
                  <span className="text-[#555] text-[10px]">Zero-party feedback with Laplace DP clipping</span>
                </div>
              </div>

              <p className="text-[11px] text-[#666] font-mono pt-1">
                Schema file location: <code className="bg-[#F2F0EA] px-1 py-0.5 text-[#1A1A1A]">/src/db/schema.sql</code>
              </p>
            </div>
          )}

          {/* TAB 3: FASTAPI MODELS */}
          {activeTab === 'fastapi' && (
            <div className="space-y-3">
              <span className="font-bold uppercase tracking-wider text-[10px] text-[#777] font-mono block">
                Python FastAPI SQLAlchemy Models Created at /backend/models.py
              </span>
              
              <div className="bg-[#1A1A1A] text-[#FDFDFC] p-3 font-mono text-[10.5px] overflow-x-auto leading-relaxed border border-[#1A1A1A]">
                {`# SQLAlchemy Models (backend/models.py)
class Jurisdiction(Base):
    __tablename__ = "jurisdictions"
    id = Column(String(128), primary_key=True) # OCD-ID
    name = Column(String(255), nullable=False)
    council_size = Column(Integer, default=17)

class Bill(Base):
    __tablename__ = "bills"
    id = Column(String(128), primary_key=True)
    file_number = Column(String(64), nullable=False)
    plain_title = Column(String(255), nullable=False)
    fiscal_amount = Column(Numeric(15, 2), default=0.00)
    summary = Column(Text, nullable=False)`}
              </div>

              <p className="text-[11px] text-[#555] leading-relaxed">
                Ready to plug directly into your Python FastAPI service with Uvicorn, Celery scraping queues, or asyncpg connection pooling.
              </p>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="bg-[#F2F0EA] px-6 py-3 border-t border-[#1A1A1A]/15 flex items-center justify-between text-xs font-mono">
          <span className="text-[#666]">
            Repository layer: <strong className="text-[#1A1A1A]">CivicRepository</strong> (TypeScript + SQL)
          </span>
          <button
            onClick={onClose}
            className="bg-[#1A1A1A] hover:bg-[#333] text-white px-4 py-1.5 font-bold uppercase tracking-wider transition-colors"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
