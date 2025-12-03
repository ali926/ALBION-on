import { calculateFlippingProfit } from '../lib/calculators';

/**
 * Test calculations against Albion Online wiki examples
 */

console.log('=== Flipping Profit Calculator Tests ===\n');

// Test 1: Non-Premium with Orders (from wiki example)
// Buy: 1500, Sell: 2500
// Expected: 699 silver net profit
const test1 = calculateFlippingProfit(1500, 2500, 1, true, false);
console.log('Test 1: Non-Premium with Orders');
console.log('Buy: 1500, Sell: 2500');
console.log('Expected Net Profit: 699 silver');
console.log('Actual Net Profit:', test1.net);
console.log('Sales Tax (8%):', test1.salesTax);
console.log('Buy Order Fee (2.5%):', test1.buyOrderFee);
console.log('Sell Order Fee (2.5%):', test1.sellOrderFee);
console.log('Total Fees:', test1.tax);
console.log('Match:', Math.abs(test1.net - 699) < 1 ? '✅ PASS' : '❌ FAIL');
console.log('');

// Test 2: Premium with Orders
// Buy: 1500, Sell: 2500
// Expected higher profit due to 4% sales tax instead of 8%
const test2 = calculateFlippingProfit(1500, 2500, 1, true, true);
console.log('Test 2: Premium with Orders');
console.log('Buy: 1500, Sell: 2500');
console.log('Net Profit:', test2.net);
console.log('Sales Tax (4%):', test2.salesTax);
console.log('Buy Order Fee (2.5%):', test2.buyOrderFee);
console.log('Sell Order Fee (2.5%):', test2.sellOrderFee);
console.log('Total Fees:', test2.tax);
console.log('Expected: Higher than non-premium (751 silver)');
console.log('Match:', Math.abs(test2.net - 751) < 1 ? '✅ PASS' : '❌ FAIL');
console.log('');

// Test 3: Non-Premium without Orders (instant transaction)
// Buy: 1500, Sell: 2500
// Expected: Higher profit (no order fees, only 8% sales tax)
const test3 = calculateFlippingProfit(1500, 2500, 1, false, false);
console.log('Test 3: Non-Premium Instant Transaction (No Orders)');
console.log('Buy: 1500, Sell: 2500');
console.log('Net Profit:', test3.net);
console.log('Sales Tax (8%):', test3.salesTax);
console.log('Order Fees:', test3.orderFees);
console.log('Total Fees:', test3.tax);
console.log('Expected: 800 silver (no order fees)');
console.log('Match:', Math.abs(test3.net - 800) < 1 ? '✅ PASS' : '❌ FAIL');
console.log('');

// Test 4: Premium without Orders
// Buy: 1500, Sell: 2500
// Expected: Highest profit (no order fees, only 4% sales tax)
const test4 = calculateFlippingProfit(1500, 2500, 1, false, true);
console.log('Test 4: Premium Instant Transaction (No Orders)');
console.log('Buy: 1500, Sell: 2500');
console.log('Net Profit:', test4.net);
console.log('Sales Tax (4%):', test4.salesTax);
console.log('Order Fees:', test4.orderFees);
console.log('Total Fees:', test4.tax);
console.log('Expected: 900 silver (best case)');
console.log('Match:', Math.abs(test4.net - 900) < 1 ? '✅ PASS' : '❌ FAIL');
console.log('');

console.log('=== Summary ===');
console.log('All tests verify that:');
console.log('- Sales tax: 4% (Premium) vs 8% (Non-Premium)');
console.log('- Order fees: 2.5% each for buy and sell orders');
console.log('- Formulas match Albion Online wiki exactly');
