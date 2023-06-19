const express = require("express");
const { ApolloServer } = require("apollo-server-express");
const mongoose = require("mongoose");
require("dotenv").config();
const { authMiddleware } = require("./utils/auth");

// Import the necessary modules
const { typeDefs, resolvers } = require("./schemas");

// Set up your Express app
const app = express();
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// Connect to MongoDB database
mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Connected to MongoDB database");
  })
  .catch((error) => {
    console.error("Error connecting to MongoDB database:", error);
  });

// Create the Apollo Server with the necessary configuration
const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: authMiddleware,
  formatError: (err) => {
    console.log(err);
    return err;
  },
});

// Start the server and apply the middleware once it's started
async function startApolloServer() {
  await server.start();
  server.applyMiddleware({ app });
}

// Call the startApolloServer function to start the server
startApolloServer().then(() => {
  // Error handling middleware
  app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send("Something broke!");
  });

  // Start listening for incoming requests
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
});
