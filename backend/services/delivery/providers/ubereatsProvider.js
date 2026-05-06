/**
 * UberEatsProvider
 * Future integration for UberEats API.
 */
class UberEatsProvider {
    constructor() {
        this.apiKey = process.env.UBEREATS_API_KEY;
        this.apiSecret = process.env.UBEREATS_API_SECRET;
    }

    async fetchOrders({ shopId }) {
        if (!this.apiKey) {
            // Not configured, return empty
            return [];
        }
        // Real API logic would go here
        throw new Error('UberEats integration not fully implemented');
    }

    async acknowledgeOrder({ externalOrderId }) {
        if (!this.apiKey) return { success: false, message: 'UberEats not configured' };
        return { success: true };
    }

    async rejectOrder({ externalOrderId, reason }) {
        if (!this.apiKey) return { success: false, message: 'UberEats not configured' };
        return { success: true };
    }

    async updateOrderStatus({ externalOrderId, status }) {
        if (!this.apiKey) return { success: false, message: 'UberEats not configured' };
        return { success: true };
    }
}

module.exports = new UberEatsProvider();
