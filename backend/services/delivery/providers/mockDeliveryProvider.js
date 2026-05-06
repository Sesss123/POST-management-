/**
 * MockDeliveryProvider
 * Simulates external delivery orders for testing and manual workflows.
 */
class MockDeliveryProvider {
    async fetchOrders({ shopId }) {
        // Return a few sample pending orders
        return [
            {
                externalOrderId: `MOCK-${Date.now()}-1`,
                source: 'ubereats',
                customer: { name: 'Saman Kumara', phone: '0771234567', address: '123 Main St, Colombo' },
                items: [
                    { externalItemName: 'Chicken Kottu', qty: 1, unitPrice: 950 },
                    { externalItemName: 'Coca Cola 500ml', qty: 2, unitPrice: 250 }
                ],
                subtotal: 1450,
                deliveryFee: 150,
                platformFee: 100,
                grandTotal: 1700,
                paymentMethod: 'platform_paid',
                note: 'Extra spicy please'
            },
            {
                externalOrderId: `MOCK-${Date.now()}-2`,
                source: 'pickme',
                customer: { name: 'Nilmini Perera', phone: '0719876543', address: '45/1 Galle Rd, Mount Lavinia' },
                items: [
                    { externalItemName: 'Egg Fried Rice', qty: 2, unitPrice: 850 }
                ],
                subtotal: 1700,
                deliveryFee: 200,
                platformFee: 120,
                grandTotal: 2020,
                paymentMethod: 'cash',
                note: 'No onions'
            }
        ];
    }

    async acknowledgeOrder({ externalOrderId }) {
        return { success: true, message: 'Mock order acknowledged' };
    }

    async rejectOrder({ externalOrderId, reason }) {
        return { success: true, message: 'Mock order rejected' };
    }

    async updateOrderStatus({ externalOrderId, status }) {
        return { success: true, message: `Mock status updated to ${status}` };
    }
}

module.exports = new MockDeliveryProvider();
