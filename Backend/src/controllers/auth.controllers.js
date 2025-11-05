import { generateJWTToken_email, generateJWTToken_username } from "../utils/generateJWTToken.js";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { User } from "../models/user.model.js";
import { UnRegisteredUser } from "../models/unRegisteredUser.model.js";
import dotenv from "dotenv";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

dotenv.config();

/**
 * Passport Google Strategy (kept as-is)
 */
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "/auth/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      done(null, profile);
    }
  )
);

export const googleAuthHandler = passport.authenticate("google", {
  scope: ["profile", "email"],
});

export const googleAuthCallback = passport.authenticate("google", {
  failureRedirect: "http://localhost:5173/login",
  session: false,
});

/**
 * Cookie options helper:
 * - In production (Render) we want secure cookies with sameSite='none' for cross-site usage.
 * - In development we fall back to secure: false and sameSite: 'lax' for localhost convenience.
 */
const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
};

/**
 * Google login callback handler (kept behavior, but uses standardized cookie options)
 */
export const handleGoogleLoginCallback = asyncHandler(async (req, res) => {
  console.log("\n******** Inside handleGoogleLoginCallback function ********");

  const existingUser = await User.findOne({ email: req.user._json.email });

  if (existingUser) {
    const jwtToken = generateJWTToken_username(existingUser);
    const expiryDate = new Date(Date.now() + 1 * 60 * 60 * 1000);
    res.cookie("accessToken", jwtToken, { ...cookieOptions, expires: expiryDate });
    // Redirect to frontend (change domain if needed for production)
    return res.redirect(`http://localhost:5173/discover`);
  }

  let unregisteredUser = await UnRegisteredUser.findOne({ email: req.user._json.email });
  if (!unregisteredUser) {
    console.log("Creating new Unregistered User");
    unregisteredUser = await UnRegisteredUser.create({
      name: req.user._json.name,
      email: req.user._json.email,
      picture: req.user._json.picture,
    });
  }
  const jwtToken = generateJWTToken_email(unregisteredUser);
  const expiryDate = new Date(Date.now() + 0.5 * 60 * 60 * 1000);
  res.cookie("accessTokenRegistration", jwtToken, { ...cookieOptions, expires: expiryDate });
  return res.redirect("http://localhost:5173/register");
});

/**
 * Logout handler
 */
export const handleLogout = (req, res) => {
  console.log("\n******** Inside handleLogout function ********");
  res.clearCookie("accessToken");
  res.clearCookie("accessTokenRegistration");
  return res.status(200).json(new ApiResponse(200, null, "User logged out successfully"));
};

/*
  Minimal local-auth additions (signup / signin)
  - Small and consistent with your cookie-based flow.
  - Returns ApiResponse(statusCode, data, message).
*/

// POST /api/auth/signup
export const signup = asyncHandler(async (req, res) => {
  const { username, name, email, password, picture } = req.body;

  if (!username || !name || !email || !password) {
    return res.status(400).json(new ApiResponse(400, null, "username, name, email and password are required"));
  }

  // check duplicates
  const byEmail = await User.findOne({ email: email.toLowerCase() });
  if (byEmail) return res.status(409).json(new ApiResponse(409, null, "Email already registered"));

  const byUsername = await User.findOne({ username });
  if (byUsername) return res.status(409).json(new ApiResponse(409, null, "Username already taken"));

  // create user (password will be hashed by user model pre-save)
  const newUser = await User.create({
    username,
    name,
    email: email.toLowerCase(),
    password,
    picture: picture || undefined,
  });

  const jwtToken = generateJWTToken_username(newUser);
  const expiryDate = new Date(Date.now() + 1 * 60 * 60 * 1000); // 1 hour

  // set cookie and return minimal user object + token
  res.cookie("accessToken", jwtToken, { ...cookieOptions, expires: expiryDate });

  const userPayload = {
    id: newUser._id,
    username: newUser.username,
    name: newUser.name,
    email: newUser.email,
    picture: newUser.picture,
  };

  return res.status(201).json(new ApiResponse(201, { user: userPayload, token: jwtToken }, "User created successfully"));
});

// POST /api/auth/signin
export const signin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json(new ApiResponse(400, null, "Email and password are required"));

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) return res.status(401).json(new ApiResponse(401, null, "Invalid credentials"));

  // If user has no password set (i.e., signup via Google previously), tell them to set a password first
  if (!user.password) {
    return res.status(400).json(new ApiResponse(400, null, "No local password found for this account. Please set a password or login via Google."));
  }

  const match = await user.comparePassword(password);
  if (!match) return res.status(401).json(new ApiResponse(401, null, "Invalid credentials"));

  const jwtToken = generateJWTToken_username(user);
  const expiryDate = new Date(Date.now() + 1 * 60 * 60 * 1000); // 1 hour
  res.cookie("accessToken", jwtToken, { ...cookieOptions, expires: expiryDate });

  const userPayload = {
    id: user._id,
    username: user.username,
    name: user.name,
    email: user.email,
    picture: user.picture,
  };

  return res.status(200).json(new ApiResponse(200, { user: userPayload, token: jwtToken }, "Login successful"));
});
