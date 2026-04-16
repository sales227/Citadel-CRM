import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getLeads, getCustomers, getUsers, createLead, updateLead, updateCustomer as updateCustomerApi, deleteLeads, deleteAllLeads } from '../api/apiService';
import { getVisibleLeads } from '../utils/permissions';
import { useSyncData } from '../hooks/useSyncData';
import {
    Search, Plus, User, Phone, Building2, Trash2, MoreHorizontal,
    MessageSquare, ChevronDown, ChevronRight, X, AlertCircle, CheckCircle2,
    ChevronLeft, Upload, RefreshCw, Pencil
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { processLeadWorkbook } from '../utils/sheetsImportHelper';

export default function LeadsPage() {
    const { user, isAdmin } = useAuth();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { syncing, getLastSyncDisplay, syncData } = useSyncData();

    const [leads, setLeads] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [users, setUsers] = useState([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [importing, setImporting] = useState(false);
    const [importProgress, setImportProgress] = useState('');

    // Filters — pre-populate from URL params when navigating from Dashboard
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'All');
    const [sourceFilter, setSourceFilter] = useState('All');
    const [assignedFilter, setAssignedFilter] = useState('All');
    const [dateFilter, setDateFilter] = useState(searchParams.get('dateFilter') || 'All'); // 'today' | 'All'

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalStep, setModalStep] = useState(1);
    const [formData, setFormData] = useState({
        // Step 1
        CustomerName: '',
        Phone: '',
        Email: '',
        CompanyName: '',
        City: '',
        GSTNumber: '',
        existingCustomerID: null,
        // Step 2
        LeadSource: '',
        AdName: '',
        CampaignName: '',
        ProductRequired: [],
        Quantity: '',
        Unit: 'Cubic Meters',
        RequirementTimeline: '',
        AssignedUserID: user?.UserID || '',
        // Step 3
        Feedback: '',
        Remark1: '',
        Remark2: '',
        NextFollowUpDate: ''
    });
    const [formErrors, setFormErrors] = useState({});
    const [existingCustomerAlert, setExistingCustomerAlert] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [toastMessage, setToastMessage] = useState('');

    // Selection & Delete state
    const [selectedIds, setSelectedIds] = useState(new Set());
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showDeleteAllModal, setShowDeleteAllModal] = useState(false);
    const [deleteAllConfirmText, setDeleteAllConfirmText] = useState('');
    const [deleting, setDeleting] = useState(false);
    const [showMoreMenu, setShowMoreMenu] = useState(false);
    const [editingLead, setEditingLead] = useState(null);

    useEffect(() => {
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [leadsRes, custsRes, usersRes] = await Promise.all([
                getLeads(isAdmin ? {} : { assignedUser: user?.UserID }),
                getCustomers(isAdmin ? {} : { staffID: user?.UserID }),
                getUsers()
            ]);
            // Apply permission-based filtering
            const filteredLeads = getVisibleLeads(leadsRes, user);
            setLeads(filteredLeads);
            setCustomers(custsRes);
            setUsers(usersRes);
        } catch (err) {
            setError('Failed to load leads data.');
        } finally {
            setLoading(false);
        }
    };

    const showToast = (msg) => {
        setToastMessage(msg);
        setTimeout(() => setToastMessage(''), 3000);
    };

    // -------------------------
    // Selection Logic
    // -------------------------
    const toggleSelect = (id) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    const toggleSelectAll = () => {
        if (selectedIds.size === filteredLeads.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(filteredLeads.map(l => l.LeadID)));
        }
    };

    const handleDeleteSelected = async () => {
        setDeleting(true);
        try {
            const ids = Array.from(selectedIds);
            await deleteLeads(ids, user?.UserID);
            showToast(`${ids.length} lead(s) deleted`);
            setSelectedIds(new Set());
            setShowDeleteModal(false);
            fetchData();
        } catch (e) {
            alert("Delete failed: " + (e.message || "Unknown error"));
        } finally {
            setDeleting(false);
        }
    };

    const handleDeleteAll = async () => {
        setDeleting(true);
        try {
            await deleteAllLeads(user?.UserID);
            showToast("All leads deleted");
            setSelectedIds(new Set());
            setShowDeleteAllModal(false);
            setDeleteAllConfirmText('');
            fetchData();
        } catch (e) {
            alert("Delete failed: " + (e.message || "Unknown error"));
        } finally {
            setDeleting(false);
        }
    };

    // -------------------------
    // Edit Logic
    // -------------------------
    const openEditModal = (lead) => {
        const cust = customers.find(c => c.CustomerID === lead.CustomerID);
        const productStr = lead['ProductRequired (AAC Blocks/Citabond Mortar/Kavach Plaster)'] || '';
        const products = productStr.split(', ').filter(p => ['AAC Blocks', 'Citabond Mortar', 'Kavach Plaster'].includes(p));
        const qr = lead.QuantityRequired || '';
        const qrMatch = qr.match(/^(\d+\.?\d*)\s+(.+)$/);

        setFormData({
            CustomerName: cust?.CustomerName || '',
            Phone: String(cust?.Phone || ''),
            Email: cust?.Email || '',
            CompanyName: cust?.CompanyName || '',
            City: cust?.City || '',
            GSTNumber: cust?.GSTNumber || '',
            existingCustomerID: cust?.CustomerID || null,
            LeadSource: lead['LeadSource (Phone/Instagram/Facebook/Walk-in)'] || '',
            AdName: lead.AdName || '',
            CampaignName: lead.CampaignName || '',
            ProductRequired: products,
            Quantity: qrMatch ? qrMatch[1] : '',
            Unit: qrMatch ? qrMatch[2] : 'Cubic Meters',
            RequirementTimeline: lead.RequirementTimeline || '',
            AssignedUserID: lead.AssignedUserID || user?.UserID || '',
            Feedback: '', Remark1: '', Remark2: '', NextFollowUpDate: ''
        });
        setEditingLead(lead);
        setModalStep(1);
        setFormErrors({});
        setExistingCustomerAlert(null);
        setIsModalOpen(true);
    };

    const handleUpdate = async () => {
        if (!validateStep2()) return;
        setSubmitting(true);
        try {
            if (editingLead.CustomerID) {
                await updateCustomerApi(editingLead.CustomerID, {
                    CustomerName: formData.CustomerName,
                    Phone: formData.Phone,
                    Email: formData.Email,
                    CompanyName: formData.CompanyName,
                    City: formData.City,
                    GSTNumber: formData.GSTNumber
                });
            }
            await updateLead(editingLead.LeadID, {
                "LeadSource (Phone/Instagram/Facebook/Walk-in)": formData.LeadSource,
                "ProductRequired (AAC Blocks/Citabond Mortar/Kavach Plaster)": formData.ProductRequired.join(', '),
                AssignedUserID: formData.AssignedUserID,
                AdName: formData.AdName || '',
                CampaignName: formData.CampaignName || '',
                QuantityRequired: formData.Quantity ? `${formData.Quantity} ${formData.Unit}` : '',
                RequirementTimeline: formData.RequirementTimeline || '',
                logUserID: user?.UserID
            });
            showToast("Lead updated successfully!");
            setIsModalOpen(false);
            setEditingLead(null);
            setModalStep(1);
            setFormData({
                CustomerName: '', Phone: '', Email: '', CompanyName: '', City: '', GSTNumber: '', existingCustomerID: null,
                LeadSource: '', AdName: '', CampaignName: '', ProductRequired: [], Quantity: '', Unit: 'Cubic Meters', RequirementTimeline: '', AssignedUserID: user?.UserID || '',
                Feedback: '', Remark1: '', Remark2: '', NextFollowUpDate: ''
            });
            fetchData();
        } catch (err) {
            console.error(err);
            alert("Error updating lead. Please check console.");
        } finally {
            setSubmitting(false);
        }
    };

    // -------------------------
    // Filtering Logic
    // -------------------------
    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);

    const filteredLeads = leads.filter(l => {
        const cust = customers.find(c => c.CustomerID === l.CustomerID);
        const cName = cust?.CustomerName?.toLowerCase() || '';
        const cPhone = (cust?.Phone ?? '').toString();
        const cComp = cust?.CompanyName?.toLowerCase() || '';

        const matchesSearch = cName.includes(searchTerm.toLowerCase()) ||
            cPhone.includes(searchTerm) ||
            cComp.includes(searchTerm.toLowerCase());

        const matchesStatus = statusFilter === 'All' || l['LeadStatus (New/Contacted/Quoted/Negotiating/Won/Lost)'] === statusFilter;
        const matchesSource = sourceFilter === 'All' || l['LeadSource (Phone/Instagram/Facebook/Walk-in)'] === sourceFilter;
        const matchesAssigned = assignedFilter === 'All' || l.AssignedUserID === assignedFilter;

        const matchesDate = dateFilter !== 'today' || new Date(l.CreatedAt) >= todayStart;

        return matchesSearch && matchesStatus && matchesSource && matchesAssigned && matchesDate;
    });

    const getStatusColor = (status) => {
        switch (status) {
            case 'New':         return 'bg-gray-100    text-gray-600    border-gray-200';
            case 'Contacted':   return 'bg-sky-100     text-sky-700     border-sky-200';
            case 'Quoted':      return 'bg-violet-100  text-violet-700  border-violet-200';
            case 'Negotiating': return 'bg-amber-100   text-amber-700   border-amber-200';
            case 'Won':         return 'bg-green-100   text-green-700   border-green-200';
            case 'Lost':        return 'bg-red-100     text-red-600     border-red-200';
            default:            return 'bg-gray-100    text-gray-600    border-gray-200';
        }
    };

    const handleStatusChange = async (leadId, newStatus) => {
        try {
            await updateLead(leadId, { "LeadStatus (New/Contacted/Quoted/Negotiating/Won/Lost)": newStatus, logUserID: user?.UserID });
            setLeads(leads.map(l => l.LeadID === leadId ? { ...l, "LeadStatus (New/Contacted/Quoted/Negotiating/Won/Lost)": newStatus } : l));
            showToast(`Status updated to ${newStatus}`);
        } catch (e) {
            alert("Failed to update status.");
        }
    };

    // -------------------------
    // Modal Handlers
    // -------------------------
    const handleInputChange = (e) => {
        const { name, value, checked } = e.target;
        if (name === 'ProductRequired') {
            let current = [...formData.ProductRequired];
            if (checked) current.push(value);
            else current = current.filter(item => item !== value);
            setFormData({ ...formData, ProductRequired: current });
        } else {
            setFormData({ ...formData, [name]: value });
        }

        if (formErrors[name]) {
            setFormErrors({ ...formErrors, [name]: null });
        }
    };

    const checkExistingPhone = () => {
        if (formData.Phone && formData.Phone.length >= 10) {
            const match = customers.find(c => {
                const cPhone = (c.Phone ?? '').toString();
                return cPhone.includes(formData.Phone) || formData.Phone.includes(cPhone);
            });
            if (match && formData.existingCustomerID !== match.CustomerID) {
                setExistingCustomerAlert(match);
            }
        }
    };

    const applyExistingCustomer = () => {
        if (existingCustomerAlert) {
            setFormData({
                ...formData,
                CustomerName: existingCustomerAlert.CustomerName,
                Phone: existingCustomerAlert.Phone,
                Email: existingCustomerAlert.Email || '',
                CompanyName: existingCustomerAlert.CompanyName || '',
                City: existingCustomerAlert.City || '',
                GSTNumber: existingCustomerAlert.GSTNumber || '',
                existingCustomerID: existingCustomerAlert.CustomerID
            });
            setExistingCustomerAlert(null);
        }
    };

    const validateStep1 = () => {
        let errors = {};
        if (!formData.CustomerName.trim()) errors.CustomerName = "Customer Name is required";
        if (!formData.Phone.trim() || formData.Phone.replace(/\\D/g, '').length < 10) errors.Phone = "Valid 10-digit Phone is required";
        if (formData.GSTNumber && formData.GSTNumber.length !== 15 && formData.GSTNumber.length > 0) errors.GSTNumber = "GST must be exactly 15 characters";

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const validateStep2 = () => {
        let errors = {};
        if (!formData.LeadSource) errors.LeadSource = "Lead Source is required";
        if (formData.ProductRequired.length === 0) errors.ProductRequired = "Select at least one product";

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const validateStep3 = () => {
        let errors = {};
        if (!formData.Feedback) errors.Feedback = "Initial feedback is required";

        if (!formData.NextFollowUpDate) {
            errors.NextFollowUpDate = "Next follow-up date is required";
        } else {
            const selected = new Date(formData.NextFollowUpDate);
            selected.setHours(0, 0, 0, 0);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            if (selected < today) errors.NextFollowUpDate = "Date cannot be in the past";
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleNext = () => {
        if (modalStep === 1 && validateStep1()) setModalStep(2);
        else if (modalStep === 2 && !editingLead && validateStep2()) setModalStep(3);
    };

    const handleBack = () => {
        if (modalStep > 1) setModalStep(modalStep - 1);
    };

    const handleSubmit = async () => {
        if (!validateStep3()) return;

        setSubmitting(true);
        try {
            const payload = {
                AssignedUserID: formData.AssignedUserID || user?.UserID,
                CustomerID: formData.existingCustomerID || '',
                CustomerData: formData.existingCustomerID ? null : {
                    CustomerName: formData.CustomerName,
                    Phone: formData.Phone,
                    Email: formData.Email,
                    CompanyName: formData.CompanyName,
                    City: formData.City,
                    GSTNumber: formData.GSTNumber
                },
                LeadSource: formData.LeadSource,
                AdName: formData.AdName,
                CampaignName: formData.CampaignName,
                ProductRequired: formData.ProductRequired.join(', '),
                QuantityRequired: formData.Quantity ? `${formData.Quantity} ${formData.Unit}` : '',
                RequirementTimeline: formData.RequirementTimeline
            };

            const res = await createLead(payload);

            // We also need to log the initial interaction
            // (This could be wrapped in createLead on backend, but since we didn't add it there perfectly matching this payload, we do 2 calls or handle it contextually)
            // Actually our createLead in Code.gs doesn't take Interaction data in the same call.
            // So we must fire createInteraction as well!

            if (res.LeadID) {
                await import('../api/apiService').then(api => {
                    return api.createInteraction({
                        LeadID: res.LeadID,
                        CustomerID: res.CustomerID,
                        Type: 'Call', // Default for initial Creation wizard
                        Feedback: formData.Feedback,
                        Remark1: formData.Remark1,
                        Remark2: formData.Remark2,
                        NextFollowUpDate: formData.NextFollowUpDate,
                        CreatedByUserID: user?.UserID
                    });
                });
            }

            showToast("Lead created successfully!");
            setIsModalOpen(false);

            // Reset form
            setModalStep(1);
            setFormData({
                CustomerName: '', Phone: '', Email: '', CompanyName: '', City: '', GSTNumber: '', existingCustomerID: null,
                LeadSource: '', AdName: '', CampaignName: '', ProductRequired: [], Quantity: '', Unit: 'Cubic Meters', RequirementTimeline: '', AssignedUserID: user?.UserID || '',
                Feedback: '', Remark1: '', Remark2: '', NextFollowUpDate: ''
            });

            fetchData(); // reload
        } catch (err) {
            console.error(err);
            alert("Error creating lead. Please check console.");
        } finally {
            setSubmitting(false);
        }
    };

    // -------------------------
    // Pull-to-refresh
    // -------------------------
    const [touchStartY, setTouchStartY] = useState(0);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const handleTouchStart = (e) => {
        if (window.scrollY === 0) {
            setTouchStartY(e.touches[0].clientY);
        } else {
            setTouchStartY(0);
        }
    };

    const handleTouchMove = (e) => {
        if (touchStartY === 0) return;
        const currentY = e.touches[0].clientY;
        if (currentY - touchStartY > 80 && !isRefreshing) {
            setIsRefreshing(true);
            setTouchStartY(0);
            fetchData().finally(() => setIsRefreshing(false));
        }
    };

    // -------------------------
    // Renderers
    // -------------------------
    return (
        <div
            className="space-y-6 min-h-[50vh]"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
        >
            {isRefreshing && (
                <div className="flex justify-center py-4 absolute top-0 left-0 right-0 z-10 bg-white shadow-sm border-b animate-in slide-in-from-top-full">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                    <span className="ml-2 text-primary font-bold text-sm">Refreshing...</span>
                </div>
            )}

            {/* Toast Notification */}
            {toastMessage && (
                <div className="fixed top-20 right-4 z-50 bg-green-50 text-green-800 border border-green-200 px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 animate-in slide-in-from-top-2">
                    <CheckCircle2 size={20} className="text-green-600" />
                    <span className="font-medium text-sm">{toastMessage}</span>
                </div>
            )}

            {/* Import Progress Banner */}
            {importing && (
                <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded-lg flex items-center gap-3 shadow-sm">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 shrink-0"></div>
                    <span className="text-sm font-medium">{importProgress || 'Importing…'}</span>
                </div>
            )}

            {/* Top Controls Bar */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
                <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto flex-1">
                    <div className="relative flex-1 lg:max-w-xs">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search size={18} className="text-gray-400" />
                        </div>
                        <input
                            type="text"
                            placeholder="Search by Name, Phone, Company..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary focus:border-primary sm:text-sm transition-colors"
                        />
                    </div>

                    <div className="flex gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0 hide-scrollbar">
                        {dateFilter === 'today' && (
                            <button
                                onClick={() => setDateFilter('All')}
                                className="flex items-center gap-1.5 px-3 py-2 bg-primary text-white text-sm font-bold rounded-md whitespace-nowrap shrink-0"
                                title="Clear today filter"
                            >
                                Today's Leads
                                <span className="text-blue-200 hover:text-white ml-0.5">✕</span>
                            </button>
                        )}
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="block w-full sm:w-36 pl-3 pr-8 py-2 text-sm border border-gray-300 bg-white rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                        >
                            <option value="All">All Statuses</option>
                            <option value="New">New</option>
                            <option value="Contacted">Contacted</option>
                            <option value="Quoted">Quoted</option>
                            <option value="Negotiating">Negotiating</option>
                            <option value="Won">Won</option>
                            <option value="Lost">Lost</option>
                        </select>

                        <select
                            value={sourceFilter}
                            onChange={(e) => setSourceFilter(e.target.value)}
                            className="block w-full sm:w-36 pl-3 pr-8 py-2 text-sm border border-gray-300 bg-white rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                        >
                            <option value="All">All Sources</option>
                            <option value="Phone">Phone</option>
                            <option value="Instagram">Instagram</option>
                            <option value="Facebook">Facebook</option>
                            <option value="Walk-in">Walk-in</option>
                        </select>

                        {isAdmin && (
                            <select
                                value={assignedFilter}
                                onChange={(e) => setAssignedFilter(e.target.value)}
                                className="block w-full sm:w-40 pl-3 pr-8 py-2 text-sm border border-gray-300 bg-white rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                            >
                                <option value="All">All Staff</option>
                                {users.map(u => (
                                    <option key={u.UserID} value={u.UserID}>{u.FullName}</option>
                                ))}
                            </select>
                        )}
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto shrink-0">
                    <label className="flex items-center justify-center gap-2 bg-white border-2 border-primary text-primary px-4 py-2 rounded-md shadow-sm font-medium text-sm hover:bg-blue-50 transition-colors cursor-pointer whitespace-nowrap">
                        <Upload size={18} /> Import Excel / CSV
                        <input
                            type="file"
                            accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                            className="hidden"
                            onChange={async (e) => {
                                const file = e.target.files[0];
                                if (!file) return;
                                setImporting(true);
                                setImportProgress('Reading file…');

                                try {
                                    const reader = new FileReader();
                                    reader.onload = async (evt) => {
                                        try {
                                            // Use ArrayBuffer (modern approach — works with all xlsx versions)
                                            const workbook = XLSX.read(new Uint8Array(evt.target.result), { type: 'array' });

                                            setImportProgress('Scanning sheets…');

                                            // Build set of existing phones (digits-only) for deduplication.
                                            // Also normalise country code to match helper's normalization.
                                            const existingPhones = new Set(
                                                customers.map(c => {
                                                    let d = String(c.Phone || '').replace(/\D/g, '');
                                                    if (d.length === 12 && d.startsWith('91')) d = d.slice(2);
                                                    else if (d.length === 13 && d.startsWith('091')) d = d.slice(3);
                                                    return d;
                                                }).filter(p => p.length >= 10)
                                            );

                                            // Process ALL sheets — detect lead sheets, extract and deduplicate
                                            const { leads: importedLeads, stats, errors: parseErrors } = processLeadWorkbook(
                                                workbook,
                                                users,
                                                existingPhones
                                            );

                                            if (parseErrors.length > 0) {
                                                console.warn('Import sheet warnings:', parseErrors);
                                            }

                                            if (importedLeads.length === 0) {
                                                setImporting(false);
                                                setImportProgress('');
                                                const totalSheets = stats.sheetsProcessed + stats.sheetSkipped;
                                                showToast(`No new leads found across ${totalSheets} sheet(s). Check that columns like "Customer/Lead Name", "Contact Details" and "Lead Status" exist.`);
                                                e.target.value = '';
                                                return;
                                            }

                                            let successCount = 0;
                                            let skipCount = 0;

                                            for (let i = 0; i < importedLeads.length; i++) {
                                                const lead = importedLeads[i];
                                                setImportProgress(`Importing ${i + 1} / ${importedLeads.length}…`);
                                                try {
                                                    await createLead({
                                                        AssignedUserID: lead.AssignedUserID || user?.UserID || '',
                                                        CustomerID: '',
                                                        CustomerData: {
                                                            CustomerName: lead.CustomerName,
                                                            Phone: lead.Phone,
                                                            Email: lead.Email || '',
                                                            CompanyName: lead.CompanyName || '',
                                                            City: lead.City || '',
                                                            GSTNumber: lead.GSTNumber || ''
                                                        },
                                                        LeadSource: lead.LeadSource || 'Phone',
                                                        AdName: '',
                                                        CampaignName: '',
                                                        ProductRequired: lead.ProductRequired || 'AAC Blocks',
                                                        QuantityRequired: '',
                                                        RequirementTimeline: 'Not Sure',
                                                        ContactPerson: lead.ContactPerson || '',
                                                        Region: lead.Region || '',
                                                        Remark1: lead.Remark1 || '',
                                                        Remark2: lead.Remark2 || '',
                                                        ImportedStatus: lead.Status || 'New',
                                                        OrderFlag: lead.OrderFlag || 'N',
                                                        OrderValue: lead.OrderValue || '',
                                                        PaymentStatus: lead.PaymentStatus || '',
                                                        ImportedDate: lead.CreatedDate || ''
                                                    });
                                                    successCount++;
                                                } catch (rowError) {
                                                    console.error(`Failed to import lead: ${lead.CustomerName}`, rowError);
                                                    skipCount++;
                                                }
                                            }

                                            setImporting(false);
                                            setImportProgress('');
                                            let msg = `Imported ${successCount} lead(s) from ${stats.sheetsProcessed} sheet(s)`;
                                            if (stats.duplicatesRemoved > 0) msg += ` · ${stats.duplicatesRemoved} duplicate(s) skipped`;
                                            if (skipCount > 0) msg += ` · ${skipCount} failed`;
                                            showToast(msg);
                                            e.target.value = '';
                                            fetchData();
                                        } catch (parseError) {
                                            console.error(parseError);
                                            setImporting(false);
                                            setImportProgress('');
                                            showToast('Failed to parse file. Please check the format.');
                                            e.target.value = '';
                                        }
                                    };
                                    reader.readAsArrayBuffer(file);
                                } catch (error) {
                                    console.error(error);
                                    setImporting(false);
                                    setImportProgress('');
                                    showToast('Failed to read file.');
                                    e.target.value = '';
                                }
                            }}
                        />
                    </label>
                    <button
                        onClick={() => syncData([fetchData])}
                        disabled={syncing}
                        className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors shadow-sm font-medium text-sm whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                        title={`Refresh data (${getLastSyncDisplay()})`}
                    >
                        <RefreshCw size={18} className={syncing ? 'animate-spin' : ''} />
                        {syncing ? 'Syncing...' : 'Sync Now'}
                    </button>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center justify-center gap-2 bg-primary text-white px-4 py-2.5 rounded-md hover:bg-blue-800 transition-colors shadow-sm font-medium text-sm whitespace-nowrap"
                    >
                        <Plus size={18} /> New Lead
                    </button>
                    {isAdmin && (
                        <div className="relative">
                            <button
                                onClick={() => setShowMoreMenu(!showMoreMenu)}
                                className="flex items-center justify-center p-2.5 rounded-md border border-gray-300 text-gray-500 hover:bg-gray-50 transition-colors shadow-sm"
                                title="More actions"
                            >
                                <MoreHorizontal size={18} />
                            </button>
                            {showMoreMenu && (
                                <>
                                    <div className="fixed inset-0 z-40" onClick={() => setShowMoreMenu(false)} />
                                    <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50 py-1">
                                        <button
                                            onClick={() => { setShowMoreMenu(false); setShowDeleteAllModal(true); }}
                                            className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 font-medium flex items-center gap-2"
                                        >
                                            <Trash2 size={16} /> Delete All Leads
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Bulk Action Bar */}
            {selectedIds.size > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 flex items-center justify-between shadow-sm animate-in slide-in-from-top-2">
                    <div className="flex items-center gap-3">
                        <input type="checkbox" checked readOnly className="w-4 h-4 text-primary rounded" />
                        <span className="text-sm font-bold text-blue-800">{selectedIds.size} lead{selectedIds.size > 1 ? 's' : ''} selected</span>
                        <button onClick={() => setSelectedIds(new Set())} className="text-xs text-blue-600 hover:text-blue-800 underline">Clear</button>
                    </div>
                    <button
                        onClick={() => setShowDeleteModal(true)}
                        className="flex items-center gap-1.5 px-4 py-2 bg-red-600 text-white text-sm font-bold rounded-lg hover:bg-red-700 transition-colors shadow-sm"
                    >
                        <Trash2 size={16} /> Delete Selected
                    </button>
                </div>
            )}

            {/* Main Content Area */}
            {loading ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
            ) : error ? (
                <div className="bg-red-50 text-red-700 p-4 rounded-xl border border-red-200 text-center">{error}</div>
            ) : filteredLeads.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 flex flex-col items-center justify-center text-center">
                    <div className="bg-gray-50 p-4 rounded-full mb-4">
                        <User size={32} className="text-gray-400" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-1">No leads found</h3>
                    <p className="text-sm text-gray-500 max-w-sm">
                        {dateFilter === 'today' ? "No new leads were added today." : searchTerm || statusFilter !== 'All' ? "Try adjusting your filters or search terms." : "You don't have any leads yet. Click 'New Lead' to get started."}
                    </p>
                </div>
            ) : (
                <>
                    {/* Desktop Table */}
                    <div className="hidden md:block bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 text-xs uppercase tracking-wider">
                                        {isAdmin && <th className="pl-6 pr-2 py-4 w-10">
                                            <input
                                                type="checkbox"
                                                checked={filteredLeads.length > 0 && selectedIds.size === filteredLeads.length}
                                                onChange={toggleSelectAll}
                                                className="w-4 h-4 text-primary rounded border-gray-300 cursor-pointer"
                                            />
                                        </th>}
                                        <th className="px-6 py-4 font-semibold">Customer</th>
                                        <th className="px-6 py-4 font-semibold">Product & Source</th>
                                        <th className="px-6 py-4 font-semibold">Status</th>
                                        {isAdmin && <th className="px-6 py-4 font-semibold">Assigned To</th>}
                                        <th className="px-6 py-4 font-semibold">Created / Ref</th>
                                        <th className="px-6 py-4 font-semibold text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {filteredLeads.map((lead) => {
                                        const cust = customers.find(c => c.CustomerID === lead.CustomerID);
                                        const assign = users.find(u => u.UserID === lead.AssignedUserID);
                                        const status = lead['LeadStatus (New/Contacted/Quoted/Negotiating/Won/Lost)'];

                                        return (
                                            <tr key={lead.LeadID} className={`transition-colors group ${selectedIds.has(lead.LeadID) ? 'bg-blue-50' : 'hover:bg-blue-50/30'}`}>
                                                {isAdmin && <td className="pl-6 pr-2 py-4" onClick={e => e.stopPropagation()}>
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedIds.has(lead.LeadID)}
                                                        onChange={() => toggleSelect(lead.LeadID)}
                                                        className="w-4 h-4 text-primary rounded border-gray-300 cursor-pointer"
                                                    />
                                                </td>}
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 font-bold shrink-0">
                                                            {(cust?.CustomerName || 'U').charAt(0).toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-bold text-gray-900">{cust?.CustomerName || 'Unknown'}</p>
                                                            <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5"><Phone size={12} />{cust?.Phone}</p>
                                                            {cust?.CompanyName && <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5"><Building2 size={12} />{cust.CompanyName}</p>}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <p className="text-sm font-medium text-gray-900">{lead['ProductRequired (AAC Blocks/Citabond Mortar/Kavach Plaster)']}</p>
                                                    <p className="text-xs text-gray-500 mt-1">{lead['LeadSource (Phone/Instagram/Facebook/Walk-in)']}</p>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="relative group inline-block">
                                                        <select
                                                            value={status}
                                                            onChange={(e) => handleStatusChange(lead.LeadID, e.target.value)}
                                                            className={`appearance-none px-3 py-1 pr-6 rounded-full text-xs font-bold border cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-primary ${getStatusColor(status)}`}
                                                        >
                                                            <option value="New">New</option>
                                                            <option value="Contacted">Contacted</option>
                                                            <option value="Quoted">Quoted</option>
                                                            <option value="Negotiating">Negotiating</option>
                                                            <option value="Won">Won</option>
                                                            <option value="Lost">Lost</option>
                                                        </select>
                                                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                                                            <ChevronDown size={14} />
                                                        </div>
                                                    </div>
                                                </td>
                                                {isAdmin && (
                                                    <td className="px-6 py-4 text-sm text-gray-600">
                                                        {assign?.FullName || lead.AssignedUserID}
                                                    </td>
                                                )}
                                                <td className="px-6 py-4">
                                                    <p className="text-sm text-gray-900">{new Date(lead.CreatedAt).toLocaleDateString()}</p>
                                                    <p className="text-xs text-gray-400 mt-1 font-mono">{lead.LeadID}</p>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button onClick={(e) => { e.stopPropagation(); openEditModal(lead); }} className="p-2 text-gray-400 hover:text-primary hover:bg-blue-50 rounded-md transition-colors" title="Edit Lead">
                                                            <Pencil size={18} />
                                                        </button>
                                                        <button className="p-2 text-gray-400 hover:text-primary hover:bg-blue-50 rounded-md transition-colors" title="Log Interaction">
                                                            <MessageSquare size={18} />
                                                        </button>
                                                        <button onClick={() => navigate(`/leads/${lead.LeadID}`)} className="p-2 text-gray-400 hover:text-primary hover:bg-blue-50 rounded-md transition-colors" title="View Details">
                                                            <ChevronRight size={18} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Mobile Cards */}
                    <div className="md:hidden space-y-4">
                        {filteredLeads.map((lead) => {
                            const cust = customers.find(c => c.CustomerID === lead.CustomerID);
                            const status = lead['LeadStatus (New/Contacted/Quoted/Negotiating/Won/Lost)'];

                            return (
                                <div key={lead.LeadID} className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 hover:border-primary transition-colors cursor-pointer" onClick={() => navigate(`/leads/${lead.LeadID}`)}>
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <h4 className="font-bold text-gray-900 text-base">{cust?.CustomerName || 'Unknown'}</h4>
                                            <p className="text-xs text-gray-500 mt-1">{cust?.Phone}</p>
                                        </div>
                                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wide ${getStatusColor(status)}`}>
                                            {status}
                                        </span>
                                    </div>

                                    <div className="bg-gray-50 rounded-lg p-3 mb-4 flex divide-x divide-gray-200 text-sm">
                                        <div className="flex-1 pr-3">
                                            <p className="text-xs text-gray-400 mb-1">Product</p>
                                            <p className="font-medium text-gray-800 line-clamp-1">{lead['ProductRequired (AAC Blocks/Citabond Mortar/Kavach Plaster)']}</p>
                                        </div>
                                        <div className="flex-1 pl-3">
                                            <p className="text-xs text-gray-400 mb-1">Source</p>
                                            <p className="font-medium text-gray-800">{lead['LeadSource (Phone/Instagram/Facebook/Walk-in)']}</p>
                                        </div>
                                    </div>

                                    <div className="flex gap-2">
                                        <button onClick={(e) => { e.stopPropagation(); openEditModal(lead); }} className="flex-1 py-2 bg-blue-50 text-primary rounded-lg text-sm font-bold flex items-center justify-center gap-2">
                                            <Pencil size={16} /> Edit Lead
                                        </button>
                                        <button onClick={(e) => { e.stopPropagation(); navigate(`/leads/${lead.LeadID}`); }} className="flex-none w-10 h-10 bg-gray-50 border border-gray-200 text-gray-600 rounded-lg flex items-center justify-center">
                                            <ChevronRight size={20} />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </>
            )}

            {/* --- DELETE SELECTED MODAL --- */}
            {showDeleteModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4 animate-in fade-in">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95">
                        <div className="px-6 py-4 border-b border-red-100 bg-red-50 flex items-center gap-2">
                            <Trash2 size={18} className="text-red-600" />
                            <h2 className="text-base font-bold text-red-900">Delete {selectedIds.size} lead{selectedIds.size > 1 ? 's' : ''}?</h2>
                        </div>
                        <div className="p-6">
                            <p className="text-sm text-gray-600">This action cannot be undone. The selected leads will be permanently removed from the system.</p>
                        </div>
                        <div className="px-6 py-4 bg-gray-50 border-t flex justify-end gap-2">
                            <button onClick={() => setShowDeleteModal(false)} disabled={deleting} className="px-4 py-2 border rounded-lg font-bold text-sm bg-white hover:bg-gray-100">Cancel</button>
                            <button onClick={handleDeleteSelected} disabled={deleting} className="px-5 py-2 bg-red-600 text-white rounded-lg font-bold text-sm hover:bg-red-700 disabled:opacity-50 shadow-sm flex items-center gap-1.5">
                                {deleting ? <><div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div> Deleting...</> : <><Trash2 size={16} /> Delete</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- DELETE ALL MODAL --- */}
            {showDeleteAllModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4 animate-in fade-in">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95">
                        <div className="px-6 py-4 border-b border-red-100 bg-red-50 flex items-center gap-2">
                            <AlertCircle size={18} className="text-red-600" />
                            <h2 className="text-base font-bold text-red-900">Delete ALL leads?</h2>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="bg-red-50 border border-red-200 rounded-lg p-3 space-y-1">
                                <p className="text-sm font-bold text-red-800">You are about to permanently delete all leads.</p>
                                <p className="text-sm text-red-700">This action cannot be undone.</p>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1.5">Type <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded text-red-600">DELETE ALL</span> to confirm:</label>
                                <input
                                    type="text"
                                    value={deleteAllConfirmText}
                                    onChange={e => setDeleteAllConfirmText(e.target.value)}
                                    placeholder="DELETE ALL"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono text-center tracking-widest focus:border-red-500 focus:ring-red-500"
                                />
                            </div>
                        </div>
                        <div className="px-6 py-4 bg-gray-50 border-t flex justify-end gap-2">
                            <button onClick={() => { setShowDeleteAllModal(false); setDeleteAllConfirmText(''); }} disabled={deleting} className="px-4 py-2 border rounded-lg font-bold text-sm bg-white hover:bg-gray-100">Cancel</button>
                            <button onClick={handleDeleteAll} disabled={deleting || deleteAllConfirmText !== 'DELETE ALL'} className="px-5 py-2 bg-red-600 text-white rounded-lg font-bold text-sm hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm flex items-center gap-1.5">
                                {deleting ? <><div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div> Deleting...</> : <><Trash2 size={16} /> Delete All Leads</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- CREATE LEAD MODAL WIZARD --- */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto flex flex-col pointer-events-auto shrink-0 animate-in zoom-in-95 duration-200">

                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10">
                            <h2 className="text-xl font-bold text-gray-800">{editingLead ? 'Edit Lead' : 'Create New Lead'}</h2>
                            <button onClick={() => { setIsModalOpen(false); setModalStep(1); setEditingLead(null); }} className="p-2 text-gray-400 hover:bg-gray-100 rounded-full transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Stepper Header */}
                        <div className="px-6 pt-5 pb-2 bg-gray-50 border-b border-gray-100">
                            <div className="flex items-center justify-between">
                                {(editingLead ? [1, 2] : [1, 2, 3]).map((step, idx, arr) => (
                                    <React.Fragment key={step}>
                                        <div className="flex flex-col items-center flex-1">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shadow-sm transition-colors ${modalStep === step ? 'bg-primary text-white ring-4 ring-blue-100' :
                                                modalStep > step ? 'bg-green-500 text-white' : 'bg-white border-2 border-gray-200 text-gray-400'
                                                }`}>
                                                {modalStep > step ? <CheckCircle2 size={16} /> : step}
                                            </div>
                                            <span className={`text-[10px] uppercase tracking-wider font-bold mt-2 ${modalStep === step ? 'text-primary' : 'text-gray-400'}`}>
                                                {step === 1 ? 'Customer' : step === 2 ? 'Details' : 'Action'}
                                            </span>
                                        </div>
                                        {idx < arr.length - 1 && (
                                            <div className={`flex-1 h-0.5 mt-[-20px] mx-2 ${modalStep > idx + 1 ? 'bg-green-500' : 'bg-gray-200'}`}></div>
                                        )}
                                    </React.Fragment>
                                ))}
                            </div>
                        </div>

                        <div className="p-6 flex-1">

                            {/* STEP 1: CUSTOMER INFO */}
                            {modalStep === 1 && (
                                <div className="space-y-4 animate-in slide-in-from-right-4">

                                    {existingCustomerAlert && (
                                        <div className="bg-blue-50 border border-primary p-4 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm mb-6">
                                            <div className="flex gap-3 text-primary">
                                                <AlertCircle size={24} className="shrink-0" />
                                                <div>
                                                    <p className="font-bold text-sm">Existing Customer Found</p>
                                                    <p className="text-sm">We found {existingCustomerAlert.CustomerName} with this phone number.</p>
                                                </div>
                                            </div>
                                            <div className="flex gap-2 w-full sm:w-auto">
                                                <button type="button" onClick={() => setExistingCustomerAlert(null)} className="flex-1 px-3 py-1.5 bg-white border border-blue-200 text-primary text-sm font-bold rounded hover:bg-gray-50">No</button>
                                                <button type="button" onClick={applyExistingCustomer} className="flex-1 px-3 py-1.5 bg-primary text-white text-sm font-bold rounded hover:bg-blue-800 shadow-sm">Use Existing</button>
                                            </div>
                                        </div>
                                    )}

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-1">Customer Name <span className="text-red-500">*</span></label>
                                            <input type="text" name="CustomerName" value={formData.CustomerName} onChange={handleInputChange} disabled={!!formData.existingCustomerID} className={`w-full px-3 py-2 border rounded-md focus:ring-primary focus:border-primary ${formErrors.CustomerName ? 'border-red-500 bg-red-50' : 'border-gray-300'} ${formData.existingCustomerID ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''}`} placeholder="John Doe" />
                                            {formErrors.CustomerName && <p className="text-xs text-red-500 mt-1">{formErrors.CustomerName}</p>}
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-1">Phone Number <span className="text-red-500">*</span></label>
                                            <input type="tel" name="Phone" value={formData.Phone} onChange={handleInputChange} onBlur={checkExistingPhone} disabled={!!formData.existingCustomerID} className={`w-full px-3 py-2 border rounded-md focus:ring-primary focus:border-primary ${formErrors.Phone ? 'border-red-500 bg-red-50' : 'border-gray-300'} ${formData.existingCustomerID ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''}`} placeholder="9876543210" maxLength={15} />
                                            {formErrors.Phone && <p className="text-xs text-red-500 mt-1">{formErrors.Phone}</p>}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">Email <span className="text-gray-400 font-normal ml-1">(Optional)</span></label>
                                        <input type="email" name="Email" value={formData.Email} onChange={handleInputChange} disabled={!!formData.existingCustomerID} className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary ${formData.existingCustomerID ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''}`} placeholder="john@example.com" />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-1">Company Name</label>
                                            <input type="text" name="CompanyName" value={formData.CompanyName} onChange={handleInputChange} disabled={!!formData.existingCustomerID} className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary ${formData.existingCustomerID ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''}`} placeholder="ABC Constructions" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-1">City</label>
                                            <input type="text" name="City" value={formData.City} onChange={handleInputChange} disabled={!!formData.existingCustomerID} className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary ${formData.existingCustomerID ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''}`} placeholder="Mumbai" />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">GST Number</label>
                                        <input type="text" name="GSTNumber" value={formData.GSTNumber} onChange={handleInputChange} disabled={!!formData.existingCustomerID} className={`w-full px-3 py-2 border rounded-md focus:ring-primary focus:border-primary uppercase ${formErrors.GSTNumber ? 'border-red-500 bg-red-50' : 'border-gray-300'} ${formData.existingCustomerID ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''}`} placeholder="22AAAAA0000A1Z5" maxLength={15} />
                                        {formErrors.GSTNumber && <p className="text-xs text-red-500 mt-1">{formErrors.GSTNumber}</p>}
                                    </div>

                                </div>
                            )}

                            {/* STEP 2: ENQUIRY DETAILS */}
                            {modalStep === 2 && (
                                <div className="space-y-5 animate-in slide-in-from-right-4">

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-1">Lead Source <span className="text-red-500">*</span></label>
                                            <select name="LeadSource" value={formData.LeadSource} onChange={handleInputChange} className={`w-full px-3 py-2 border rounded-md focus:ring-primary focus:border-primary ${formErrors.LeadSource ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}>
                                                <option value="">Select Source</option>
                                                <option value="Phone">Phone</option>
                                                <option value="Instagram">Instagram</option>
                                                <option value="Facebook">Facebook</option>
                                                <option value="Walk-in">Walk-in</option>
                                            </select>
                                            {formErrors.LeadSource && <p className="text-xs text-red-500 mt-1">{formErrors.LeadSource}</p>}
                                        </div>
                                        {isAdmin && (
                                            <div>
                                                <label className="block text-sm font-bold text-gray-700 mb-1">Assign To</label>
                                                <select name="AssignedUserID" value={formData.AssignedUserID} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary bg-white">
                                                    <option value="">Unassigned</option>
                                                    {users.map(u => (
                                                        <option key={u.UserID} value={u.UserID}>{u.FullName}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        )}
                                    </div>

                                    {(formData.LeadSource === 'Instagram' || formData.LeadSource === 'Facebook') && (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                                            <div>
                                                <label className="block text-sm font-bold text-gray-700 mb-1">Ad Name</label>
                                                <input type="text" name="AdName" value={formData.AdName} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary" placeholder="e.g. Summer Promo Ad" />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-bold text-gray-700 mb-1">Campaign Name</label>
                                                <input type="text" name="CampaignName" value={formData.CampaignName} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary" placeholder="e.g. Q3 Blocks Campaign" />
                                            </div>
                                        </div>
                                    )}

                                    <div className={`p-4 rounded-lg border ${formErrors.ProductRequired ? 'border-red-300 bg-red-50' : 'border-gray-200'}`}>
                                        <label className="block text-sm font-bold text-gray-700 mb-3">Product Required <span className="text-red-500">*</span></label>
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                            {['AAC Blocks', 'Citabond Mortar', 'Kavach Plaster'].map((prod) => (
                                                <label key={prod} className={`flex items-center gap-2 p-3 rounded border cursor-pointer transition-colors ${formData.ProductRequired.includes(prod) ? 'bg-blue-50 border-primary shadow-sm' : 'bg-white border-gray-200 hover:bg-gray-50'}`}>
                                                    <input type="checkbox" name="ProductRequired" value={prod} checked={formData.ProductRequired.includes(prod)} onChange={handleInputChange} className="w-4 h-4 text-primary rounded ring-primary" />
                                                    <span className="text-sm font-medium text-gray-800">{prod}</span>
                                                </label>
                                            ))}
                                        </div>
                                        {formErrors.ProductRequired && <p className="text-xs text-red-500 mt-2">{formErrors.ProductRequired}</p>}
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-1">Quantity <span className="text-gray-400 font-normal ml-1">(Optional)</span></label>
                                            <div className="flex">
                                                <input type="number" name="Quantity" value={formData.Quantity} onChange={handleInputChange} className="w-2/3 px-3 py-2 border border-gray-300 rounded-l-md focus:ring-primary focus:border-primary z-10" placeholder="e.g. 50" min="1" />
                                                <select name="Unit" value={formData.Unit} onChange={handleInputChange} className="w-1/3 px-2 py-2 border border-gray-300 border-l-0 rounded-r-md bg-gray-50 focus:ring-primary focus:border-primary text-sm text-gray-600">
                                                    <option value="Cubic Meters">m³</option>
                                                    <option value="Tons">Tons</option>
                                                    <option value="Bags">Bags</option>
                                                </select>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-1">Requirement Timeline</label>
                                            <select name="RequirementTimeline" value={formData.RequirementTimeline} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary">
                                                <option value="">Not Sure</option>
                                                <option value="Within 1 Week">Within 1 Week</option>
                                                <option value="Within 1 Month">Within 1 Month</option>
                                                <option value="Within 3 Months">Within 3 Months</option>
                                            </select>
                                        </div>
                                    </div>

                                </div>
                            )}

                            {/* STEP 3: INITIAL INTERACTION */}
                            {modalStep === 3 && (
                                <div className="space-y-5 animate-in slide-in-from-right-4">
                                    <div className="bg-blue-50/50 p-4 rounded-lg border border-blue-100">
                                        <p className="text-sm text-blue-800 font-medium">To keep our records perfect, please log the initial contact details you had with this lead right now.</p>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">Select Interaction Outcome <span className="text-red-500">*</span></label>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                                            {['Call not received', 'Spoke with customer', 'Product details shared', 'Waiting for approval', 'Other'].map((opt) => (
                                                <label key={opt} className={`flex items-center gap-2 p-3 rounded-md border text-sm cursor-pointer transition-colors ${formData.Feedback === opt ? 'bg-primary border-primary text-white font-bold tracking-wide' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                                                    <input type="radio" name="Feedback" value={opt} checked={formData.Feedback === opt} onChange={handleInputChange} className="hidden" />
                                                    {formData.Feedback === opt && <CheckCircle2 size={16} className="shrink-0" />}
                                                    {opt}
                                                </label>
                                            ))}
                                        </div>
                                        {formErrors.Feedback && <p className="text-xs text-red-500 mt-2">{formErrors.Feedback}</p>}
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-1">Remark 1</label>
                                            <textarea name="Remark1" value={formData.Remark1} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary text-sm h-24 resize-none" placeholder="Required sizes, specific demands..."></textarea>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-1">Remark 2 <span className="text-gray-400 font-normal ml-1">(Optional hidden detail)</span></label>
                                            <textarea name="Remark2" value={formData.Remark2} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary text-sm h-24 resize-none" placeholder="Customer budget constraint..."></textarea>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">Schedule Next Follow-up <span className="text-red-500">*</span></label>
                                        <input
                                            type="date"
                                            name="NextFollowUpDate"
                                            value={formData.NextFollowUpDate}
                                            onChange={handleInputChange}
                                            min={new Date().toISOString().split('T')[0]}
                                            className={`w-full sm:w-auto px-3 py-2 border rounded-md focus:ring-primary focus:border-primary ${formErrors.NextFollowUpDate ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                                        />
                                        {formErrors.NextFollowUpDate && <p className="text-xs text-red-500 mt-1">{formErrors.NextFollowUpDate}</p>}
                                    </div>

                                </div>
                            )}

                        </div>

                        {/* Modal Footer Controls */}
                        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-between rounded-b-2xl">
                            {modalStep > 1 ? (
                                <button type="button" onClick={handleBack} disabled={submitting} className="px-4 py-2 border border-gray-300 text-gray-700 font-bold rounded-lg hover:bg-gray-100 transition-colors flex items-center gap-1 disabled:opacity-50">
                                    <ChevronLeft size={18} /> Back
                                </button>
                            ) : <div></div>}

                            {/* Edit mode on step 2: show Save Changes instead of Next */}
                            {editingLead && modalStep === 2 ? (
                                <button type="button" onClick={handleUpdate} disabled={submitting} className="px-6 py-2 bg-secondary text-white font-bold rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 shadow-sm disabled:opacity-70 disabled:cursor-not-allowed">
                                    {submitting ? (
                                        <><div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div> Saving...</>
                                    ) : (
                                        <><CheckCircle2 size={18} /> Save Changes</>
                                    )}
                                </button>
                            ) : modalStep < 3 ? (
                                <button type="button" onClick={handleNext} className="px-6 py-2 bg-primary text-white font-bold rounded-lg hover:bg-blue-800 transition-colors flex items-center gap-1 shadow-sm">
                                    Next <ChevronRight size={18} />
                                </button>
                            ) : (
                                <button type="button" onClick={handleSubmit} disabled={submitting} className="px-6 py-2 bg-secondary text-white font-bold rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 shadow-sm disabled:opacity-70 disabled:cursor-not-allowed">
                                    {submitting ? (
                                        <><div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div> Creating...</>
                                    ) : (
                                        <><CheckCircle2 size={18} /> Submit Lead</>
                                    )}
                                </button>
                            )}
                        </div>

                    </div>
                </div>
            )}

        </div>
    );
}