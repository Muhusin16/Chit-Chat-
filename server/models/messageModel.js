const mongoose = require("mongoose");
const { Schema } = mongoose;

const messageSchema = new Schema(
  {
    message: {
      text: { type: String, required: true },
      timestamp: { type: Date, default: Date.now }, 
    },
    users: [{ type: Schema.Types.ObjectId, ref: "User" }],
    sender: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    read: { type: Boolean, default: false }, 
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Message", messageSchema);
