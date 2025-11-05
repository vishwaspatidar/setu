// Backend/src/middlewares/verifyOptionalJWT.middleware.js
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import { UnRegisteredUser } from "../models/unRegisteredUser.model.js";
import { ApiError } from "../utils/ApiError.js";
dotenv.config();

const SECRET = process.env.JWT_SECRET || "default_dev_secret_key";

const verifyOptionalJWT = asyncHandler(async (req, res, next) => {
  try {
    const token =
      req.cookies?.accessTokenRegistration ||
      req.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      // No token -> allow request to proceed unauthenticated
      req.user = null;
      return next();
    }

    // token exists -> verify and attach minimal user info
    const decoded = jwt.verify(token, SECRET);

    if (decoded?.email) {
      const unUser = await UnRegisteredUser.findOne({ email: decoded.email }).select(
        "_id name email picture username"
      );
      if (unUser) {
        req.user = { type: "unregistered", id: unUser._id.toString(), email: unUser.email, name: unUser.name };
        return next();
      }
    }

    if (decoded?.username) {
      const user = await User.findOne({ username: decoded.username }).select("_id username name email picture");
      if (user) {
        req.user = { type: "registered", id: user._id.toString(), username: user.username, email: user.email, name: user.name };
        return next();
      }
    }

    // token valid but no DB record found
    throw new ApiError(401, "Invalid Access Token");
  } catch (err) {
    if (err?.name === "TokenExpiredError") {
      throw new ApiError(401, "Login Again, Session Expired");
    }
    throw err;
  }
});

export default verifyOptionalJWT;
