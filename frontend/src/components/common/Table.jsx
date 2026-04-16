import React from 'react';

export default function Table({ columns, data, mobileCardFields, keyField, renderRowActions, onRowClick }) {
    if (!data || data.length === 0) {
        return (
            <div className="w-full p-8 text-center text-gray-500 text-sm">
                No records found.
            </div>
        );
    }

    // Identify matching fields in row object logic
    // Assume `columns` is: [{ header: 'Name', accessor: 'CustomerName', render: (val, row) => ... }]

    return (
        <div className="w-full">
            {/* Mobile view (< md) */}
            <div className="md:hidden space-y-4">
                {data.map((row, i) => {
                    const rowKey = keyField ? row[keyField] : i;
                    return (
                        <div key={`m-${rowKey}`} className="bg-white p-4 rounded-xl shadow-sm border border-gray-200" onClick={() => onRowClick && onRowClick(row)}>
                            {mobileCardFields && mobileCardFields.map((field, idx) => {
                                const colDef = columns.find(c => c.accessor === field) || {};
                                const rawVal = row[field];
                                const displayVal = colDef.render ? colDef.render(rawVal, row) : rawVal;

                                if (idx === 0) {
                                    return <div key={idx} className="font-bold text-gray-900 border-b border-gray-100 pb-2 mb-2 break-words">{displayVal}</div>;
                                }
                                return (
                                    <div key={idx} className="flex justify-between items-center text-sm py-1 border-b border-gray-50 last:border-0 last:pb-0 break-words">
                                        <span className="text-gray-500 font-medium whitespace-nowrap mr-2">{colDef.header || field}:</span>
                                        <span className="text-left font-semibold text-gray-800 break-words line-clamp-2 text-right">{displayVal}</span>
                                    </div>
                                );
                            })}

                            {renderRowActions && (
                                <div className="mt-4 pt-3 border-t border-gray-100 flex justify-end gap-2" onClick={e => e.stopPropagation()}>
                                    {renderRowActions(row)}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Desktop view (>= md) */}
            <div className="hidden md:block overflow-x-auto min-h-[200px]">
                <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 text-xs uppercase tracking-wider">
                        <tr>
                            {columns.map((col, idx) => (
                                <th key={idx} className="px-6 py-4 font-semibold">{col.header}</th>
                            ))}
                            {renderRowActions && <th className="px-6 py-4 font-semibold text-right">Actions</th>}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {data.map((row, i) => {
                            const rowKey = keyField ? row[keyField] : i;
                            return (
                                <tr key={`t-${rowKey}`} onClick={() => onRowClick && onRowClick(row)} className={`hover:bg-gray-50 transition-colors ${onRowClick ? 'cursor-pointer' : ''}`}>
                                    {columns.map((col, idx) => (
                                        <td key={idx} className="px-6 py-4 text-gray-700">
                                            {col.render ? col.render(row[col.accessor], row) : row[col.accessor]}
                                        </td>
                                    ))}
                                    {renderRowActions && (
                                        <td className="px-6 py-4 text-right" onClick={e => e.stopPropagation()}>
                                            {renderRowActions(row)}
                                        </td>
                                    )}
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}