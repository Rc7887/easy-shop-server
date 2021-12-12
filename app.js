const express = require("express");
const app = express();
const morgan = require("morgan");
const mongoose = require("mongoose");
const cors = require("cors");
const auth = require("./helper/authJwt");
const errorHandler = require("./helper/error-handler");

require("dotenv/config");


app.use(cors());
app.options("*", cors());

app.use(express.json());
app.use(morgan("tiny"));
app.use(auth());
app.use("/public/uploads", express.static(__dirname + "/public/uploads"));
app.use(errorHandler);

//Routes
const categoriesRoutes = require("./routes/categories");
const productsRoutes = require("./routes/products");
const usersRoutes = require("./routes/users");
const ordersRoutes = require("./routes/orders");

const api = process.env.API_URL;

app.use(`${api}/categories`, categoriesRoutes);
app.use(`${api}/products`, productsRoutes);
app.use(`${api}/users`, usersRoutes);
app.use(`${api}/orders`, ordersRoutes);

// app.use(`${api}/products`, productsRoutes);

mongoose
  .connect(process.env.MONGODB_CONNECT, {
    dbName: "shop-application",
  })
  .then(() => {
    console.log("DataBase is running successfully");
  })
  .catch((err) => {
    console.log(err);
  });

// app.listen(3000, () => {
//   console.log("Server running successfully");
// });


var server = app.listen(process.env.PORT || 3000, function () {
  var port = server.address().port;
  console.log("Express server is running on port :" + port )
})