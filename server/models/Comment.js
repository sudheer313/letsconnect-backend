const { Schema, model } = require("mongoose");

const commentSchema = new Schema(
  {
    authorId: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    postId:{
        type: Schema.Types.ObjectId,
        ref:"Post",
    },

    description: {
      type: String,
      required: [true, "comment description is required"],
      maxLength: [800, "Must be no more than 800 characters"],
    },
    
  },
  { timestamps: true }
);

module.exports = model("Comment", commentSchema);
