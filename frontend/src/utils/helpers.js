export const formatCurrency = (amount) => '₹' + Number(amount).toLocaleString('en-IN');

export const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    });
};

export const formatDateTime = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

export const getInitials = (name) => {
    if (!name) return '??';
    return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
};

export const getStatusColor = (status) => {
    const map = {
        New: 'bg-gray-100 text-gray-700 border-gray-200',
        Contacted: 'bg-blue-100 text-blue-700 border-blue-200',
        Quoted: 'bg-yellow-100 text-yellow-700 border-yellow-200',
        Negotiating: 'bg-orange-100 text-orange-700 border-orange-200',
        Won: 'bg-green-100 text-green-700 border-green-200',
        Lost: 'bg-red-100 text-red-700 border-red-200',
        Pending: 'bg-yellow-100 text-yellow-700 border-yellow-200',
        Confirmed: 'bg-blue-100 text-blue-700 border-blue-200',
        Dispatched: 'bg-purple-100 text-purple-700 border-purple-200',
        Delivered: 'bg-green-100 text-green-700 border-green-200',
        Cancelled: 'bg-red-100 text-red-700 border-red-200',
        Paid: 'bg-green-100 text-green-700 border-green-200',
        Partial: 'bg-orange-100 text-orange-700 border-orange-200'
    };
    return map[status] || 'bg-gray-100 text-gray-700 border-gray-200';
};

export const daysSince = (dateStr) => {
    if (!dateStr) return 0;
    return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
};

export const daysUntil = (dateStr) => {
    if (!dateStr) return 0;
    return Math.floor((new Date(dateStr).getTime() - Date.now()) / 86400000);
};

export const truncate = (str, len = 40) => {
    if (!str) return '';
    return str.length > len ? str.slice(0, len) + '…' : str;
};