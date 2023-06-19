const { gql } = require("apollo-server-express");

const typeDefs = gql`
  type User {
    _id: ID!
    username: String!
    email: String!
    password: String!
    token: ID
    postsCount: Int!
    bio: String
    followers: Int!
    followingUsers: [String]!
  }

  type Post {
    _id: ID!
    authorId: ID!
    title: String!
    description: String!
    likes: [String]!
    dislikes: [String]!
    likesCount: Int!
    author: User!
    commentsCount: Int!
  }

  type Comment {
    _id: ID!
    authorId: ID!
    postId: ID!
    description: String!
  }

  type CheckoutSession {
    sessionID: String!
  }

  type Query {
    helloWorld: String
    getAllUsers: [User]
    getUser(userId: ID!): User
    getAllPosts: [Post]
    getAllTrendingPosts: [Post]
    getPost(postId: ID!): Post
    getComments(postId: ID!): [Comment!]
    getPostBysearch(searchQuery: String!): [Post]
    getRandomUsers: [User]
    getPostsByUser(userId: ID!): [Post]
  }

  type Mutation {
    registerUser(username: String!, email: String!, password: String!): User!
    login(email: String!, password: String!): User!
    googleLogin(username: String!, email: String!): User!
    addPost(title: String!, description: String!): Post!
    deletePost(postId: ID!): Post!
    likePost(postId: ID!): Post!
    dislikePost(postId: ID!): Post!
    addComment(postId: ID!, description: String!): Comment!
    deleteComment(commentId: ID!): Comment!
    followUser(followUserId: ID!): User!
    unfollowUser(unfollowUserId: ID!): User!
    createCheckoutSession(email: String!): CheckoutSession!
  }
`;

module.exports = typeDefs;
