import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getUsers, createUser, updateUser, deactivateUser, apiCall } from '../api/apiService';
import { Users as UsersIcon, Plus, Edit2, ShieldAlert, KeyRound, CheckCircle2, X, UserCog } from 'lucide-react';

export default function UsersPage() {
    const { user, isAdmin } = useAuth();
    const [usersList, setUsersList] = useState([]);
    const [loading, setLoading] = useState(true);

    // Modals state
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isResetOpen, setIsResetOpen] = useState(false);
    const [isSetupOpen, setIsSetupOpen] = useState(false);

    const [selectedUser, setSelectedUser] = useState(null);
    const [form, setForm] = useState({});
    const [submitting, setSubmitting] = useState(false);
    const [toastMessage, setToastMessage] = useState('');

    useEffect(() => {
        if (isAdmin) fetchData();
    }, [isAdmin]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const uRes = await getUsers();
            setUsersList(uRes);
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

    const handleAddSubmit = async (e) => {
        e.preventDefault();
        if (form.PasswordHash.length < 8) return alert("Password must be at least 8 characters");
        if (usersList.some(u => u.Email.toLowerCase() === form.Email.toLowerCase())) return alert("Email already exists in system");

        setSubmitting(true);
        try {
            await createUser(form);
            setIsAddOpen(false);
            showToast('User created successfully');
            fetchData();
        } catch (e) { alert("Failed to create"); } finally { setSubmitting(false); }
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await updateUser(selectedUser.UserID, {
                FullName: form.FullName,
                Phone: form.Phone,
                Role: selectedUser.UserID === user?.UserID ? selectedUser.Role : form.Role
            });
            setIsEditOpen(false);
            showToast('Profile updated');
            fetchData();
        } catch (e) { alert("Update failed"); } finally { setSubmitting(false); }
    };

    const handleResetSubmit = async (e) => {
        e.preventDefault();
        if (form.NewPassword.length < 8) return alert("Min 8 chars required");
        setSubmitting(true);
        try {
            await apiCall('resetPassword', { UserID: selectedUser.UserID, NewPassword: form.NewPassword });
            setIsResetOpen(false);
            showToast('Password reset successful');
        } catch (e) { alert("Reset failed"); } finally { setSubmitting(false); }
    };

    const handleDeactivate = async (uId) => {
        if (!window.confirm("Are you sure you want to deactivate this account?")) return;
        try {
            await deactivateUser(uId);
            showToast("User deactivated");
            fetchData();
        } catch (e) { alert("Deactivation failed"); }
    };

    const handleSetupSubmit = async (e) => {
        e.preventDefault();
        if (form.NewPassword.length < 8) return alert("Password must be at least 8 characters");
        if (!form.NewEmail) return alert("Email is required");
        setSubmitting(true);
        try {
            const res = await apiCall('setupAccount', {
                UserID: selectedUser.UserID,
                NewEmail: form.NewEmail,
                NewPassword: form.NewPassword,
                FullName: form.FullName,
                Phone: form.Phone
            });
            if (res.success === false) throw new Error(res.message);
            setIsSetupOpen(false);
            showToast('Account setup complete! Please login with your new credentials.');
            fetchData();
        } catch (e) { alert("Setup failed: " + (e.message || "Unknown error")); } finally { setSubmitting(false); }
    };

    if (!isAdmin) return <Navigate to="/" replace />;
    if (loading) return <div className="p-8 text-center text-gray-500 animate-pulse">Loading directory...</div>;

    return (
        <div className="space-y-6">
            {toastMessage && (
                <div className="fixed top-20 right-4 z-50 bg-green-50 text-green-800 border border-green-200 px-4 py-3 rounded-lg flex items-center gap-3 animate-in fade-in">
                    <CheckCircle2 size={20} className="text-green-600" />
                    <span className="font-medium text-sm">{toastMessage}</span>
                </div>
            )}

            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2"><UsersIcon className="text-primary" /> Staff Directory</h2>
                <button onClick={() => { setForm({ FullName: '', Email: '', Phone: '', Role: 'Staff', PasswordHash: '' }); setIsAddOpen(true); }} className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg font-bold hover:bg-blue-800 transition-colors">
                    <Plus size={18} /> Add User
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden text-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 text-xs uppercase tracking-wider">
                            <tr>
                                <th className="px-6 py-4 font-semibold">User</th>
                                <th className="px-6 py-4 font-semibold">Contact</th>
                                <th className="px-6 py-4 font-semibold">Role</th>
                                <th className="px-6 py-4 font-semibold">Status</th>
                                <th className="px-6 py-4 font-semibold">Last Login</th>
                                <th className="px-6 py-4 font-semibold text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {usersList.map(u => (
                                <tr key={u.UserID} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <p className="font-bold text-gray-900">{u.FullName} {u.UserID === user?.UserID && <span className="text-xs bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded ml-2">You</span>}</p>
                                        <p className="font-mono text-xs text-gray-400 mt-0.5">{u.UserID}</p>
                                    </td>
                                    <td className="px-6 py-4 text-gray-600">
                                        <p className="font-medium">{u.Email}</p>
                                        <p className="text-xs">{u.Phone}</p>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold border uppercase tracking-wide ${u.Role === 'Admin' ? 'bg-primary text-white border-primary' : u.Role === 'Manager' ? 'bg-brand-200 text-brand-900 border-brand-300' : 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                                            {u.Role}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        {u.IsActive === 'TRUE' || u.IsActive === true ? (
                                            <span className="flex items-center gap-1.5 font-bold text-green-600 text-xs"><span className="w-2 h-2 rounded-full bg-green-500"></span> Active</span>
                                        ) : (
                                            <span className="flex items-center gap-1.5 font-bold text-red-600 text-xs"><span className="w-2 h-2 rounded-full bg-red-500"></span> Inactive</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-gray-500 text-xs">
                                        {u.LastLogin ? new Date(u.LastLogin).toLocaleDateString() : 'Never'}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            {u.Email === 'demo@user.com' ? (
                                                <button onClick={() => { setSelectedUser(u); setForm({ FullName: u.FullName, Phone: u.Phone || '', NewEmail: '', NewPassword: '' }); setIsSetupOpen(true); }} className="flex items-center gap-1.5 px-3 py-1.5 text-white bg-emerald-600 hover:bg-emerald-700 rounded shadow-sm font-bold text-xs" title="Setup Account"><UserCog size={14} /> Setup Account</button>
                                            ) : (
                                                <>
                                                    <button onClick={() => { setSelectedUser(u); setForm({ FullName: u.FullName, Phone: u.Phone || '', Role: u.Role }); setIsEditOpen(true); }} className="p-1.5 text-gray-400 hover:text-primary bg-white border border-gray-200 hover:border-blue-200 rounded shadow-sm" title="Edit Profile"><Edit2 size={16} /></button>
                                                    <button onClick={() => { setSelectedUser(u); setForm({ NewPassword: '' }); setIsResetOpen(true); }} className="p-1.5 text-gray-400 hover:text-primary bg-white border border-gray-200 hover:border-brand-300 rounded shadow-sm" title="Reset Password"><KeyRound size={16} /></button>
                                                </>
                                            )}
                                            {u.UserID !== user?.UserID && (u.IsActive === 'TRUE' || u.IsActive === true) && (
                                                <button onClick={() => handleDeactivate(u.UserID)} className="p-1.5 text-red-400 hover:text-white hover:bg-red-500 bg-white border border-gray-200 hover:border-red-500 rounded shadow-sm" title="Deactivate"><ShieldAlert size={16} /></button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <p className="text-center text-xs text-gray-400 italic">User records cannot be hard-deleted to preserve relational CRM data integrity. Use 'Deactivate' to suspend access.</p>

            {/* --- ADD MODAL --- */}
            {isAddOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4 animate-in fade-in">
                    <form onSubmit={handleAddSubmit} className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <h2 className="text-base font-bold text-gray-800">Provision New Staff</h2>
                            <button type="button" onClick={() => setIsAddOpen(false)} className="text-gray-400 hover:text-gray-700"><X size={20} /></button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div><label className="block text-xs font-bold text-gray-700 mb-1">Full Name *</label><input required type="text" value={form.FullName} onChange={e => setForm({ ...form, FullName: e.target.value })} className="w-full px-3 py-2 border rounded" /></div>
                            <div><label className="block text-xs font-bold text-gray-700 mb-1">Email (Login ID) *</label><input required type="email" value={form.Email} onChange={e => setForm({ ...form, Email: e.target.value })} className="w-full px-3 py-2 border rounded" /></div>
                            <div><label className="block text-xs font-bold text-gray-700 mb-1">Phone</label><input type="text" maxLength={10} value={form.Phone} onChange={e => setForm({ ...form, Phone: e.target.value })} className="w-full px-3 py-2 border rounded" /></div>
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1">Role Type *</label>
                                <select value={form.Role} onChange={e => setForm({ ...form, Role: e.target.value })} className="w-full px-3 py-2 border rounded font-bold">
                                    <option value="Staff">Staff</option>
                                    <option value="Manager">Manager</option>
                                    <option value="Admin">Admin</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1">Temporary Password *</label>
                                <input required type="text" value={form.PasswordHash} onChange={e => setForm({ ...form, PasswordHash: e.target.value })} minLength={8} className="w-full px-3 py-2 border rounded bg-gray-50 font-mono tracking-widest text-lg text-center" />
                            </div>
                        </div>
                        <div className="px-6 py-4 bg-gray-50 border-t flex justify-end gap-2">
                            <button type="button" onClick={() => setIsAddOpen(false)} className="px-4 py-2 border rounded font-bold text-sm bg-white hover:bg-gray-100">Cancel</button>
                            <button type="submit" disabled={submitting} className="px-5 py-2 bg-primary text-white rounded font-bold text-sm hover:bg-blue-800 disabled:opacity-50">Create Provision</button>
                        </div>
                    </form>
                </div>
            )}

            {/* --- EDIT MODAL --- */}
            {isEditOpen && selectedUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4 animate-in fade-in">
                    <form onSubmit={handleEditSubmit} className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <h2 className="text-base font-bold text-gray-800">Edit {selectedUser.FullName}</h2>
                        </div>
                        <div className="p-6 space-y-4">
                            <div><label className="block text-xs font-bold text-gray-700 mb-1">Full Name</label><input required type="text" value={form.FullName} onChange={e => setForm({ ...form, FullName: e.target.value })} className="w-full px-3 py-2 border rounded text-sm" /></div>
                            <div><label className="block text-xs font-bold text-gray-700 mb-1">Phone</label><input type="text" maxLength={15} value={form.Phone} onChange={e => setForm({ ...form, Phone: e.target.value })} className="w-full px-3 py-2 border rounded text-sm" /></div>
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1">Role Override</label>
                                <select disabled={selectedUser.UserID === user?.UserID} value={form.Role} onChange={e => setForm({ ...form, Role: e.target.value })} className={`w-full px-3 py-2 border rounded font-bold text-sm ${selectedUser.UserID === user?.UserID ? 'bg-gray-100 text-gray-400' : ''}`}>
                                    <option value="Staff">Staff</option>
                                    <option value="Manager">Manager</option>
                                    <option value="Admin">Admin</option>
                                </select>
                            </div>
                        </div>
                        <div className="px-6 py-4 bg-gray-50 border-t flex justify-end gap-2">
                            <button type="button" onClick={() => setIsEditOpen(false)} className="px-4 py-2 border rounded font-bold text-sm bg-white">Cancel</button>
                            <button type="submit" disabled={submitting} className="px-5 py-2 bg-primary text-white rounded font-bold text-sm hover:bg-blue-800">Update Profile</button>
                        </div>
                    </form>
                </div>
            )}

            {/* --- SETUP ACCOUNT MODAL (one-time for demo@user.com) --- */}
            {isSetupOpen && selectedUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4 animate-in fade-in">
                    <form onSubmit={handleSetupSubmit} className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95">
                        <div className="px-6 py-4 border-b border-emerald-100 flex justify-between items-center bg-emerald-50">
                            <h2 className="text-base font-bold text-emerald-900 flex items-center gap-1.5"><UserCog size={16} /> Initial Account Setup</h2>
                            <button type="button" onClick={() => setIsSetupOpen(false)} className="text-gray-400 hover:text-gray-700"><X size={20} /></button>
                        </div>
                        <div className="p-6 space-y-4">
                            <p className="text-sm text-gray-600 leading-relaxed bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                                This is a <span className="font-bold">one-time setup</span>. Replace the demo credentials with your real admin email and password. After this, email cannot be changed.
                            </p>
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1">Full Name *</label>
                                <input required type="text" value={form.FullName} onChange={e => setForm({ ...form, FullName: e.target.value })} className="w-full px-3 py-2 border rounded text-sm" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1">New Email (Login ID) *</label>
                                <input required type="email" value={form.NewEmail} onChange={e => setForm({ ...form, NewEmail: e.target.value })} placeholder="your-email@company.com" className="w-full px-3 py-2 border rounded text-sm focus:border-emerald-500 focus:ring-emerald-500" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1">Phone</label>
                                <input type="text" maxLength={10} value={form.Phone} onChange={e => setForm({ ...form, Phone: e.target.value })} className="w-full px-3 py-2 border rounded text-sm" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1">New Password (Min 8) *</label>
                                <input required type="text" value={form.NewPassword} onChange={e => setForm({ ...form, NewPassword: e.target.value })} minLength={8} className="w-full px-3 py-2 border rounded bg-gray-50 font-mono tracking-widest text-lg text-center focus:border-emerald-500 focus:ring-emerald-500" />
                            </div>
                        </div>
                        <div className="px-6 py-4 bg-gray-50 border-t flex justify-end gap-2">
                            <button type="button" onClick={() => setIsSetupOpen(false)} className="px-4 py-2 border rounded font-bold text-sm bg-white hover:bg-gray-100">Cancel</button>
                            <button type="submit" disabled={submitting} className="px-5 py-2 bg-emerald-600 text-white rounded font-bold text-sm hover:bg-emerald-700 disabled:opacity-50 shadow-sm">Complete Setup</button>
                        </div>
                    </form>
                </div>
            )}

            {/* --- RESET PASSWORD MODAL --- */}
            {isResetOpen && selectedUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4 animate-in fade-in">
                    <form onSubmit={handleResetSubmit} className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95">
                        <div className="px-6 py-4 border-b border-brand-100 flex justify-between items-center bg-brand-50">
                            <h2 className="text-base font-bold text-primary flex items-center gap-1.5"><KeyRound size={16} /> Override Vault Key</h2>
                        </div>
                        <div className="p-6">
                            <p className="text-sm text-gray-600 mb-6 leading-relaxed">You are aggressively resetting the vault key for <span className="font-bold text-gray-900">{selectedUser.FullName}</span>.</p>
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1">Mandate Password (Min 8)</label>
                                <input required type="text" value={form.NewPassword} onChange={e => setForm({ ...form, NewPassword: e.target.value })} minLength={8} className="w-full px-3 py-2 border rounded bg-gray-50 font-mono tracking-widest text-lg text-center focus:border-primary focus:ring-primary text-primary" />
                            </div>
                        </div>
                        <div className="px-6 py-4 bg-gray-50 border-t flex justify-end gap-2">
                            <button type="button" onClick={() => setIsResetOpen(false)} className="px-4 py-2 border rounded font-bold text-sm bg-white">Cancel</button>
                            <button type="submit" disabled={submitting} className="px-5 py-2 bg-primary text-white rounded font-bold text-sm hover:bg-blue-800 shadow-sm">Execute Reset</button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}