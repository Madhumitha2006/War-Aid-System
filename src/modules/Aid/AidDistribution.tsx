/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Plus, Edit, Eye, Trash2, Tag, Compass, Layers, 
  UserCheck, AlertCircle, FileText, CheckCircle2, RefreshCw, BarChart2 
} from 'lucide-react';
import { AidApplication, User, AidType, AidStatus } from '../../types';

interface Props {
  aidApplications: AidApplication[];
  currentUser: User;
  onAddApplication: (app: Omit<AidApplication, 'id' | 'requestedAt' | 'updatedAt'>) => void;
  onUpdateStatus: (id: string, status: AidStatus, amount?: number) => void;
  emergencyMode: boolean;
}

// Custom mock inventory for government center
interface InventoryItem {
  id: string;
  name: string;
  qty: number;
  unit: string;
  category: 'food' | 'medical' | 'shelter' | 'utility';
}

const INITIAL_INVENTORY: InventoryItem[] = [
  { id: 'inv-1', name: 'Standard Food Ration Packs (10 days)', qty: 450, unit: 'kits', category: 'food' },
  { id: 'inv-2', name: 'Infant Dairy Pasteurized Milk Formula', qty: 120, unit: 'cans', category: 'food' },
  { id: 'inv-3', name: 'First Aid Suture & Burn Dressings', qty: 310, unit: 'packs', category: 'medical' },
  { id: 'inv-4', name: 'Broad-Spectrum Amoxicillin (Antibiotics)', qty: 180, unit: 'bottles', category: 'medical' },
  { id: 'inv-5', name: 'Thermal Inflatable Cots & Tents', qty: 75, unit: 'units', category: 'shelter' },
  { id: 'inv-6', name: 'Universal Multitool Batteries (10,000 mAH)', qty: 210, unit: 'cells', category: 'utility' },
];

