import jwt from "jsonwebtoken";

const SECRET = process.env.JWT_SECRET || "default_dev_secret_key";

const generateJWTToken_email = (user) => {
  console.log("\n******** Inside GenerateJWTToken_email Function ********");
  const payload = {
    id: user._id,
    email: user.email,
  };
  return jwt.sign(payload, SECRET, { expiresIn: "1h" }); // token expires in 1 hour
};

const generateJWTToken_username = (user) => {
  console.log("\n******** Inside GenerateJWTToken_username Function ********");
  const payload = {
    id: user._id,
    username: user.username,
  };
  return jwt.sign(payload, SECRET, { expiresIn: "1h" }); // token expires in 1 hour
};

export { generateJWTToken_email, generateJWTToken_username };
