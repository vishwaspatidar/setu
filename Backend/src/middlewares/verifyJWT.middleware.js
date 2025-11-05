// Backend/src/middlewares/verifyJWT.middleware.js
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { UnRegisteredUser } from "../models/unRegisteredUser.model.js";
dotenv.config();

const SECRET = process.env.JWT_SECRET || "default_dev_secret_key";

const verifyJWT_email = asyncHandler(async (req, res, next) => {
  try {
    console.log("\n******** Inside verifyJWT_email Function ********");

    // Accept cookie first, fallback to Authorization header
    const token = req.cookies?.accessTokenRegistration || req.header("Authorization")?.replace("Bearer ", "");
    if (!token) {
      console.log("token not found");
      throw new ApiError(401, "Please Login");
    }

    // verify token
    const decodedToken = jwt.verify(token, SECRET);

    // find unregistered user by email; keep _id so downstream has an id
    const user = await UnRegisteredUser.findOne({ email: decodedToken?.email }).select(
      "_id name email picture linkedinLink githubLink portfolioLink skillsProficientAt skillsToLearn education projects bio"
    );

    if (!user) {
      throw new ApiError(401, "Invalid Access Token");
    }

    console.log("middleware (email)", user);

    // normalize req.user to a small predictable object
    req.user = {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
    };

    next();
  } catch (error) {
    if (error?.name === "TokenExpiredError") {
      console.log("Token Expired");
      throw new ApiError(401, "Login Again, Session Expired");
    } else {
      console.log("Error in verifyJWT_email Middleware:", error);
      throw new ApiError(401, error.message || "Invalid Access Token");
    }
  }
});

const verifyJWT_username = asyncHandler(async (req, res, next) => {
  try {
    console.log("\n******** Inside verifyJWT_username Function ********");

   // accept accessTokenRegistration (google), accessToken (local), or Authorization header
    const token =
      req.cookies?.accessTokenRegistration ||
      req.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      console.log("token not found");
      throw new ApiError(401, "Please Login");
    }

    // verify token
    const decodedToken = jwt.verify(token, SECRET);

    // find registered user by username; keep _id
    const user = await User.findOne({ username: decodedToken?.username }).select(
      "_id username name email picture linkedinLink githubLink portfolioLink skillsProficientAt skillsToLearn education projects bio"
    );

    if (!user) {
      throw new ApiError(401, "Invalid Access Token");
    }

    console.log("middleware (username)", user);

    // normalize req.user
    req.user = {
      id: user._id.toString(),
      username: user.username,
      name: user.name,
      email: user.email,
    };

    next();
  } catch (error) {
    if (error?.name === "TokenExpiredError") {
      console.log("Token Expired");
      throw new ApiError(401, "Please Login");
    } else {
      console.log("Error in verifyJWT_username Middleware:", error);
      throw new ApiError(401, error.message || "Invalid Access Token");
    }
  }
});

export { verifyJWT_email, verifyJWT_username };
