const notificationService = require('../server/utils/notificationService');

async function test() {
  console.log("Testing Order Notification...");
  const mockOrder = {
    orderNumber: "TEST-999",
    totalAmount: 499,
    customer: { name: "Rohit Parmar", phone: "9340623657" },
    items: [{ name: "High Protein Chicken Rice", quantity: 2, price: 249.50 }],
    paymentMethod: "COD",
    deliveryType: "Delivery"
  };

  await notificationService.notifyNewOrder(mockOrder);
  console.log("Test finished!");
}

test();