export default function AidDistribution({
  aidApplications,
  currentUser,
  onAddApplication,
  onUpdateStatus,
  emergencyMode
}: Props) {
  const [isAdmin, setIsAdmin] = useState(currentUser.role === 'government');
  const [activePortalTab, setActivePortalTab] = useState<'id' | 'apply' | 'history'>('id');
  const [activeAdminTab, setActiveAdminTab] = useState<'applications' | 'inventory' | 'queue'>('applications');

  // State for new digital application
  const [appType, setAppType] = useState<AidType>('food');
  const [appDescription, setAppDescription] = useState('');
  const [householdAdults, setHouseholdAdults] = useState(2);
  const [householdChildren, setHouseholdChildren] = useState(1);
  const [hasStructuralDamage, setHasStructuralDamage] = useState(false);

  // Government scan queue state
  const [scannedIdInput, setScannedIdInput] = useState('');
  const [scannedAppResult, setScannedAppResult] = useState<AidApplication | null>(null);

  // Calculations for financial aids (₹2,000 per adult | ₹3,000 per child)
  const calculateCompensation = (adults: number, children: number) => {
    return (adults * 2000) + (children * 3000);
  };

  const handleApplicationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const allocatedAmount = calculateCompensation(householdAdults, householdChildren);

    onAddApplication({
      applicant: currentUser.id,
      applicantName: currentUser.name,
      type: appType,
      status: 'pending',
      amount: allocatedAmount,
      description: `${appDescription} (Adults: ${householdAdults}, Children: ${householdChildren}. ${hasStructuralDamage ? 'Structural Damage Reported' : 'No Damage Reported'})`
    });

    // Reset Form
    setAppDescription('');
    setHasStructuralDamage(false);
    setActivePortalTab('history');
  };

  // Direct mock SVG QR Generator (Draws a realistic military-ID QR pattern offline)
  const renderSVGQR = (data: string) => {
    return (
      <svg viewBox="0 0 100 100" className="w-40 h-40 bg-white p-2 rounded-lg shadow-sm">
        {/* Draw mock structural data blocks of a real dynamic QR Code */}
        <rect x="0" y="0" width="30" height="30" fill="black" />
        <rect x="5" y="5" width="20" height="20" fill="white" />
        <rect x="10" y="10" width="10" height="10" fill="black" />

        <rect x="70" y="0" width="30" height="30" fill="black" />
        <rect x="75" y="5" width="20" height="20" fill="white" />
        <rect x="80" y="10" width="10" height="10" fill="black" />

        <rect x="0" y="70" width="30" height="30" fill="black" />
        <rect x="5" y="75" width="20" height="20" fill="white" />
        <rect x="10" y="80" width="10" height="10" fill="black" />

        {/* Scattered simulated data bits */}
        <rect x="40" y="10" width="5" height="15" fill="black" />
        <rect x="50" y="5" width="10" height="5" fill="black" />
        <rect x="45" y="35" width="15" height="15" fill="black" />
        <rect x="15" y="45" width="10" height="5" fill="black" />
        <rect x="35" y="60" width="25" height="5" fill="black" />
        
        <rect x="70" y="40" width="15" height="5" fill="black" />
        <rect x="85" y="50" width="5" height="15" fill="black" />
        <rect x="65" y="70" width="10" height="10" fill="black" />
        <rect x="80" y="80" width="15" height="10" fill="black" />
        
        <rect x="45" y="85" width="10" height="5" fill="black" />
      </svg>
    );
  };

  // Find user's applications
  const myApplications = aidApplications.filter(app => app.applicant === currentUser.id);

  const handleAdminScanSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!scannedIdInput.trim()) return;
    const found = aidApplications.find(a => a.id.toLowerCase() === scannedIdInput.trim().toLowerCase());
    setScannedAppResult(found || null);
  };

  return (
    <div id="aid-module-container" className="space-y-4 my-4 text-xs sm:text-sm">
      
      {/* Role Toggle Row */}
      <div id="aid-admin-toggle-panel" className="flex items-center justify-between border-b border-zinc-805 pb-3 flex-wrap gap-2">
        <div>
          <h3 className="text-sm font-bold tracking-wider text-zinc-100 uppercase">Module 3 — Security & Digital Relief Management</h3>
          <p className="text-[10px] text-zinc-500 mt-0.5">Configure offline ID passports, files damages, or audit supplies.</p>
        </div>

        <button
          id="toggle-portal-role-btn"
          onClick={() => setIsAdmin(!isAdmin)}
          className={`px-3 py-1 text-xs rounded transition-all font-semibold ${
            isAdmin 
              ? 'bg-amber-600/10 text-amber-400 border border-amber-600/30' 
              : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
          }`}
        >
          {isAdmin ? "Switch to Citizen Portal" : "Access Government Dashboard"}
        </button>
      </div>

      {isAdmin ? (
        /* ==================== GOVERNMENT ADMIN PORTAL ==================== */
        <div id="gov-admin-tabpanel" className="space-y-4">
          {/* Admin Navigation Headers */}
          <div className="flex gap-2 border-b border-zinc-900 pb-1" id="aid-admin-tabs">
            <button
              id="admin-tab-apps-btn"
              onClick={() => setActiveAdminTab('applications')}
              className={`pb-1.5 px-3 font-semibold transition-all ${
                activeAdminTab === 'applications' ? 'text-emerald-400 border-b-2 border-emerald-500' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              Pending Applications
            </button>
            <button
              id="admin-tab-inv-btn"
              onClick={() => setActiveAdminTab('inventory')}
              className={`pb-1.5 px-3 font-semibold transition-all ${
                activeAdminTab === 'inventory' ? 'text-emerald-400 border-b-2 border-emerald-500' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              Supply Inventory
            </button>
            <button
              id="admin-tab-queue-btn"
              onClick={() => setActiveAdminTab('queue')}
              className={`pb-1.5 px-3 font-semibold transition-all ${
                activeAdminTab === 'queue' ? 'text-emerald-400 border-b-2 border-emerald-500' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              QR Scanner Queue
            </button>
          </div>

          {activeAdminTab === 'applications' && (
            <div className="space-y-3" id="admin-view-applications">
              {aidApplications.length === 0 ? (
                <div className="text-center p-8 text-zinc-500">No active relief demands filed currently.</div>
              ) : (
                aidApplications.map(app => (
                  <div key={app.id} className="border border-zinc-800 rounded-lg p-3 bg-slate-950/20 space-y-3">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div>
                        <div className="font-bold text-zinc-200">{app.applicantName}</div>
                        <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">{app.id}</div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-xs bg-zinc-900 px-2 py-0.5 border border-zinc-850 rounded font-bold text-emerald-400 uppercase tracking-wider">
                          Type: {app.type}
                        </span>
                        <span className={`text-[10px] uppercase font-bold py-0.5 px-2 rounded ${
                          app.status === 'pending' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        }`}>
                          {app.status}
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-zinc-400">{app.description}</p>
                    
                    {app.amount && (
                      <div className="text-xs font-semibold text-emerald-400 font-mono">
                        Compensatory aid estimate: ₹{app.amount.toLocaleString()}
                      </div>
                    )}

                    {app.status === 'pending' && (
                      <div className="flex gap-2 justify-end border-t border-zinc-900 pt-2">
                        <button
                          id={`reject-aid-btn-${app.id}`}
                          onClick={() => onUpdateStatus(app.id, 'received', app.amount)}
                          className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-3 py-1 rounded text-xs leading-none font-bold cursor-pointer"
                        >
                          Mark Received
                        </button>
                        <button
                          id={`approve-aid-btn-${app.id}`}
                          onClick={() => onUpdateStatus(app.id, 'approved', app.amount)}
                          className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1 rounded text-xs leading-none font-bold cursor-pointer"
                        >
                          Approve Relief
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {activeAdminTab === 'inventory' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3" id="admin-view-inventory">
              {INITIAL_INVENTORY.map(item => (
                <div key={item.id} className="border border-zinc-850 bg-slate-950/10 rounded-lg p-3 flex justify-between items-center">
                  <div>
                    <div className="font-bold text-zinc-300 text-xs">{item.name}</div>
                    <div className="text-[10px] uppercase font-bold text-zinc-500 font-mono mt-0.5 tracking-widest">{item.category}</div>
                  </div>
                  
                  <div className="text-right">
                    <div className="font-mono font-bold text-lg text-emerald-400">{item.qty}</div>
                    <div className="text-[10px] text-zinc-500 lowercase">{item.unit} available</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeAdminTab === 'queue' && (
            <div className="space-y-4" id="admin-view-queue">
              <div className="border border-zinc-800 rounded-lg p-4 bg-slate-950/20 space-y-3 max-w-md">
                <h4 className="text-xs font-bold uppercase tracking-widest text-zinc-300">Simulated QR Code Scanner Receiver</h4>
                <p className="text-xs text-zinc-500">In an offline environment, government queues scan citizens SVG ID cards manually to verify eligibility and confirm direct receipt of items immediately on the paper log.</p>
                
                <form onSubmit={handleAdminScanSubmit} className="flex gap-2">
                  <input
                    id="qr-scan-input-field"
                    type="text"
                    value={scannedIdInput}
                    onChange={(e) => setScannedIdInput(e.target.value)}
                    placeholder="Enter scanned application ID..."
                    className="flex-1 bg-zinc-950 border border-zinc-800 px-3 py-1.5 focus:outline-none focus:border-zinc-700 text-xs rounded text-zinc-300 font-mono"
                  />
                  <button
                    id="submit-qr-scan-btn"
                    type="submit"
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-1.5 rounded text-xs cursor-pointer"
                  >
                    Scan ID
                  </button>
                </form>

                {scannedAppResult ? (
                  <div className="border-t border-zinc-900 pt-3 space-y-2 text-xs" id="qr-scan-success-block">
                    <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Valid Citizen Application Found</span>
                    </div>

                    <div className="bg-zinc-950 p-2.5 rounded border border-zinc-850 font-mono">
                      <div>**Applicant**: {scannedAppResult.applicantName}</div>
                      <div>**Assistance**: {scannedAppResult.type.toUpperCase()}</div>
                      <div>**Amount Allocated**: ₹{scannedAppResult.amount?.toLocaleString() || 0}</div>
                      <div>**Current Status**: <span className="text-amber-400 uppercase font-bold">{scannedAppResult.status}</span></div>
                    </div>

                    <button
                      id="qr-scan-confirm-payout-btn"
                      onClick={() => {
                        onUpdateStatus(scannedAppResult.id, 'received');
                        setScannedAppResult(prev => prev ? { ...prev, status: 'received' } : null);
                        setScannedIdInput('');
                      }}
                      className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-2 rounded text-xs font-bold leading-none cursor-pointer text-center block"
                    >
                      Scan Authorized QR: Disburse Supplies now
                    </button>
                  </div>
                ) : scannedIdInput ? (
                  <p className="text-xs text-rose-500 font-semibold" id="qr-scan-error-block">⚠️ Scan output doesn't match any pending offline indices. Try: {aidApplications[0]?.id || 'aid-1'}</p>
                ) : null}
              </div>
            </div>
          )}

        </div>
      ) : (
        /* ==================== CITIZEN PORTAL ==================== */
        <div id="citizen-portal-tabpanel" className="space-y-4">
          <div className="flex gap-2 border-b border-zinc-900 pb-1" id="aid-citizen-tabs">
            <button
              id="citizen-tab-passport-btn"
              onClick={() => setActivePortalTab('id')}
              className={`pb-1.5 px-3 font-semibold transition-all ${
                activePortalTab === 'id' ? 'text-emerald-400 border-b-2 border-emerald-500' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              National ID Passport
            </button>
            <button
              id="citizen-tab-apply-btn"
              onClick={() => setActivePortalTab('apply')}
              className={`pb-1.5 px-3 font-semibold transition-all ${
                activePortalTab === 'apply' ? 'text-emerald-400 border-b-2 border-emerald-500' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              File Assistance
            </button>
            <button
              id="citizen-tab-history-btn"
              onClick={() => setActivePortalTab('history')}
              className={`pb-1.5 px-3 font-semibold transition-all ${
                activePortalTab === 'history' ? 'text-emerald-400 border-b-2 border-emerald-500' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              My Claims ({myApplications.length})
            </button>
          </div>

          {activePortalTab === 'id' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4" id="citizen-passport-view">
              
              {/* National Identity Passport Document UI card */}
              <div className="border border-zinc-800 rounded-xl p-4 bg-gradient-to-b from-slate-900 to-slate-950 shadow-lg text-slate-100 flex flex-col justify-between max-w-sm">
                <div>
                  <div className="flex justify-between items-center border-b border-zinc-850 pb-2 mb-3">
                    <span className="font-bold text-[10px] tracking-widest text-emerald-400 font-mono uppercase">Ukraine Civil Defense ID Passport</span>
                    <span className="text-[8px] border border-emerald-500/30 text-emerald-500 bg-emerald-500/10 px-1 py-0.5 rounded uppercase font-mono font-bold">Secure</span>
                  </div>

                  <div className="flex items-start gap-3">
                    {/* Simulated avatar profile block */}
                    <div className="w-16 h-20 rounded border border-zinc-800 bg-zinc-900 text-zinc-600 flex items-center justify-center font-bold text-2xl uppercase select-none">
                      {currentUser.name.charAt(0)}
                    </div>

                    <div className="space-y-1 mt-0.5">
                      <div className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold">Full Legal Name:</div>
                      <div className="font-bold text-xs text-zinc-200">{currentUser.name}</div>
                      
                      <div className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold mt-2">Citizenship Key ID:</div>
                      <div className="font-mono text-zinc-400 text-[10px] truncate w-40">{currentUser.id}</div>
                    </div>
                  </div>
                </div>

                <div className="border-t border-zinc-850 pt-3 mt-4 text-[10px] font-mono text-zinc-500 leading-normal">
                  ⚠️ This passport guarantees offline relief queues processing should internet backhauls fail. Keep coordinates signed at cell station #5.
                </div>
              </div>

              {/* Instant Verification QR card */}
              {myApplications.length > 0 ? (
                <div className="border border-zinc-850 p-4 rounded-xl bg-slate-950/20 flex flex-col items-center justify-center gap-2">
                  <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-widest">Digital Verification QR</h4>
                  <div className="p-1 bgColor-white rounded-lg">
                    {renderSVGQR(myApplications[0].id)}
                  </div>
                  <div className="text-center font-mono text-[10px] text-zinc-500 mt-1">
                    <div>Claim: {myApplications[0].id}</div>
                    <div>Present code to relief volunteers for scan verify</div>
                  </div>
                </div>
              ) : (
                <div className="border border-zinc-850 p-6 rounded-xl bg-slate-950/10 flex flex-col items-center justify-center text-center text-zinc-500 gap-2">
                  <AlertCircle className="w-8 h-8 text-amber-500/80 stroke-1" />
                  <p className="text-xs font-semibold">No approved authorizations pending.</p>
                  <p className="text-[11px] max-w-sm">File an assistance claim for food rations or physical damage reparations under the "File Assistance" tab to generate a verification QR.</p>
                </div>
              )}

            </div>
          )}

          {activePortalTab === 'apply' && (
            <div className="border border-zinc-800 p-4 rounded-xl bg-slate-950/25 max-w-lg" id="citizen-apply-form-block">
              <h4 className="text-xs font-bold uppercase tracking-widest text-zinc-200 mb-3 block">Submit Emergency Claim Form</h4>
              
              <form onSubmit={handleApplicationSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Select Relief Type Needed</label>
                  <select
                    id="aid-input-type-select"
                    value={appType}
                    onChange={(e) => setAppType(e.target.value as AidType)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1.5 text-zinc-300 text-xs focus:outline-none focus:border-zinc-700"
                  >
                    <option value="food">🍞 Essential Hunger Food Kits Rationing</option>
                    <option value="medical">🏥 Field Trauma Medicine & First-Aid Supplements</option>
                    <option value="financial">💰 Crisis Compensation Resiliency Funds</option>
                    <option value="shelter">🏠 Subterranean Shelter Eviction Relocations</option>
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-1">
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Household Adults</label>
                    <input
                      id="aid-household-adults-input"
                      type="number"
                      min="1"
                      value={householdAdults}
                      onChange={(e) => setHouseholdAdults(Math.max(1, Number(e.target.value)))}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1.5 focus:outline-none focus:border-zinc-700 text-zinc-300 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Household Children</label>
                    <input
                      id="aid-household-children-input"
                      type="number"
                      min="0"
                      value={householdChildren}
                      onChange={(e) => setHouseholdChildren(Math.max(0, Number(e.target.value)))}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1.5 focus:outline-none focus:border-zinc-700 text-zinc-300 font-mono"
                    />
                  </div>
                </div>

                <div className="bg-slate-900 border border-zinc-800 p-2.5 rounded text-xs text-zinc-300 select-none">
                  <div className="font-semibold text-emerald-400">Financial Disbursement Ledger Scale:</div>
                  <ul className="list-disc pl-4 space-y-0.5 mt-1 font-mono text-[10px] text-zinc-400">
                    <li>Adults: ₹2,000 per headcount</li>
                    <li>Children: ₹3,000 per headcount</li>
                    <li>**Active Compensation Estimate**: ₹{calculateCompensation(householdAdults, householdChildren).toLocaleString()}</li>
                  </ul>
                </div>

                {/* Damage Reporting Integration */}
                <div className="flex items-center gap-2 border border-zinc-800 p-2.5 rounded bg-zinc-950/20">
                  <input
                    id="aid-damage-report-checkbox"
                    type="checkbox"
                    checked={hasStructuralDamage}
                    onChange={(e) => setHasStructuralDamage(e.target.checked)}
                    className="w-4 h-4 rounded border-zinc-800 bg-zinc-950 focus:ring-0 checked:bg-emerald-600 cursor-pointer"
                  />
                  <div>
                    <span className="font-bold text-zinc-300">Report Structural Damage</span>
                    <p className="text-[10px] text-zinc-500 mt-0.5">Check this box to enters the fast-tracked residential reconstruction funding pipeline.</p>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Statement / Detailed Conditions</label>
                  <textarea
                    id="aid-application-desc-textarea"
                    rows={2.5}
                    value={appDescription}
                    onChange={(e) => setAppDescription(e.target.value)}
                    placeholder="Describe specific food/med constraints, infant age constraints, shelter location or photos of property failures..."
                    className="w-full bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1.5 focus:outline-none focus:border-zinc-700 text-zinc-350"
                    required
                  />
                </div>

                <button
                  id="submit-aid-app-btn"
                  type="submit"
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 rounded text-xs transition-colors cursor-pointer"
                >
                  File Relief Demands (Indexed Locally)
                </button>
              </form>
            </div>
          )}

          {activePortalTab === 'history' && (
            <div className="space-y-3" id="citizen-history-claims">
              {myApplications.length === 0 ? (
                <p className="text-center p-8 text-zinc-500 text-xs">No compensation claims made yet.</p>
              ) : (
                myApplications.map(app => (
                  <div key={app.id} className="border border-zinc-850 p-3 bg-slate-950/25 rounded-lg space-y-2">
                    <div className="flex justify-between items-center flex-wrap gap-1">
                      <div>
                        <div className="font-bold text-zinc-200 capitalize">Relief Ticket: {app.type}</div>
                        <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">{app.id}</div>
                      </div>
                      
                      <span className={`text-[10px] uppercase font-bold py-0.5 px-2 rounded font-mono ${
                        app.status === 'received' ? 'bg-emerald-600/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                      }`}>
                        {app.status}
                      </span>
                    </div>

                    <p className="text-xs text-zinc-400 leading-normal">{app.description}</p>

                    <div className="flex justify-between items-center text-[10px] border-t border-zinc-900 pt-2 font-mono text-zinc-500">
                      <span>Disbursement compensation: ₹{app.amount?.toLocaleString() || 0}</span>
                      <span>Filed: {new Date(app.requestedAt).toLocaleTimeString()}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

        </div>
      )}

    </div>
  );
}
