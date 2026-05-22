import apiClient from './apiClient';

export const invoiceApi = {
    getAll: () => apiClient.get('/invoices'),
    getDetails: (id) => apiClient.get(`/invoices/${id}`),
    createCashSale: (data) => apiClient.post('/invoices/cash-sale', data, { headers: { 'Idempotency-Key': crypto.randomUUID() } }),
    createCashSaleCredit: (data) => apiClient.post('/invoices/cash-sale/add-to-credit', data, { headers: { 'Idempotency-Key': crypto.randomUUID() } }),
    createQuickSale: (data) => apiClient.post('/invoices/quick-sale', data, { headers: { 'Idempotency-Key': crypto.randomUUID() } }),
    createTablePayNow: (data) => apiClient.post('/invoices/table-sale/pay-now', data, { headers: { 'Idempotency-Key': crypto.randomUUID() } }),
    createTableCredit: (data) => apiClient.post('/invoices/table-sale/add-to-credit', data, { headers: { 'Idempotency-Key': crypto.randomUUID() } }),
    createTableSplit: (data) => apiClient.post('/invoices/table-sale/split', data, { headers: { 'Idempotency-Key': crypto.randomUUID() } }),
    cancel: (id, reason) => apiClient.patch(`/invoices/${id}/cancel`, { reason }),
    voidInvoice: (id) => apiClient.delete(`/invoices/${id}/void`),
    createQuickRetailSale: (data) => apiClient.post('/invoices/quick-retail-sale', data, { headers: { 'Idempotency-Key': crypto.randomUUID() } }),
    getQuickHistory: (params) => apiClient.get('/invoices', { params: { sale_channel: 'quick_no_receipt', ...params } })
};

export const quickRetailApi = {
    getQuickItems: (params) => apiClient.get('/items', { params: { is_quick_retail: 1, status: 'active', ...params } }),
    createQuickSale: (data) => apiClient.post('/invoices/quick-retail-sale', data)
};

export const customerApi = {
    getAll: () => apiClient.get('/customers'),
    getDebtors: (params) => apiClient.get('/customers/debtors', { params }),
    getLedger: (id) => apiClient.get(`/customers/${id}/ledger`),
    getAccount: (id) => apiClient.get(`/customers/${id}/account`),
    getLoyaltyHistory: (id) => apiClient.get(`/customers/${id}/loyalty`),
    adjustLoyalty: (id, data) => apiClient.post(`/customers/${id}/loyalty/adjust`, data),
    create: (data) => apiClient.post('/customers', data),
    update: (id, data) => apiClient.put(`/customers/${id}`, data)
};

export const paymentApi = {
    recordCustomerPayment: (data) => apiClient.post('/payments/customer-payment', data)
};

export const reportApi = {
    getDashboard: () => apiClient.get('/reports/dashboard'),
    getCashierDashboard: () => apiClient.get('/reports/cashier-dashboard'),
    getDailySales: (date) => apiClient.get(`/reports/daily-sales?date=${date}`),
    getCustomerBalances: () => apiClient.get('/reports/customer-balances'),
    getItemSales: () => apiClient.get('/reports/item-sales'),
    getEOD: (date) => apiClient.get(`/reports/eod?date=${date}`),
    getCreditSummary: () => apiClient.get('/reports/credit-summary'),
    getAnalytics: (from, to) => apiClient.get(`/reports/analytics?from=${from}&to=${to}`),
    getAlerts: () => apiClient.get('/reports/alerts'),
    getBI: (params) => apiClient.get('/reports/business-intelligence', { params }),
    getCashCollection: (params) => apiClient.get('/reports/cash-collection', { params })
};

export const userApi = {
    getAll: () => apiClient.get('/users'),
    getWaiters: () => apiClient.get('/users/waiters'),
    create: (data) => apiClient.post('/users', data),
    updateStatus: (id, status) => apiClient.patch(`/users/${id}/status`, { status })
};

export const itemApi = {
    getAll: (params) => apiClient.get('/items', { params }),
    getCategories: () => apiClient.get('/items/categories'),
    create: (data) => apiClient.post('/items', data),
    update: (id, data) => apiClient.put(`/items/${id}`, data),
    updatePrice: (id, price) => apiClient.patch(`/items/${id}/price`, { price }),
    updateAvailability: (id, status, reason) => apiClient.patch(`/items/${id}/availability`, { availability_status: status, reason }),
    updateStatus: (id, status) => apiClient.patch(`/items/${id}/status`, { status }),
    delete: (id) => apiClient.delete(`/items/${id}`),
    receiveStock: (id, data) => apiClient.post(`/items/${id}/receive-stock`, data),
    syncPopular: () => apiClient.post('/items/sync-popular')
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
    sendKOT: (id, data) => apiClient.post(`/table-sessions/${id}/send-kot`, data, { headers: { 'Idempotency-Key': crypto.randomUUID() } }),
    payNow: (id, payload) => apiClient.post(`/table-sessions/${id}/final-bill/pay-now`, payload, { headers: { 'Idempotency-Key': crypto.randomUUID() } }),
    addToCredit: (id, payload) => apiClient.post(`/table-sessions/${id}/final-bill/add-to-credit`, payload, { headers: { 'Idempotency-Key': crypto.randomUUID() } }),
    splitBill: (id, payload) => apiClient.post(`/table-sessions/${id}/split-bill`, payload, { headers: { 'Idempotency-Key': crypto.randomUUID() } }),
    transferTable: (id, payload) => apiClient.post(`/table-sessions/${id}/transfer`, payload),
    mergeTable: (id, payload) => apiClient.post(`/table-sessions/${id}/merge`, payload),
    cancel: (id) => apiClient.delete(`/table-sessions/${id}`)
};

