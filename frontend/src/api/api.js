import apiClient from './apiClient';

export const invoiceApi = {
    getAll: () => apiClient.get('/invoices'),
    getDetails: (id) => apiClient.get(`/invoices/${id}`),
    createCashSale: (data) => apiClient.post('/invoices/cash-sale', data),
    createTablePayNow: (data) => apiClient.post('/invoices/table-sale/pay-now', data),
    createTableCredit: (data) => apiClient.post('/invoices/table-sale/add-to-credit', data),
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
    getItemSales: () => apiClient.get('/reports/item-sales')
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
