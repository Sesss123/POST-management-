// No external dependencies needed for mock

class MockProvider {
    async createPaymentRequest({ invoiceId, invoiceNo, amount, currency }) {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 500));

        const gatewayOrderId = `MOCK-ORDER-${Date.now()}`;
        
        return {
            provider: 'mock',
            gateway_order_id: gatewayOrderId,
            qr_payload: `restoledger://pay?amount=${amount}&currency=${currency}&invoice=${invoiceNo}&order=${gatewayOrderId}`,
            qr_image_url: null, // Frontend will generate QR from payload
            expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(), // 15 mins expiry
            raw_response: { message: "Mock QR generated successfully" }
        };
    }

    async checkPaymentStatus({ gateway_order_id }) {
        // In mock mode, we usually wait for a manual trigger via dev endpoint
        // or we could simulate random success. For now, just return pending
        // unless some internal state (not stored here) says otherwise.
        // The controller will handle the actual "mark as paid" logic for mock.
        
        return {
            status: 'pending',
            gateway_transaction_id: null,
            gateway_reference: null,
            paid_at: null,
            raw_response: { status: "Still waiting for mock payment" }
        };
    }

    verifyWebhookSignature(req) {
        // Mock always valid if secret matches or just true
        return true;
    }
}

module.exports = MockProvider;
