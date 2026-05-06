class DialogGenieProvider {
    constructor() {
        this.merchantId = process.env.GENIE_MERCHANT_ID;
        this.apiKey = process.env.GENIE_API_KEY;
        this.apiSecret = process.env.GENIE_API_SECRET;
        this.createUrl = process.env.GENIE_CREATE_QR_URL;
        this.statusUrl = process.env.GENIE_CHECK_STATUS_URL;
    }

    async createPaymentRequest({ invoiceId, invoiceNo, amount, currency, description, customer }) {
        if (!this.merchantId || !this.apiKey) {
            throw new Error('Dialog Genie configuration missing (Merchant ID or API Key)');
        }

        // TODO: Implement actual Dialog Genie API call
        /*
        const response = await axios.post(this.createUrl, {
            merchantId: this.merchantId,
            amount,
            currency,
            externalReference: invoiceNo,
            // ... other fields based on Genie API docs
        }, {
            headers: { 'Authorization': `Bearer ${this.apiKey}` }
        });
        */

        console.log('Dialog Genie Provider: createPaymentRequest called (TODO: API Integration)');
        
        throw new Error('Dialog Genie integration is not yet fully mapped to API endpoints. Use PAYMENT_PROVIDER=mock for testing.');
    }

    async checkPaymentStatus({ gateway_order_id, gateway_transaction_id }) {
        // TODO: Implement actual Dialog Genie status check API
        /*
        const response = await axios.get(`${this.statusUrl}/${gateway_order_id}`, {
            headers: { 'Authorization': `Bearer ${this.apiKey}` }
        });
        */
        
        return {
            status: 'pending',
            gateway_transaction_id: null,
            gateway_reference: null,
            paid_at: null,
            raw_response: null
        };
    }

    verifyWebhookSignature(req) {
        const signature = req.headers['x-genie-signature'];
        const secret = process.env.GENIE_WEBHOOK_SECRET;
        
        if (!signature || !secret) return false;

        // TODO: Implement HMAC SHA256 verification
        return true;
    }
}

module.exports = DialogGenieProvider;