export const kotApi = {
    getAll: (date) => apiClient.get(`/kot${date ? `?date=${date}` : ''}`),
    getDetails: (id) => apiClient.get(`/kot/${id}`),
    getById: (id) => apiClient.get(`/kot/${id}`),
    getBySession: (sessionId) => apiClient.get(`/kot/session/${sessionId}`),
    create: (data) => apiClient.post('/kot/create', data),
    createFromSession: (sessionId) => apiClient.post(`/table-sessions/${sessionId}/send-kot`, {}),
    updateStatus: (id, status) => apiClient.patch(`/kot/${id}/status`, { status }),
    updateItemStatus: (id, status) => apiClient.patch(`/kot/items/${id}/status`, { status }),
    createFromInvoice: (invoiceId) => apiClient.post(`/kot/invoice/${invoiceId}/send-kot`, {})
};

export const shiftApi = {
    open: (data) => apiClient.post('/shifts/open', data),
    getCurrent: () => apiClient.get('/shifts/current'),
    close: (data) => apiClient.post('/shifts/close', data),
    getHistory: () => apiClient.get('/shifts'),
    recordMovement: (data) => apiClient.post('/shifts/cash-movement', data)
};

export const heldBillApi = {
    getAll: (params) => apiClient.get('/held-bills', { params }),
    getDetails: (id) => apiClient.get(`/held-bills/${id}`),
    hold: (data) => apiClient.post('/held-bills', data),
    resume: (id) => apiClient.post(`/held-bills/${id}/resume`),
    cancel: (id, reason) => apiClient.patch(`/held-bills/${id}/cancel`, { reason }),
    complete: (id, data) => apiClient.post(`/held-bills/${id}/complete`, data)
};

export const settingApi = {
    getAll: () => apiClient.get('/settings'),
    getByGroup: (group) => apiClient.get(`/settings/group/${group}`),
    update: (data) => apiClient.put('/settings', data),
    patch: (key, value) => apiClient.patch(`/settings/${key}`, { value })
};

export const reservationApi = {
    getAll: (params) => apiClient.get('/reservations', { params }),
    getDetails: (id) => apiClient.get(`/reservations/${id}`),
    create: (data) => apiClient.post('/reservations', data),
    update: (id, data) => apiClient.put(`/reservations/${id}`, data),
    updateStatus: (id, status) => apiClient.patch(`/reservations/${id}/status`, { status }),
    assignTable: (id, tableId) => apiClient.patch(`/reservations/${id}/assign-table`, { table_id: tableId }),
    seat: (id, data) => apiClient.post(`/reservations/${id}/seat`, data),
    cancel: (id, reason) => apiClient.patch(`/reservations/${id}/cancel`, { reason }),
    markNoShow: (id) => apiClient.patch(`/reservations/${id}/no-show`)
};

export const promotionApi = {
    getAll: () => apiClient.get('/promotions'),
    getApplicable: (params) => apiClient.get('/promotions/applicable', { params }),
    create: (data) => apiClient.post('/promotions', data),
    delete: (id) => apiClient.delete(`/promotions/${id}`)
};

export const comboApi = {
    getAll: () => apiClient.get('/combos'),
    create: (data) => apiClient.post('/combos', data),
    delete: (id) => apiClient.delete(`/combos/${id}`)
};

export const modifierApi = {
    getAll: (params) => apiClient.get('/modifiers', { params }),
    create: (data) => apiClient.post('/modifiers', data),
    update: (id, data) => apiClient.put(`/modifiers/${id}`, data)
};

export const supplierApi = {
    getAll: (params) => apiClient.get('/suppliers', { params }),
    create: (data) => apiClient.post('/suppliers', data),
    getAccount: (id) => apiClient.get(`/suppliers/${id}/account`),
    paySupplier: (id, data) => apiClient.post(`/suppliers/${id}/payments`, data),
    updateStatus: (id, status) => apiClient.patch(`/suppliers/${id}/status`, { status })
};

