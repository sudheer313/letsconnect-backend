const { AuthenticationError } = require("apollo-server-express");
const jwt = require("jsonwebtoken");
const admin = require("firebase-admin");

const signToken = ({ email, name, _id }) => {
  const payload = { email, name, _id };
  return jwt.sign({ data: payload }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXP_TIME,
  });
};

// Function for authenticating routes
const authMiddleware = async ({ req }) => {
  const authorizationHeader = req.headers.authorization;

  if (!authorizationHeader) {
    return req;
  }

  try {
    const token = authorizationHeader.split(" ")[1];
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = decodedToken;
  } catch (err) {
    if (err instanceof admin.auth.AuthError) {
      throw new AuthenticationError("Invalid Token");
    } else {
      console.log("Error verifying token:", err);
      throw new AuthenticationError("Error verifying token");
    }
  }

  return req;
};

module.exports = {
  signToken,
  authMiddleware,
};
