/** ENV VARS **/
require("dotenv").config()

if ( ! (
process.env.DB
&& process.env.MAIL_SERVER
&& process.env.MAIL_USER
&& process.env.MAIL_PASS
&& process.env.JWT_KEY
)) {
  console.log('');
  console.log('Please provide a .env file or set the following:');
  ['DB','MAIL_SERVER','MAIL_USER','MAIL_PASS','JWT_KEY'].forEach(
    env => console.log(' ', env)
  )
  console.log('');
  process.exit(1); }

/** EXTERNAL DEPENDENCIES */
const colors = require('colors');
const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const logger = require("morgan");
const mongoose = require("mongoose");

/** ROUTERS */
const indexRouter = require("./routes/index");
const usersRouter = require("./routes/users");
const recordsRouter = require("./routes/records");
const ordersRouter = require("./routes/orders");

const { setCors } = require("./middleware/security");

/** INIT */
const app = express();

/** LOGGING */
app.use(logger("dev"));

/**CONNECT TO DB */
mongoose.connect(process.env.DB, {
  useNewUrlParser: true,
  useCreateIndex: true,
  useUnifiedTopology: true
});

mongoose.connection.on("error", console.error);
mongoose.connection.on("open", function() {
  console.log("Database connection established...");
});

/** REQUEST PARSERS */
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(setCors);

/** STATIC FILES*/
app.use(express.static(path.join(__dirname, "public")));

/** PASSPORT **/
const authPassport = require('./auth/passport');
authPassport(app);

/** ROUTES */
app.use("/", indexRouter);
app.use("/users", usersRouter);
app.use("/records", recordsRouter);
app.use("/orders", ordersRouter);

/** ERROR HANDLING */
/*app.use(function(req, res, next) {
  const error = new Error("Looks like something broke...");
  error.status = 400;
  next(error);
});*/

app.use(function(err, req, res, next) {
  res.status(err.status || 500).send({
    error: {
      message: err.message
    }
  });
});

/** EXPORT PATH */
module.exports = app;