export const purchaseApi = {
    getAll: (params) => apiClient.get('/purchases', { params }),
    create: (data) => apiClient.post('/purchases', data),
    getDetails: (id) => apiClient.get(`/purchases/${id}`)
};

export const kitchenApi = {
    getActiveKots: (params) => apiClient.get('/kitchen/kots', { params }),
    getHistory: (params) => apiClient.get('/kitchen/history', { params }),
    updateStatus: (id, status) => apiClient.patch(`/kitchen/kots/${id}/status`, { status }),
    cancelKot: (id, reason) => apiClient.patch(`/kitchen/kots/${id}/cancel`, { reason }),
    updateItemStatus: (itemId, status) => apiClient.patch(`/kitchen/kot-items/${itemId}/status`, { status })
};

export const gatewayPaymentApi = {
    createQR: (data) => apiClient.post('/payments/gateway/qr/create', data),
    getStatus: (uuid) => apiClient.get(`/payments/gateway/transactions/${uuid}/status`),
    cancel: (uuid) => apiClient.post(`/payments/gateway/transactions/${uuid}/cancel`),
    mockMarkPaid: (uuid) => apiClient.post(`/payments/gateway/mock/${uuid}/mark-paid`)
};

export const expenseApi = {
    getAll: (params) => apiClient.get('/expenses', { params }),
    getDetails: (id) => apiClient.get(`/expenses/${id}`),
    create: (data) => apiClient.post('/expenses', data),
    update: (id, data) => apiClient.put(`/expenses/${id}`, data),
    cancel: (id) => apiClient.patch(`/expenses/${id}/cancel`)
};

export const stockApi = {
    getLowStock: () => apiClient.get('/stock/low'),
    adjust: (data) => apiClient.post('/stock/adjust'),
    getMovements: (itemId) => apiClient.get(`/stock/movements/${itemId}`)
};


export const brandingApi = {
    getPublicReceipt: (uuid) => apiClient.get(`/public/receipt/${uuid}`)
};

export const auditApi = {
    getAll: (params) => apiClient.get('/audit-logs', { params })
};

export const publicMenuApi = {
    getItems: (params) => apiClient.get('/public-menu/items', { params }),
    getTableInfo: (tableNo) => apiClient.get(`/public-menu/table/${tableNo}`)
};

export const announcementApi = {
    getActive: () => apiClient.get('/announcements/active')
};

export const superAdminApi = {
    getStats: () => apiClient.get('/super-admin/overview'),
    getAnalytics: () => apiClient.get('/super-admin/analytics'),
    getHealth: () => apiClient.get('/super-admin/health'),
    getSystemHealth: () => apiClient.get('/super-admin/system-health'),
    getAuditLogs: (params) => apiClient.get('/super-admin/audit-logs', { params }),
    getSecurityMetrics: () => apiClient.get('/super-admin/security'),
    
    // Shops
    getShops: () => apiClient.get('/super-admin/shops'),
    createShop: (data) => apiClient.post('/super-admin/shops', data),
    updateShop: (id, data) => apiClient.put(`/super-admin/shops/${id}`, data),
    deleteShop: (id) => apiClient.delete(`/super-admin/shops/${id}`),
    
    // Subscriptions & Plans
    getSubscriptions: () => apiClient.get('/super-admin/subscriptions'),
    getPlans: () => apiClient.get('/super-admin/plans'),
    createPlan: (data) => apiClient.post('/super-admin/plans', data),
    updatePlan: (id, data) => apiClient.put(`/super-admin/plans/${id}`, data),
    deletePlan: (id) => apiClient.delete(`/super-admin/plans/${id}`),
    
    // Announcements
    getAnnouncements: () => apiClient.get('/super-admin/announcements'),
    createAnnouncement: (data) => apiClient.post('/super-admin/announcements', data),
    deleteAnnouncement: (id) => apiClient.delete(`/super-admin/announcements/${id}`),
    
    // Tickets
    getTickets: () => apiClient.get('/super-admin/tickets'),
    updateTicket: (id, data) => apiClient.put(`/super-admin/tickets/${id}`, data),

    // Backups
    getBackups: () => apiClient.get('/super-admin/backups'),
    runBackup: () => apiClient.post('/super-admin/backups/run'),

    // Platform Settings
    getPlatformSettings: () => apiClient.get('/super-admin/platform-settings'),
    updatePlatformSettings: (data) => apiClient.put('/super-admin/platform-settings', data),

    // Platform Users
    getPlatformUsers: () => apiClient.get('/super-admin/users'),
    createPlatformUser: (data) => apiClient.post('/super-admin/users', data),
    updateUserStatus: (id, status) => apiClient.patch(`/super-admin/users/${id}/status`, { status }),
    resetUserPassword: (id, password) => apiClient.post(`/super-admin/users/${id}/reset-password`, { password })
};

export const authApi = {
    changePassword: (data) => apiClient.post('/auth/change-password', data)
};
