const { AuthenticationError } = require("apollo-server-express");
const jwt = require("jsonwebtoken");

const signToken = ({ email, name, _id }) => {
  const payload = { email, name, _id };
  return jwt.sign({ data: payload }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXP_TIME,
  });
};

//function  for authenticating routes
const authMiddleware = ({ req }) => {
  // allows token to be sent via  req.query or headers
  let token = req.headers.authorization;

  // ["Bearer", "<tokenvalue>"]
  if (req.headers.authorization) {
    token = token.split(" ").pop().trim();
  }

  if (!token) {
    // return res.status(400).json({ message: 'You have no token!' });
    return req;
  }

  // verify token and get user data out of it
  try {
    const { data } = jwt.verify(token, process.env.JWT_SECRET);
    req.user = data;
  } catch {
    return req;
  }
  return req;
};

module.exports = {
  signToken,
  authMiddleware,
};
