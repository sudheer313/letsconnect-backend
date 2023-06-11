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
        console.log("Authenticated user accessed helloWorld query");
        return "hello World";
      }
      console.error(
        "Unauthenticated user attempted to access helloWorld query"
      );
      throw new ApolloError(
        "You are not authorized to access this resource. Please authenticate."
      );
    },
    getAllUsers: async (parent, args) => {
      try {
        console.log("Fetching all users");
        return await User.find();
      } catch (error) {
        console.error("Error occurred while fetching all users:", error);
        throw new ApolloError("Error occurred while fetching all users");
      }
    },
    getUser: async (parent, { userId }) => {
      try {
        console.log("Fetching user with ID:", userId);
        return await User.findOne({ _id: userId });
      } catch (error) {
        console.error("Error occurred while fetching the user:", error);
        throw new ApolloError("Error occurred while fetching the user");
      }
    },
    getAllPosts: async (parent, args) => {
      try {
        console.log("Fetching all posts");
        return await Post.find();
      } catch (error) {
        console.error("Error occurred while fetching all posts:", error);
        throw new ApolloError("Error occurred while fetching all posts");
      }
    },
    getPost: async (_, { postId }) => {
      try {
        console.log("Fetching post with ID:", postId);
        return await Post.findOne({ _id: postId });
      } catch (error) {
        console.error("Error occurred while fetching the post:", error);
        throw new ApolloError("Error occurred while fetching the post");
      }
    },
    getAllTrendingPosts: async (parent, args) => {
      try {
        console.log("Fetching all trending posts");
        return await Post.find().sort({ likesCount: -1 });
      } catch (error) {
        console.error("Error occurred while fetching trending posts:", error);
        throw new ApolloError("Error occurred while fetching trending posts");
      }
    },
    getComments: async (parent, { postId }) => {
      try {
        console.log("Fetching comments for post with ID:", postId);
        return await Comment.find({ postId });
      } catch (error) {
        console.error("Error occurred while fetching comments:", error);
        throw new ApolloError("Error occurred while fetching comments");
      }
    },
    getPostBysearch: async (parent, { searchQuery }) => {
      try {
        console.log("Searching for posts with query:", searchQuery);
        return await Post.find({
          title: { $regex: searchQuery, $options: "i" },
        });
      } catch (error) {
        console.error("Error occurred while searching for posts:", error);
        throw new ApolloError("Error occurred while searching for posts");
      }
    },
    getRandomUsers: async (parent, args) => {
      try {
        console.log("Fetching random users");
        return await User.aggregate([{ $sample: { size: 5 } }]);
      } catch (error) {
        console.error("Error occurred while fetching random users:", error);
        throw new ApolloError("Error occurred while fetching random users");
      }
    },
    getPostsByUser: async (parent, { userId }) => {
      try {
        console.log("Fetching posts for user with ID:", userId);
        return await Post.find({ authorId: userId });
      } catch (error) {
        console.error("Error occurred while fetching user posts:", error);
        throw new ApolloError("Error occurred while fetching user posts");
      }
    },
  },

  Mutation: {
    registerUser: async (_, { username, email, password }) => {
      try {
        console.log("Registering new user:", username, email);
        const existingUser = await User.findOne({ email });
        if (existingUser) {
          console.error("User already exists with this email:", email);
          throw new ApolloError("User already exists with this email");
        }

        const hashedPassword = await bcryptjs.hash(password, 10);
        const newUser = await User.create({
          username,
          email,
          password: hashedPassword,
        });

        const token = signToken(newUser);

        console.log("User registered successfully:", newUser._id);
        return {
          _id: newUser.id,
          username: newUser.username,
          email: newUser.email,
          token,
        };
      } catch (error) {
        console.error("Error occurred while registering the user:", error);
        throw new ApolloError("Error occurred while registering the user");
      }
    },

    login: async (_, { email, password }) => {
      try {
        console.log("Logging in with email:", email);
        const user = await User.findOne({ email });
        if (!user) {
          console.error("No user found with this email:", email);
          throw new AuthenticationError("No user with this email found");
        }

        const isMatch = await bcryptjs.compare(password, user.password);
        if (!isMatch) {
          console.error("Invalid password for email:", email);
          throw new AuthenticationError("Invalid password credentials");
        }

        const token = signToken(user);

        console.log("User logged in successfully:", user._id);
        return {
          _id: user.id,
          username: user.username,
          email: user.email,
          token,
        };
      } catch (error) {
        console.error("Error occurred while logging in:", error);
        throw new ApolloError("Error occurred while logging in");
      }
    },

    googleLogin: async (_, { username, email }) => {
      try {
        console.log("Logging in with Google. Email:", email);
        let user = await User.findOne({ email });

        if (!user) {
          console.log("Creating new user with Google login. Email:", email);
          user = await User.create({ username, email });
        }

        const token = signToken(user);

        console.log("User logged in with Google successfully:", user._id);
        return {
          _id: user._id,
          username: user.username,
          email: user.email,
          token,
        };
      } catch (error) {
        console.error("Error occurred while logging in with Google:", error);
        throw new ApolloError("Error occurred while logging in with Google");
      }
    },

    addPost: async (_, { title, description }, context) => {
      if (!context.user) {
        console.error("Unauthorized user attempted to add a post");
        throw new ApolloError(
          "You are not authorized to create this resource. Please authenticate."
        );
      }

      try {
        console.log("Adding new post by user:", context.user._id);
        const post = await Post.create({
          authorId: context.user._id,
          title,
          description,
        });

        console.log("Post added successfully:", post._id);
        return post;
      } catch (error) {
        console.error("Error occurred while adding the post:", error);
        throw new ApolloError("Error occurred while adding the post");
      }
    },
    likePost: async (_, { postId }, context) => {
      if (!context.user) {
        console.error("Unauthorized user attempted to like a post");
        throw new ApolloError(
          "You are not authorized to like this post. Please authenticate."
        );
      }

      try {
        console.log("Liking post:", postId, "by user:", context.user._id);
        const updatedPost = await Post.findByIdAndUpdate(
          postId,
          {
            $addToSet: { likes: context.user._id },
            $pull: { dislikes: context.user._id },
            $inc: { likesCount: 1 },
          },
          { new: true }
        );

        console.log("Post liked successfully:", updatedPost._id);
        return updatedPost;
      } catch (error) {
        console.error("Error occurred while liking the post:", error);
        throw new ApolloError("Error occurred while liking the post");
      }
    },
    dislikePost: async (_, { postId }, context) => {
      if (!context.user) {
        console.error("Unauthorized user attempted to dislike a post");
        throw new ApolloError(
          "You are not authorized to dislike this post. Please authenticate."
        );
      }

      try {
        console.log("Disliking post:", postId, "by user:", context.user._id);
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

        console.log("Post disliked successfully:", updatedPost._id);
        return updatedPost;
      } catch (error) {
        console.error("Error occurred while disliking the post:", error);
        throw new ApolloError("Error occurred while disliking the post");
      }
    },
    deletePost: async (_, { postId }, context) => {
      if (!context.user) {
        console.error("Unauthorized user attempted to delete a post");
        throw new ApolloError(
          "You are not authorized to delete this post. Please authenticate."
        );
      }

      try {
        console.log("Deleting post:", postId, "by user:", context.user._id);
        const post = await Post.findById(postId);
        if (!post) {
          console.error("Post does not exist:", postId);
          throw new ApolloError("Post does not exist");
        }
        if (post.authorId.toString() !== context.user._id.toString()) {
          console.error(
            "Unauthorized user attempted to delete another user's post"
          );
          throw new ApolloError(
            "You are not authorized to delete this post. Only the owner can delete it."
          );
        }

        const deletedPost = await Post.findByIdAndDelete(postId);

        console.log("Post deleted successfully:", deletedPost._id);
        return deletedPost;
      } catch (error) {
        console.error("Error occurred while deleting the post:", error);
        throw new ApolloError("Error occurred while deleting the post");
      }
    },
    addComment: async (_, { postId, description }, context) => {
      if (!context.user) {
        console.error("Unauthorized user attempted to add a comment");
        throw new ApolloError(
          "You are not authorized to create this resource. Please authenticate."
        );
      }

      try {
        console.log(
          "Adding new comment by user:",
          context.user._id,
          "for post:",
          postId
        );
        const comment = await Comment.create({
          authorId: context.user._id,
          postId,
          description,
        });

        console.log("Comment added successfully:", comment._id);
        return comment;
      } catch (error) {
        console.error("Error occurred while adding the comment:", error);
        throw new ApolloError("Error occurred while adding the comment");
      }
    },
    deleteComment: async (_, { commentId }, context) => {
      if (!context.user) {
        console.error("Unauthorized user attempted to delete a comment");
        throw new ApolloError(
          "You are not authorized to delete this comment. Please authenticate."
        );
      }

      try {
        console.log(
          "Deleting comment:",
          commentId,
          "by user:",
          context.user._id
        );
        const comment = await Comment.findById(commentId);
        if (!comment) {
          console.error("Comment does not exist:", commentId);
          throw new ApolloError("Comment does not exist");
        }
        if (comment.authorId.toString() !== context.user._id.toString()) {
          console.error(
            "Unauthorized user attempted to delete another user's comment"
          );
          throw new ApolloError(
            "You are not authorized to delete this comment. Only the owner can delete it."
          );
        }

        const deletedComment = await Comment.findByIdAndDelete(commentId);

        console.log("Comment deleted successfully:", deletedComment._id);
        return deletedComment;
      } catch (error) {
        console.error("Error occurred while deleting the comment:", error);
        throw new ApolloError("Error occurred while deleting the comment");
      }
    },
    followUser: async (_, { followUserId }, context) => {
      if (!context.user) {
        console.error("Unauthorized user attempted to follow another user");
        throw new ApolloError(
          "You are not authorized to perform this action. Please authenticate."
        );
      }

      try {
        console.log("User:", context.user._id, "following user:", followUserId);
        const updatedUser = await User.findByIdAndUpdate(
          context.user._id,
          { $addToSet: { followingUsers: followUserId } },
          { new: true }
        );

        await User.findByIdAndUpdate(followUserId, {
          $inc: { followers: 1 },
        });

        console.log("User followed successfully:", updatedUser._id);
        return updatedUser;
      } catch (error) {
        console.error("Error occurred while following the user:", error);
        throw new ApolloError("Error occurred while following the user");
      }
    },
    unfollowUser: async (_, { unfollowUserId }, context) => {
      if (!context.user) {
        console.error("Unauthorized user attempted to unfollow another user");
        throw new ApolloError(
          "You are not authorized to perform this action. Please authenticate."
        );
      }

      try {
        console.log(
          "User:",
          context.user._id,
          "unfollowing user:",
          unfollowUserId
        );
        const updatedUser = await User.findByIdAndUpdate(
          context.user._id,
          { $pull: { followingUsers: unfollowUserId } },
          { new: true }
        );

        await User.findByIdAndUpdate(unfollowUserId, {
          $inc: { followers: -1 },
        });

        console.log("User unfollowed successfully:", updatedUser._id);
        return updatedUser;
      } catch (error) {
        console.error("Error occurred while unfollowing the user:", error);
        throw new ApolloError("Error occurred while unfollowing the user");
      }
    },
  },

  Post: {
    author: async (parent) => {
      try {
        console.log("Fetching author for post:", parent._id);
        return await User.findOne({ _id: parent.authorId });
      } catch (error) {
        console.error("Error occurred while fetching the author:", error);
        throw new ApolloError("Error occurred while fetching the author");
      }
    },
    commentsCount: async (parent) => {
      try {
        console.log("Fetching comments count for post:", parent._id);
        return await Comment.find({ postId: parent._id }).countDocuments();
      } catch (error) {
        console.error(
          "Error occurred while fetching the comments count:",
          error
        );
        throw new ApolloError(
          "Error occurred while fetching the comments count"
        );
      }
    },
  },
  User: {
    postsCount: async (parent) => {
      try {
        console.log("Fetching posts count for user:", parent._id);
        return await Post.find({ authorId: parent._id }).countDocuments();
      } catch (error) {
        console.error(
          "Error occurred while fetching the user's posts count:",
          error
        );
        throw new ApolloError(
          "Error occurred while fetching the user's posts count"
        );
      }
    },
  },
};

module.exports = resolvers;
