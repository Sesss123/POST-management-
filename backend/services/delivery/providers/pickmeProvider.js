/**
 * PickMeProvider
 * Future integration for PickMe Food API.
 */
class PickMeProvider {
    constructor() {
        this.apiKey = process.env.PICKME_API_KEY;
        this.apiSecret = process.env.PICKME_API_SECRET;
    }

    async fetchOrders({ shopId }) {
        if (!this.apiKey) return [];
        // Real API logic would go here
        throw new Error('PickMe integration not fully implemented');
    }

    async acknowledgeOrder({ externalOrderId }) {
        if (!this.apiKey) return { success: false, message: 'PickMe not configured' };
        return { success: true };
    }

    async rejectOrder({ externalOrderId, reason }) {
        if (!this.apiKey) return { success: false, message: 'PickMe not configured' };
        return { success: true };
    }

    async updateOrderStatus({ externalOrderId, status }) {
        if (!this.apiKey) return { success: false, message: 'PickMe not configured' };
        return { success: true };
    }
}

module.exports = new PickMeProvider();
