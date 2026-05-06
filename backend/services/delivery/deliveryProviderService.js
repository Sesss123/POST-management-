const mockProvider = require('./providers/mockDeliveryProvider');
const ubereatsProvider = require('./providers/ubereatsProvider');
const pickmeProvider = require('./providers/pickmeProvider');

/**
 * DeliveryProviderService
 * Aggregates all delivery providers and provides a unified interface.
 */
class DeliveryProviderService {
    getProvider(source) {
        switch (source) {
            case 'ubereats':
                return ubereatsProvider;
            case 'pickme':
                return pickmeProvider;
            case 'mock':
                return mockProvider;
            default:
                return mockProvider; // Fallback to mock for testing
        }
    }

    /**
     * syncOrders
     * Fetches new orders from all configured providers
     */
    async syncOrders({ shopId }) {
        const providers = ['ubereats', 'pickme', 'mock'];
        let allNewOrders = [];

        for (const source of providers) {
            try {
                const provider = this.getProvider(source);
                const orders = await provider.fetchOrders({ shopId });
                allNewOrders = [...allNewOrders, ...orders];
            } catch (error) {
                console.error(`[Delivery Sync Error] Provider: ${source}`, error.message);
            }
        }

        return allNewOrders;
    }

    async acknowledgeOrder(source, externalOrderId) {
        return this.getProvider(source).acknowledgeOrder({ externalOrderId });
    }

    async rejectOrder(source, externalOrderId, reason) {
        return this.getProvider(source).rejectOrder({ externalOrderId, reason });
    }

    async updateStatus(source, externalOrderId, status) {
        return this.getProvider(source).updateOrderStatus({ externalOrderId, status });
    }
}

module.exports = new DeliveryProviderService();
