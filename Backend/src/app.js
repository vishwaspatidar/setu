// Backend/src/app.js
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import passport from "passport";

const app = express();

// WARNING: permissive CORS for dev / preview convenience.
// It echoes the incoming origin and allows credentials.
// For production harden this to an allow-list.
app.use(
  cors({
    origin: (origin, callback) => {
      // allow requests with no origin (curl/postman/server-to-server)
      if (!origin) return callback(null, true);
      // echo origin back (allows cookies with credentials)
      return callback(null, true);
    },
    credentials: true,
  })
);

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());
app.use(passport.initialize());

// Import routes
import userRouter from "./routes/user.routes.js";
import authRouter from "./routes/auth.routes.js";
import chatRouter from "./routes/chat.routes.js";
import messageRouter from "./routes/message.routes.js";
import requestRouter from "./routes/request.routes.js";
import reportRouter from "./routes/report.routes.js";
import ratingRouter from "./routes/rating.routes.js";

// Use routes
app.use("/user", userRouter);
app.use("/auth", authRouter);
app.use("/chat", chatRouter);
app.use("/message", messageRouter);
app.use("/request", requestRouter);
app.use("/report", reportRouter);
app.use("/rating", ratingRouter);

export { app };
