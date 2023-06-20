const { Schema, model } = require("mongoose");

const postSchema = new Schema(
  {
    authorId: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    author: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    title: {
      type: String,
      required: [true, "Title is required"],
      maxLength: [80, "Must be no more than 80 characters"],
      unique: true,
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      maxLength: [800, "Must be no more than 800 characters"],
    },
    likesCount: {
      type: Number,
      default: 0,
    },
    likes: {
      type: [String],
      default: [],
    },
    dislikes: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true }
);

module.exports = model("Post", postSchema);
