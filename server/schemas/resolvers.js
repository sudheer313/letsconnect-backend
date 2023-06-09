const { ApolloError, AuthenticationError } = require("apollo-server-express");
const bcryptjs = require("bcryptjs");
const { signToken } = require("../utils/auth");
const User = require("../models/User");
const Post = require("../models/Post");
const Comment = require("../models/Comment");

const resolvers = {
  Query: {
    helloWorld: (parent, args, context) => {
      if (context.user) {
        return "hello World";
      }
      throw new ApolloError(
        "You are not authorized to access this resource. Please authenticate."
      );
    },
    getAllUsers: async (parent, args) => {
      try {
        return await User.find();
      } catch (error) {
        throw new ApolloError("Error occurred while fetching all users");
      }
    },
    getUser: async (parent, { userId }) => {
      try {
        return await User.findOne({ _id: userId });
      } catch (error) {
        throw new ApolloError("Error occurred while fetching the user");
      }
    },
    getAllPosts: async (parent, args) => {
      try {
        return await Post.find();
      } catch (error) {
        throw new ApolloError("Error occurred while fetching all posts");
      }
    },
    getPost: async (_, { postId }) => {
      try {
        return await Post.findOne({ _id: postId });
      } catch (error) {
        throw new ApolloError("Error occurred while fetching the post");
      }
    },
    getAllTrendingPosts: async (parent, args) => {
      try {
        return await Post.find().sort({ likesCount: -1 });
      } catch (error) {
        throw new ApolloError("Error occurred while fetching trending posts");
      }
    },
    getComments: async (parent, { postId }) => {
      try {
        return await Comment.find({ postId });
      } catch (error) {
        throw new ApolloError("Error occurred while fetching comments");
      }
    },
    getPostBysearch: async (parent, { searchQuery }) => {
      try {
        return await Post.find({
          title: { $regex: searchQuery, $options: "i" },
        });
      } catch (error) {
        throw new ApolloError("Error occurred while searching for posts");
      }
    },
    getRandomUsers: async (parent, args) => {
      try {
        return await User.aggregate([{ $sample: { size: 5 } }]);
      } catch (error) {
        throw new ApolloError("Error occurred while fetching random users");
      }
    },
    getPostsByUser: async (parent, { userId }) => {
      try {
        return await Post.find({ authorId: userId });
      } catch (error) {
        throw new ApolloError("Error occurred while fetching user posts");
      }
    },
  },

  Mutation: {
    registerUser: async (_, { username, email, password }) => {
      try {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
          throw new ApolloError("User already exists with this email");
        }

        const hashedPassword = await bcryptjs.hash(password, 10);
        const newUser = await User.create({
          username,
          email,
          password: hashedPassword,
        });

        const token = signToken(newUser);

        return {
          _id: newUser.id,
          username: newUser.username,
          email: newUser.email,
          token,
        };
      } catch (error) {
        throw new ApolloError("Error occurred while registering the user");
      }
    },

    login: async (_, { email, password }) => {
      try {
        const user = await User.findOne({ email });
        if (!user) {
          throw new AuthenticationError("No user with this email found");
        }

        const isMatch = await bcryptjs.compare(password, user.password);
        if (!isMatch) {
          throw new AuthenticationError("Invalid password credentials");
        }

        const token = signToken(user);

        return {
          _id: user.id,
          username: user.username,
          email: user.email,
          token,
        };
      } catch (error) {
        throw new ApolloError("Error occurred while logging in");
      }
    },

    googleLogin: async (_, { username, email }) => {
      try {
        let user = await User.findOne({ email });

        if (!user) {
          user = await User.create({ username, email });
        }

        const token = signToken(user);

        return {
          _id: user._id,
          username: user.username,
          email: user.email,
          token,
        };
      } catch (error) {
        throw new ApolloError("Error occurred while logging in with Google");
      }
    },

    addPost: async (_, { title, description }, context) => {
      if (!context.user) {
        throw new ApolloError(
          "You are not authorized to create this resource. Please authenticate."
        );
      }

      try {
        const post = await Post.create({
          authorId: context.user._id,
          title,
          description,
        });

        return post;
      } catch (error) {
        throw new ApolloError("Error occurred while adding the post");
      }
    },
    likePost: async (_, { postId }, context) => {
      if (!context.user) {
        throw new ApolloError(
          "You are not authorized to like this post. Please authenticate."
        );
      }

      try {
        const updatedPost = await Post.findByIdAndUpdate(
          postId,
          {
            $addToSet: { likes: context.user._id },
            $pull: { dislikes: context.user._id },
            $inc: { likesCount: 1 },
          },
          { new: true }
        );

        return updatedPost;
      } catch (error) {
        throw new ApolloError("Error occurred while liking the post");
      }
    },
    dislikePost: async (_, { postId }, context) => {
      if (!context.user) {
        throw new ApolloError(
          "You are not authorized to dislike this post. Please authenticate."
        );
      }

      try {
        const post = await Post.findById(postId);
        const updatedPost = await Post.findByIdAndUpdate(
          postId,
          {
            $addToSet: { dislikes: context.user._id },
            $pull: { likes: context.user._id },
            $inc: { likesCount: post.likesCount === 0 ? 0 : -1 },
          },
          { new: true }
        );

        return updatedPost;
      } catch (error) {
        throw new ApolloError("Error occurred while disliking the post");
      }
    },
    deletePost: async (_, { postId }, context) => {
      if (!context.user) {
        throw new ApolloError(
          "You are not authorized to delete this post. Please authenticate."
        );
      }

      try {
        const post = await Post.findById(postId);
        if (!post) {
          throw new ApolloError("Post does not exist");
        }
        if (post.authorId.toString() !== context.user._id.toString()) {
          throw new ApolloError(
            "You are not authorized to delete this post. Only the owner can delete it."
          );
        }

        const deletedPost = await Post.findByIdAndDelete(postId);

        return deletedPost;
      } catch (error) {
        throw new ApolloError("Error occurred while deleting the post");
      }
    },
    addComment: async (_, { postId, description }, context) => {
      if (!context.user) {
        throw new ApolloError(
          "You are not authorized to create this resource. Please authenticate."
        );
      }

      try {
        const comment = await Comment.create({
          authorId: context.user._id,
          postId,
          description,
        });

        return comment;
      } catch (error) {
        throw new ApolloError("Error occurred while adding the comment");
      }
    },
    deleteComment: async (_, { commentId }, context) => {
      if (!context.user) {
        throw new ApolloError(
          "You are not authorized to delete this comment. Please authenticate."
        );
      }

      try {
        const comment = await Comment.findById(commentId);
        if (!comment) {
          throw new ApolloError("Comment does not exist");
        }
        if (comment.authorId.toString() !== context.user._id.toString()) {
          throw new ApolloError(
            "You are not authorized to delete this comment. Only the owner can delete it."
          );
        }

        const deletedComment = await Comment.findByIdAndDelete(commentId);

        return deletedComment;
      } catch (error) {
        throw new ApolloError("Error occurred while deleting the comment");
      }
    },
    followUser: async (_, { followUserId }, context) => {
      if (!context.user) {
        throw new ApolloError(
          "You are not authorized to perform this action. Please authenticate."
        );
      }

      try {
        const updatedUser = await User.findByIdAndUpdate(
          context.user._id,
          { $addToSet: { followingUsers: followUserId } },
          { new: true }
        );

        await User.findByIdAndUpdate(followUserId, {
          $inc: { followers: 1 },
        });

        return updatedUser;
      } catch (error) {
        throw new ApolloError("Error occurred while following the user");
      }
    },
    unfollowUser: async (_, { unfollowUserId }, context) => {
      if (!context.user) {
        throw new ApolloError(
          "You are not authorized to perform this action. Please authenticate."
        );
      }

      try {
        const updatedUser = await User.findByIdAndUpdate(
          context.user._id,
          { $pull: { followingUsers: unfollowUserId } },
          { new: true }
        );

        await User.findByIdAndUpdate(unfollowUserId, {
          $inc: { followers: -1 },
        });

        return updatedUser;
      } catch (error) {
        throw new ApolloError("Error occurred while unfollowing the user");
      }
    },
  },

  Post: {
    author: async (parent) => {
      try {
        return await User.findOne({ _id: parent.authorId });
      } catch (error) {
        throw new ApolloError("Error occurred while fetching the author");
      }
    },
    commentsCount: async (parent) => {
      try {
        return await Comment.find({ postId: parent._id }).countDocuments();
      } catch (error) {
        throw new ApolloError(
          "Error occurred while fetching the comments count"
        );
      }
    },
  },
  User: {
    postsCount: async (parent) => {
      try {
        return await Post.find({ authorId: parent._id }).countDocuments();
      } catch (error) {
        throw new ApolloError(
          "Error occurred while fetching the user's posts count"
        );
      }
    },
  },
};

module.exports = resolvers;
