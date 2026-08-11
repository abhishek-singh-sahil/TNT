const keyId = "rzp_live_TI5XH97lm5H64s";
const keySecret = "QPX4R56ayIFQuE3OP4IYR0Uz";

async function main() {
  const auth = Buffer.from(`${keyId}:${keySecret}`).toString('base64');
  console.log('Sending test order to Razorpay...');
  const response = await fetch('https://api.razorpay.com/v1/orders', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Basic ${auth}`
    },
    body: JSON.stringify({
      amount: 100, // 1 INR (100 paise)
      currency: 'INR',
      receipt: `test_${Date.now()}`
    })
  });
  const data = await response.json();
  console.log('RESPONSE:', response.status, JSON.stringify(data, null, 2));
}

main().catch(console.error);
