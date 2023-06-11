const express = require("express");
const { ApolloServer } = require("apollo-server-express");
require("dotenv").config();

// Import the necessary modules
const { typeDefs, resolvers } = require("./schemas");
const { authMiddleware } = require("./utils/auth");
const admin = require("firebase-admin");
const serviceAccount = require("./config/serviceAcoountKey.json");

// Initialize the Firebase Admin SDK only if it hasn't been initialized before
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    // Other Firebase configuration options
  });
}

// Set up your Express app
const app = express();
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// Create the Apollo Server with the necessary configuration
const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: authMiddleware,
});

// Start the server and apply the middleware once it's started
async function startApolloServer() {
  await server.start();
  server.applyMiddleware({ app });
}

// Call the startApolloServer function to start the server
startApolloServer().then(() => {
  // Start listening for incoming requests
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
});
