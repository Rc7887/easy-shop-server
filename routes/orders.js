const { Order } = require("../models/order");
const express = require("express");
const { orderItem } = require("../models/orderItem");
const router = express.Router();

router.get(`/`, async (req, res) => {
  const orderList = await Order.find()
    .populate("user")
    .sort({ dateOrdered: -1 });

  if (!orderList) {
    res.status(500).json({ success: false });
  }
  res.send(orderList);
});

router.get("/:id", async (req, res, next) => {
  const orderItem = await Order.findById(req.params.id)
    .populate("user", "name")
    .populate({
      path: "orderItems",
      populate: {
        path: "product",
        populate: "category",
      },
    });

  if (!orderItem) {
    res.status(400).json({ success: false, message: "Order not found" });
  }

  res.send(orderItem);
});

router.post("/", async (req, res, next) => {
  const orderItemsIds = Promise.all(
    req.body.orderItems.map(async (orderItems) => {
      let newOrderItems = new orderItem({
        quantity: orderItems.quantity,
        product: orderItems.product,
      });
      newOrderItems = await newOrderItems.save();
      return newOrderItems._id;
    })
  );

  let orderItemsIdsResolved = [];
  orderItemsIdsResolved = await orderItemsIds;

  let totalPrice = [];
  totalPrice = await Promise.all(
    orderItemsIdsResolved.map(async (orderItems) => {
      const itemPrice = await orderItem
        .findById(orderItems)
        .populate("product", "price");
      const totalItemPrice = itemPrice.product.price * itemPrice.quantity;
      return totalItemPrice;
    })
  );
  console.log(totalPrice);
  const totalPrices = totalPrice.reduce((a, c) => {
    return a + c;
  }, 0);
  console.log(totalPrices);

  let order = new Order({
    orderItems: orderItemsIdsResolved,
    shippingAddress1: req.body.shippingAddress1,
    shippingAddress2: req.body.shippingAddress2,
    city: req.body.city,
    zip: req.body.zip,
    country: req.body.country,
    phone: req.body.phone,
    status: req.body.status,
    totalPrice: totalPrices,
    user: req.body.user,
  });
  order = await order.save();

  if (!order) {
    res.status(400).json({ sucess: false, message: "order not posted " });
  }
  res.send(order);
});

router.put("/:id", async (req, res, next) => {
  const updateOrder = await Order.findByIdAndUpdate(
    req.params.id,
    {
      status: req.body.status,
    },
    {
      new: true,
    }
  );

  if (!updateOrder) {
    res.status(400).json({ sucess: false, message: "order not udated " });
  }
  res.send(updateOrder);
});

router.delete("/:id", (req, res, next) => {
  Order.findByIdAndRemove(req.params.id)
    .then(async (order) => {
      if (order) {
        await order.orderItems.map(async (items) => {
          await orderItem.findByIdAndRemove(items);
        });
      }
    })
    .then((re) => {
      res.status(200).json({
        success: true,
        message: "Order deleted",
      });
    })
    .catch((err) => {
      console.log(err);
    });
});

router.get("/get/totalsales", async (req, res) => {
  const totalSales = await Order.aggregate([
    {
      $group: { _id: null, totalsales: { $sum: "$totalPrice" } },
    },
  ]);

  if (!totalSales) {
    return res.status(400).send("The order sales cannot be generated");
  }

  res.send({ totalsales: totalSales.pop().totalsales });
});

router.get(`/get/count`, async (req, res) => {
  const orderCount = await Order.countDocuments();

  if (!orderCount) {
    res.status(500).json({ success: false });
  }
  res.send({
    orderCount: orderCount,
  });
});

router.get("/get/userorders/:userid", async (req, res) => {
  const userOrderList = await Order.find({ user: req.params.userid })
    .populate({
      path: "orderItems",
      populate: {
        path: "product",
        populate: "category",
      },
    })
    .sort({ dateOrdered: -1 });

  if (!userOrderList) {
    res.status(500).json({ success: false });
  }
  res.send(userOrderList);
});

module.exports = router;
