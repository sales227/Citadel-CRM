import React, { useState, useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiCall, getSettings } from '../api/apiService';
import { Settings, Shield, Mail, Building2, CheckCircle2, Save, Image as ImageIcon, Clock, Database, Loader2 } from 'lucide-react';

export default function SettingsPage() {
    const { user, isAdmin } = useAuth();
    const navigate = useNavigate();

    const [settings, setSettings] = useState({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [settingUp, setSettingUp] = useState(false);
    const [toastMessage, setToastMessage] = useState('');

    // Local form states
    const [priceThreshold, setPriceThreshold] = useState('');
    const [creditThreshold, setCreditThreshold] = useState('');

    const [autoEmailEnabled, setAutoEmailEnabled] = useState(false);
    const [adminEmail, setAdminEmail] = useState('');

    const [companyName, setCompanyName] = useState('');
    const [logoUrl, setLogoUrl] = useState('');

    // Automation timing
    const [followUpDays, setFollowUpDays] = useState('');
    const [followUpEmailResendDays, setFollowUpEmailResendDays] = useState('');
    const [paymentLookaheadDays, setPaymentLookaheadDays] = useState('');
    const [crossSellDelay, setCrossSellDelay] = useState('');
    const [referenceDelay, setReferenceDelay] = useState('');
    const [googleReviewDelay, setGoogleReviewDelay] = useState('');

    useEffect(() => {
        if (!isAdmin) return; // Navigate block will handle UI
        fetchData();
    }, [isAdmin]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const settingsArray = await getSettings();
            // Convert array of settings to object
            const settingsObj = {};
            if (Array.isArray(settingsArray)) {
                settingsArray.forEach(s => {
                    settingsObj[s.SettingKey] = s.SettingValue;
                });
            }
            setSettings(settingsObj);

            setPriceThreshold(settingsObj.PriceApprovalThreshold || '3650');
            setCreditThreshold(settingsObj.CreditApprovalThresholdDays || '45');
            setAutoEmailEnabled(settingsObj.AutoFollowUpEmailEnabled !== 'false');
            setAdminEmail(settingsObj.AdminEmail || '');
            setCompanyName(settingsObj.CompanyName || 'Citadel CRM');
            setLogoUrl(settingsObj.LogoURL || '');

            setFollowUpDays(settingsObj.FollowUpDays || '3');
            setFollowUpEmailResendDays(settingsObj.FollowUpEmailResendDays || '2');
            setPaymentLookaheadDays(settingsObj.PaymentDueLookaheadDays || '3');
            setCrossSellDelay(settingsObj.CrossSellDelayDays || '7');
            setReferenceDelay(settingsObj.ReferenceRequestDelayDays || '2');
            setGoogleReviewDelay(settingsObj.GoogleReviewDelayDays || '3');

        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const showToast = (msg) => {
        setToastMessage(msg);
        setTimeout(() => setToastMessage(''), 3000);
    };

    const saveSetting = async (key, value) => {
        setSaving(true);
        try {
            await apiCall('updateSetting', { SettingKey: key, SettingValue: value });
            showToast(`${key.replace(/([A-Z])/g, ' $1').trim()} updated`);
        } catch (e) {
            alert(`Failed to update ${key}`);
        } finally {
            setSaving(false);
        }
    };

    if (!isAdmin) {
        return <Navigate to="/" replace />;
    }

    if (loading) return <div className="p-8 text-center text-gray-500 animate-pulse">Loading settings...</div>;

    return (
        <div className="space-y-6 max-w-4xl">
            {toastMessage && (
                <div className="fixed top-20 right-4 z-50 bg-green-50 text-green-800 border border-green-200 px-4 py-3 rounded-lg flex items-center gap-3 animate-in fade-in">
                    <CheckCircle2 size={20} className="text-green-600" />
                    <span className="font-medium text-sm">{toastMessage}</span>
                </div>
            )}

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex items-center gap-3">
                <div className="bg-primary/10 p-3 rounded-lg"><Settings size={24} className="text-primary" /></div>
                <div>
                    <h2 className="text-xl font-bold text-gray-800">System Settings</h2>
                    <p className="text-sm text-gray-500">Configure global parameters and automated behaviors.</p>
                </div>
            </div>

            {/* SECTION 0: Google Sheet Setup */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 flex items-center gap-2">
                    <Database size={18} className="text-emerald-500" />
                    <h3 className="font-bold text-gray-800">Google Sheet Setup</h3>
                </div>
                <div className="p-6 space-y-4">
                    <div>
                        <p className="text-sm text-gray-700 leading-relaxed">
                            Initialize your connected Google Sheet with all required tabs
                            (<span className="font-mono text-xs bg-gray-100 px-1 py-0.5 rounded">USERS</span>,
                            <span className="font-mono text-xs bg-gray-100 px-1 py-0.5 rounded">CUSTOMERS</span>,
                            <span className="font-mono text-xs bg-gray-100 px-1 py-0.5 rounded">LEADS</span>,
                            <span className="font-mono text-xs bg-gray-100 px-1 py-0.5 rounded">INTERACTIONS</span>,
                            <span className="font-mono text-xs bg-gray-100 px-1 py-0.5 rounded">QUOTATIONS</span>,
                            <span className="font-mono text-xs bg-gray-100 px-1 py-0.5 rounded">ORDERS</span>,
                            <span className="font-mono text-xs bg-gray-100 px-1 py-0.5 rounded">PAYMENTS</span>,
                            <span className="font-mono text-xs bg-gray-100 px-1 py-0.5 rounded">REMINDERS</span>,
                            <span className="font-mono text-xs bg-gray-100 px-1 py-0.5 rounded">SETTINGS</span>,
                            <span className="font-mono text-xs bg-gray-100 px-1 py-0.5 rounded">ACTIVITY_LOGS</span>),
                            column headers, formatting, and default system settings.
                        </p>
                        <p className="text-xs text-gray-400 mt-2">Safe to run multiple times — skips tabs and settings that already exist. Also creates the default admin account if none exists.</p>
                    </div>
                    <button
                            onClick={async () => {
                                if (!window.confirm("This will create all required sheet tabs, headers, and default settings in your connected Google Sheet. Continue?")) return;
                                setSettingUp(true);
                                try {
                                    const res = await apiCall('setupSheet');
                                    if (res.success === false) throw new Error(res.message);
                                    showToast(res.message || "Google Sheet setup complete!");
                                    fetchData();
                                } catch (e) {
                                    alert("Setup failed: " + (e.message || "Unknown error"));
                                } finally {
                                    setSettingUp(false);
                                }
                            }}
                            disabled={settingUp}
                            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-600 text-white font-bold text-sm rounded-lg hover:bg-emerald-700 transition-colors shadow-sm whitespace-nowrap disabled:opacity-50"
                        >
                            {settingUp ? <><Loader2 size={16} className="animate-spin" /> Setting up...</> : <><Database size={16} /> Setup Google Sheet</>}
                    </button>
                </div>
            </div>

            {/* SECTION 1: Approval Thresholds */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 flex items-center gap-2">
                    <Shield size={18} className="text-orange-500" />
                    <h3 className="font-bold text-gray-800">Approval Thresholds</h3>
                </div>
                <div className="p-6 space-y-8">

                    <div className="flex flex-col sm:flex-row sm:items-start gap-4 justify-between">
                        <div className="flex-1">
                            <label className="block text-sm font-bold text-gray-900 mb-1">Price Approval Threshold (₹ per unit)</label>
                            <input type="number" value={priceThreshold} onChange={e => setPriceThreshold(e.target.value)} className="w-full sm:max-w-xs px-3 py-2 border border-gray-300 rounded focus:ring-primary focus:border-primary text-sm mb-2" />
                            <p className="text-xs text-gray-500 max-w-md leading-relaxed">Quotations priced <span className="font-bold text-orange-600">below</span> this value per unit will trigger an Admin Approval intercept lock before the customer can be engaged by staff.</p>
                        </div>
                        <button onClick={() => saveSetting('PriceApprovalThreshold', priceThreshold)} disabled={saving} className="flex items-center justify-center gap-1.5 px-4 py-2 bg-white border border-gray-300 text-gray-700 font-bold text-sm rounded-lg hover:bg-gray-50 transition-colors shadow-sm whitespace-nowrap">
                            <Save size={16} /> Save
                        </button>
                    </div>

                    <div className="w-full h-px bg-gray-100"></div>

                    <div className="flex flex-col sm:flex-row sm:items-start gap-4 justify-between">
                        <div className="flex-1">
                            <label className="block text-sm font-bold text-gray-900 mb-1">Credit Period Threshold (days)</label>
                            <input type="number" value={creditThreshold} onChange={e => setCreditThreshold(e.target.value)} className="w-full sm:max-w-xs px-3 py-2 border border-gray-300 rounded focus:ring-primary focus:border-primary text-sm mb-2" />
                            <p className="text-xs text-gray-500 max-w-md leading-relaxed">Payment invoice terms pushing a credit period <span className="font-bold text-orange-600">longer</span> than this bounds will require an Admin override signature.</p>
                        </div>
                        <button onClick={() => saveSetting('CreditApprovalThresholdDays', creditThreshold)} disabled={saving} className="flex items-center justify-center gap-1.5 px-4 py-2 bg-white border border-gray-300 text-gray-700 font-bold text-sm rounded-lg hover:bg-gray-50 transition-colors shadow-sm whitespace-nowrap">
                            <Save size={16} /> Save
                        </button>
                    </div>

                </div>
            </div>

            {/* SECTION 2: Email Automation */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 flex items-center gap-2">
                    <Mail size={18} className="text-blue-500" />
                    <h3 className="font-bold text-gray-800">Email Automation</h3>
                </div>
                <div className="p-6">
                    <div className="space-y-6 max-w-lg">

                        <label className="flex items-center justify-between cursor-pointer group">
                            <div>
                                <span className="block text-sm font-bold text-gray-900">Auto Follow-up Emails</span>
                                <span className="block text-xs text-gray-500 mt-0.5">Allow Apps Script cron jobs to blast automated quotation chases to customers.</span>
                            </div>
                            <div className="relative">
                                <input type="checkbox" className="sr-only" checked={autoEmailEnabled} onChange={e => setAutoEmailEnabled(e.target.checked)} />
                                <div className={`block w-10 h-6 rounded-full transition-colors ${autoEmailEnabled ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                                <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${autoEmailEnabled ? 'transform translate-x-4' : ''}`}></div>
                            </div>
                        </label>

                        <div>
                            <label className="block text-sm font-bold text-gray-900 mb-1">Admin Alert Email</label>
                            <input type="email" value={adminEmail} onChange={e => setAdminEmail(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-primary focus:border-primary text-sm" placeholder="admin@citadel.com" />
                            <p className="text-xs text-gray-500 mt-1.5">This inbox will receive system exception pings and approval intercept routing events.</p>
                        </div>

                        <button onClick={async () => {
                            setSaving(true);
                            try {
                                await apiCall('updateSetting', { SettingKey: 'AutoFollowUpEmailEnabled', SettingValue: autoEmailEnabled ? 'true' : 'false' });
                                await apiCall('updateSetting', { SettingKey: 'AdminEmail', SettingValue: adminEmail });
                                showToast("Email automation saved");
                            } catch (e) { alert("Failed"); } finally { setSaving(false); }
                        }} disabled={saving} className="px-5 py-2 bg-primary text-white font-bold text-sm rounded-lg hover:bg-blue-800 transition-colors shadow-sm flex items-center gap-2 focus:ring-2 focus:ring-offset-2 focus:ring-primary">
                            <CheckCircle2 size={16} /> Save Email Settings
                        </button>
                    </div>
                </div>
            </div>

            {/* SECTION 3: Automation Timing */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 flex items-center gap-2">
                    <Clock size={18} className="text-green-500" />
                    <h3 className="font-bold text-gray-800">Automation Timing</h3>
                </div>
                <div className="p-6 space-y-6">
                    <p className="text-xs text-gray-500 leading-relaxed">Configure delay intervals (in days) used by background triggers and automated reminder generation.</p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div>
                            <label className="block text-sm font-bold text-gray-900 mb-1">Lead Follow-up (days)</label>
                            <input type="number" min="1" value={followUpDays} onChange={e => setFollowUpDays(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-primary focus:border-primary text-sm" />
                            <p className="text-xs text-gray-400 mt-1">Days after lead creation to trigger first follow-up reminder.</p>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-900 mb-1">Follow-up Email Resend (days)</label>
                            <input type="number" min="1" value={followUpEmailResendDays} onChange={e => setFollowUpEmailResendDays(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-primary focus:border-primary text-sm" />
                            <p className="text-xs text-gray-400 mt-1">Days since last follow-up email before auto-resending.</p>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-900 mb-1">Payment Due Lookahead (days)</label>
                            <input type="number" min="1" value={paymentLookaheadDays} onChange={e => setPaymentLookaheadDays(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-primary focus:border-primary text-sm" />
                            <p className="text-xs text-gray-400 mt-1">Days ahead to flag upcoming payment deadlines.</p>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-900 mb-1">Cross-sell Delay (days)</label>
                            <input type="number" min="1" value={crossSellDelay} onChange={e => setCrossSellDelay(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-primary focus:border-primary text-sm" />
                            <p className="text-xs text-gray-400 mt-1">Days after order to create cross-sell reminders.</p>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-900 mb-1">Reference Request Delay (days)</label>
                            <input type="number" min="1" value={referenceDelay} onChange={e => setReferenceDelay(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-primary focus:border-primary text-sm" />
                            <p className="text-xs text-gray-400 mt-1">Days after full payment to ask for references.</p>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-900 mb-1">Google Review Delay (days)</label>
                            <input type="number" min="1" value={googleReviewDelay} onChange={e => setGoogleReviewDelay(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-primary focus:border-primary text-sm" />
                            <p className="text-xs text-gray-400 mt-1">Days after full payment to request a Google Review.</p>
                        </div>
                    </div>

                    <button onClick={async () => {
                        setSaving(true);
                        try {
                            await Promise.all([
                                apiCall('updateSetting', { SettingKey: 'FollowUpDays', SettingValue: followUpDays }),
                                apiCall('updateSetting', { SettingKey: 'FollowUpEmailResendDays', SettingValue: followUpEmailResendDays }),
                                apiCall('updateSetting', { SettingKey: 'PaymentDueLookaheadDays', SettingValue: paymentLookaheadDays }),
                                apiCall('updateSetting', { SettingKey: 'CrossSellDelayDays', SettingValue: crossSellDelay }),
                                apiCall('updateSetting', { SettingKey: 'ReferenceRequestDelayDays', SettingValue: referenceDelay }),
                                apiCall('updateSetting', { SettingKey: 'GoogleReviewDelayDays', SettingValue: googleReviewDelay }),
                            ]);
                            showToast("Automation timing saved");
                        } catch (e) { alert("Failed to save timing settings"); } finally { setSaving(false); }
                    }} disabled={saving} className="px-5 py-2 bg-green-600 text-white font-bold text-sm rounded-lg hover:bg-green-700 transition-colors shadow-sm flex items-center gap-2">
                        <CheckCircle2 size={16} /> Save Timing Settings
                    </button>
                </div>
            </div>

            {/* SECTION 4: Company Branding */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 flex items-center gap-2">
                    <Building2 size={18} className="text-indigo-500" />
                    <h3 className="font-bold text-gray-800">Company Branding</h3>
                </div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-900 mb-1">Company Name</label>
                            <input type="text" value={companyName} onChange={e => setCompanyName(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-primary focus:border-primary text-sm" />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-900 mb-1">Logo Public URL</label>
                            <input type="url" value={logoUrl} onChange={e => setLogoUrl(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-primary focus:border-primary text-sm" placeholder="https://example.com/logo.png" />
                        </div>
                        <button onClick={async () => {
                            setSaving(true);
                            try {
                                await apiCall('updateSetting', { SettingKey: 'CompanyName', SettingValue: companyName });
                                await apiCall('updateSetting', { SettingKey: 'LogoURL', SettingValue: logoUrl });
                                showToast("Branding saved! Reload to see changes.");
                            } catch (e) { alert("Failed"); } finally { setSaving(false); }
                        }} disabled={saving} className="px-5 py-2 bg-indigo-600 text-white font-bold text-sm rounded-lg hover:bg-indigo-700 transition-colors shadow-sm flex items-center gap-2">
                            <CheckCircle2 size={16} /> Save Branding
                        </button>
                    </div>

                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 flex items-center justify-center flex-col min-h-[160px]">
                        {logoUrl ? (
                            <img src={logoUrl} alt="Logo Preview" className="max-h-24 max-w-full object-contain mix-blend-multiply" onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'block'; }} />
                        ) : null}
                        {!logoUrl && (
                            <>
                                <ImageIcon size={32} className="text-gray-300 mb-2" />
                                <p className="text-xs text-gray-500 font-medium">No valid logo URL provided</p>
                            </>
                        )}
                    </div>
                </div>
            </div>

        </div>
    );
}