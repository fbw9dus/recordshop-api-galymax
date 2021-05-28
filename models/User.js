const mongoose = require("mongoose");
const { Schema } = mongoose;
const AddressSchema = require('./Address')
const encryption = require('../lib/validation/encryption')
const jwt = require('jsonwebtoken')

const UserSchema = new Schema(
  {
    displayName: { type: String },
    firstName:   { type: String, required: true },
    lastName:    { type: String, required: true },
    email:       { type: String, required: true, unique: true },
    password:    { type: String, required: true, select: false },
    role:        { type: String, required: true, enum: ["Admin", "User"] },
    address: AddressSchema,
    orders: [{
      ref: "Order",
      type: mongoose.Types.ObjectId
    }],
    failedLogins: [{
      type:Date,default:Date.now
    }],
    activated:     { type:Boolean, default:false },
    activationLink:{ type:String, required:false },
    activationDate:{ type:Date,   required:false },
    resetLink:     { type:String, required:false },
    resetDate:     { type:Date,   required:false },
    tokens: [
      {
        token: {
          type: String,
          required: true
        },
        access: {
          type: String,
          required: true
        }
      }
    ]
  },
  {
    toObject: {
      virtuals: true
    },
    toJSON: {
      virtuals: true
    }
  }
);

UserSchema.virtual("fullName").get(function() {
  return `${this.firstName} ${this.lastName}`;
});

UserSchema.pre("save", async function(next) {
  if(!this.isModified("password")) return next()
  this.password = await encryption.encrypt(this.password)
  next()
});

UserSchema.pre("findOneAndUpdate", async function(next) {
  if(!this.getUpdate().password) return next()
  this._update.password = await encryption.encrypt(this._update.password)
  next()
});

UserSchema.methods.addFailedLoginAttempt = function() {
  this.failedLogins.push(Date.now());
}

UserSchema.methods.generateAuthToken = function() {
  const user = this
  const access = "auth"
  const token = jwt
    .sign({ _id: user._id.toHexString(), access}, process.env.JWT_KEY)
    .toString()

    user.tokens.push({token, access})

  return token
}

UserSchema.statics.findByToken = function(token) {
  const User = this
  let decoded

  try {
    decoded = jwt.verify(token, process.env.JWT_KEY);
  } catch (e) {
    return;
  }

  return User.findOne({
    _id: decoded._id,
    "tokens.token": token,
    "tokens.access": "auth"
  })
}

module.exports = mongoose.model("User", UserSchema);
