import { Router } from "express";
import {
  googleAuthCallback,
  googleAuthHandler,
  handleGoogleLoginCallback,
  handleLogout,
  signup,
  signin,
} from "../controllers/auth.controllers.js";

const router = Router();

// 🔹 Google OAuth routes (unchanged)
router.get("/google", googleAuthHandler);
router.get("/google/callback", googleAuthCallback, handleGoogleLoginCallback);
router.get("/logout", handleLogout);

// 🔹 Local authentication routes (new)
router.post("/signup", signup);
router.post("/signin", signin);

export default router;
