import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import passport from "passport";

const app = express();

// Backend/src/app.js (replace existing cors setup)
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import passport from "passport";

const app = express();

// Read allowed origins from env; you can set a comma-separated list.
// Example: CORS_ORIGINS="https://setu-pink.vercel.app,https://setu-2p9xwx8nb-vishwaspatidars-projects.vercel.app"
const rawOrigins = process.env.CORS_ORIGINS || process.env.CORS_ORIGIN || "http://localhost:5173";
const allowedOrigins = rawOrigins.split(",").map((s) => s.trim().replace(/\/$/, "")); // strip trailing slash

app.use(
  cors({
    origin: function (origin, callback) {
      // allow requests with no origin like mobile apps or curl
      if (!origin) return callback(null, true);
      // allow if origin is in our list
      const cleaned = origin.replace(/\/$/, "");
      if (allowedOrigins.indexOf(cleaned) !== -1) {
        return callback(null, true);
      } else {
        return callback(new Error("CORS not allowed for origin: " + origin), false);
      }
    },
    credentials: true,
  })
);

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());
app.use(passport.initialize());

// ... routes below unchanged

import userRouter from "./routes/user.routes.js";
import authRouter from "./routes/auth.routes.js";
import chatRouter from "./routes/chat.routes.js";
import messageRouter from "./routes/message.routes.js";
import requestRouter from "./routes/request.routes.js";
import reportRouter from "./routes/report.routes.js";
import ratingRouter from "./routes/rating.routes.js";

app.use("/user", userRouter);
app.use("/auth", authRouter);
app.use("/chat", chatRouter);
app.use("/message", messageRouter);
app.use("/request", requestRouter);
app.use("/report", reportRouter);
app.use("/rating", ratingRouter);

export { app };
