const MockProvider = require('./providers/mockProvider');
const DialogGenieProvider = require('./providers/dialogGenieProvider');

class PaymentGatewayService {
    constructor() {
        this.provider = null;
        this.initializeProvider();
    }

    initializeProvider() {
        const providerName = process.env.PAYMENT_PROVIDER || 'mock';
        
        switch (providerName.toLowerCase()) {
            case 'dialog_genie':
            case 'genie':
                this.provider = new DialogGenieProvider();
                break;
            case 'mock':
                this.provider = new MockProvider();
                break;
            default:
                console.warn(`Unknown payment provider: ${providerName}. Falling back to MockProvider.`);
                this.provider = new MockProvider();
        }
    }

    async createPaymentRequest(data) {
        if (!this.provider) this.initializeProvider();
        return await this.provider.createPaymentRequest(data);
    }

    async checkPaymentStatus(data) {
        if (!this.provider) this.initializeProvider();
        return await this.provider.checkPaymentStatus(data);
    }

    verifyWebhookSignature(req) {
        if (!this.provider) this.initializeProvider();
        return this.provider.verifyWebhookSignature(req);
    }
}

module.exports = new PaymentGatewayService();
