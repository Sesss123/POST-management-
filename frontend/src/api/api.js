import apiClient from './apiClient';

export const invoiceApi = {
    getAll: () => apiClient.get('/invoices'),
    getDetails: (id) => apiClient.get(`/invoices/${id}`),
    createCashSale: (data) => apiClient.post('/invoices/cash-sale', data),
    createTablePayNow: (data) => apiClient.post('/invoices/table-sale/pay-now', data),
    createTableCredit: (data) => apiClient.post('/invoices/table-sale/add-to-credit', data),
    createTableSplit: (data) => apiClient.post('/invoices/table-sale/split', data),
    cancel: (id, reason) => apiClient.patch(`/invoices/${id}/cancel`, { reason })
};

export const customerApi = {
    getAll: () => apiClient.get('/customers'),
    getLedger: (id) => apiClient.get(`/customers/${id}/ledger`),
    create: (data) => apiClient.post('/customers', data),
    update: (id, data) => apiClient.put(`/customers/${id}`, data)
};

export const paymentApi = {
    recordCustomerPayment: (data) => apiClient.post('/payments/customer-payment', data)
};

export const reportApi = {
    getDashboard: () => apiClient.get('/reports/dashboard'),
    getDailySales: (date) => apiClient.get(`/reports/daily-sales?date=${date}`),
    getCustomerBalances: () => apiClient.get('/reports/customer-balances'),
    getItemSales: () => apiClient.get('/reports/item-sales'),
    getEOD: (date) => apiClient.get(`/reports/eod?date=${date}`)
};

export const itemApi = {
    getAll: () => apiClient.get('/items'),
    create: (data) => apiClient.post('/items', data),
    update: (id, data) => apiClient.put(`/items/${id}`, data),
    delete: (id) => apiClient.delete(`/items/${id}`)
};

export const tableApi = {
    getAll: () => apiClient.get('/tables'),
    create: (data) => apiClient.post('/tables', data)
};

export const sessionApi = {
    open: (data) => apiClient.post('/table-sessions/start', data),
    getOpen: () => apiClient.get('/table-sessions/open'),
    addItems: (id, items) => apiClient.post(`/table-sessions/${id}/items`, { items }),
    updateItem: (id, itemId, data) => apiClient.patch(`/table-sessions/${id}/items/${itemId}`, data),
    voidItem: (id, data) => apiClient.patch(`/table-sessions/${id}/void-item`, data),
    getDetails: (id) => apiClient.get(`/table-sessions/${id}`),
    getActiveByTable: (tableId) => apiClient.get(`/table-sessions/table/${tableId}`),
    sendKOT: (id, data) => apiClient.post(`/table-sessions/${id}/send-kot`, data),
    payNow: (id, data) => apiClient.post(`/table-sessions/${id}/final-bill/pay-now`, data),
    addToCredit: (id, data) => apiClient.post(`/table-sessions/${id}/final-bill/add-to-credit`, data),
    splitBill: (id, data) => apiClient.post(`/table-sessions/${id}/split-bill`, data)
};

export const kotApi = {
    getAll: () => apiClient.get('/kot'),
    getDetails: (id) => apiClient.get(`/kot/${id}`),
    create: (data) => apiClient.post('/kot/create', data),
    updateStatus: (id, status) => apiClient.patch(`/kot/${id}/status`, { status }),
    updateItemStatus: (id, status) => apiClient.patch(`/kot/items/${id}/status`, { status })
};

export const kitchenApi = {
    getKots: () => apiClient.get('/kitchen/kots'),
    updateStatus: (id, status) => apiClient.patch(`/kitchen/kots/${id}/status`, { status })
};

export const shiftApi = {
    open: (data) => apiClient.post('/shifts/open', data),
    getCurrent: () => apiClient.get('/shifts/current'),
    close: (data) => apiClient.post('/shifts/close', data),
    getHistory: () => apiClient.get('/shifts'),
    recordMovement: (data) => apiClient.post('/shifts/cash-movement', data)
};

export const heldBillApi = {
    getAll: () => apiClient.get('/held-bills'),
    getDetails: (id) => apiClient.get(`/held-bills/${id}`),
    hold: (data) => apiClient.post('/held-bills', data),
    cancel: (id, reason) => apiClient.patch(`/held-bills/${id}/cancel`, { reason }),
    complete: (id, data) => apiClient.post(`/held-bills/${id}/complete`, data)
};

export const settingApi = {
    getAll: () => apiClient.get('/settings'),
    update: (data) => apiClient.post('/settings', data)
};

export const auditApi = {
    getAll: (params) => apiClient.get('/audit-logs', { params })
};
