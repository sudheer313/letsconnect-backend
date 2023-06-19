const { Schema, model } = require("mongoose");
const paymentSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },
  amount: {
    type: Number,
    required: true,
  },
  paymentIntentId: {
    type: String,
    required: true,
  },
});

module.exports = model("Payment", paymentSchema);
