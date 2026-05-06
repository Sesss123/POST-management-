/**
 * Centralized Pricing Calculator for RestoLedger POS
 * Handles subtotals, discounts, service charges, and taxes (inclusive/exclusive)
 */

const calculateInvoiceTotals = ({
    items,
    discount_type = 'fixed',
    discount_value = 0,
    promotion_discount = 0,
    loyalty_discount = 0,
    order_type = 'dine_in',
    settings = {}
}) => {
    // 1. Calculate Base Subtotal from items
    const subtotal = items.reduce((sum, item) => sum + (parseFloat(item.total) || 0), 0);

    // 2. Apply Custom Discount
    let discountAmount = 0;
    if (discount_type === 'percentage') {
        discountAmount = (subtotal * (parseFloat(discount_value) || 0)) / 100;
    } else {
        discountAmount = parseFloat(discount_value) || 0;
    }

    // 3. Subtotal after custom discount, promotion, and loyalty
    const totalDiscounts = discountAmount + (parseFloat(promotion_discount) || 0) + (parseFloat(loyalty_discount) || 0);
    const discountedSubtotal = Math.max(0, subtotal - totalDiscounts);

    // 4. Extract Settings
    const taxEnabled = settings.tax_enabled === 'true';
    const taxRate = taxEnabled ? parseFloat(settings.tax_rate || 0) : 0;
    const taxInclusive = settings.tax_inclusive_pricing === 'true';
    
    const scEnabled = settings.service_charge_enabled === 'true';
    const scRate = scEnabled ? parseFloat(settings.service_charge_rate || 0) : 0;
    const scApplyTo = settings.service_charge_apply_to || 'dine_in';
    
    // Determine if SC applies to this order type
    const appliesSC = scEnabled && (scApplyTo === 'all_orders' || scApplyTo === order_type);

    let taxAmount = 0;
    let scAmount = 0;
    let grandTotal = 0;

    if (taxInclusive) {
        // Tax is already included in item prices
        // Total = discountedSubtotal + SC (usually SC is applied on top of tax-inclusive price or base price)
        // For simplicity and standard practice: SC is applied to the tax-inclusive subtotal if SC is exclusive
        
        scAmount = appliesSC ? (discountedSubtotal * scRate) / 100 : 0;
        grandTotal = discountedSubtotal + scAmount;
        
        // Calculate the "included" tax portion for display
        // inclusive_tax = total_with_tax - (total_with_tax / (1 + tax_rate))
        taxAmount = discountedSubtotal - (discountedSubtotal / (1 + (taxRate / 100)));
    } else {
        // Tax is exclusive (standard)
        scAmount = appliesSC ? (discountedSubtotal * scRate) / 100 : 0;
        taxAmount = (discountedSubtotal * taxRate) / 100;
        grandTotal = discountedSubtotal + scAmount + taxAmount;
    }

    // Rounding based on settings
    const decimals = parseInt(settings.currency_decimal_places || 2);
    
    return {
        subtotal: parseFloat(subtotal.toFixed(decimals)),
        discount_amount: parseFloat(discountAmount.toFixed(decimals)),
        promotion_discount: parseFloat((promotion_discount || 0).toFixed(decimals)),
        loyalty_discount: parseFloat((loyalty_discount || 0).toFixed(decimals)),
        total_discounts: parseFloat(totalDiscounts.toFixed(decimals)),
        taxable_amount: parseFloat(discountedSubtotal.toFixed(decimals)),
        tax_amount: parseFloat(taxAmount.toFixed(decimals)),
        service_charge_amount: parseFloat(scAmount.toFixed(decimals)),
        grand_total: parseFloat(grandTotal.toFixed(decimals)),
        tax_rate: taxRate,
        service_charge_rate: scRate,
        tax_inclusive: taxInclusive
    };
};

module.exports = { calculateInvoiceTotals };
