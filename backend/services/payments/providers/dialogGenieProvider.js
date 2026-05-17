const crypto = require('crypto');
const axios = require('axios');

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
        // When real API spec is provided, uncomment and adjust the payload below:
        /*
        const response = await axios.post(this.createUrl, {
            merchantId: this.merchantId,
            amount,
            currency,
            externalReference: invoiceNo,
            description
        }, {
            headers: { 'Authorization': `Bearer ${this.apiKey}` }
        });
        return {
            gateway_order_id: response.data.orderId,
            qr_payload: response.data.qrCode,
            qr_image_url: response.data.qrImageUrl,
            expires_at: response.data.expiresAt
        };
        */

        console.log('Dialog Genie Provider: createPaymentRequest called in TEST/STUB mode');
        
        // Return a stubbed response for testing until live credentials are added
        return {
            gateway_order_id: `GENIE-STUB-${Date.now()}`,
            qr_payload: `LANKAQR-STUB-${invoiceNo}`,
            qr_image_url: null,
            expires_at: new Date(Date.now() + 15 * 60000) // 15 mins
        };
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

        // Verify using HMAC SHA256 (Standard for payment webhooks)
        try {
            const payloadString = JSON.stringify(req.body);
            const expectedSignature = crypto
                .createHmac('sha256', secret)
                .update(payloadString)
                .digest('hex');
                
            return signature === expectedSignature;
        } catch (e) {
            console.error('Signature verification failed', e);
            return false;
        }
    }
}

module.exports = DialogGenieProvider;
