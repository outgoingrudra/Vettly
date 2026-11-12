import "dotenv/config";
import cookieParser from "cookie-parser";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import authRoutes from "./modules/auth/auth.routes.js";
import interviewRoutes from "./modules/interviews/interview.routes.js";

import streamRoutes from "./modules/stream/stream.routes.js";

const app = express();

app.disable("x-powered-by");

app.use(
  helmet({
    crossOriginResourcePolicy: {
      policy: "cross-origin",
    },
  })
);

app.use(
  cors({
    origin: [
      process.env.FRONTEND_URL,
      process.env.CLIENT_URL,
      "http://localhost:5173",
      "http://localhost:3000",
    ].filter(Boolean),
    credentials: true,
  })
);

app.use("/api/v1/interviews/:id/questions", express.json({ limit: "2mb" }));
app.use(express.json({ limit: "16kb" }));
app.use(cookieParser());

app.get("/api/v1/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Vettly API is running",
  });
});


app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/interviews", interviewRoutes);
app.use("/api/v1/stream", streamRoutes);
app.use((error, req, res, next) => {
  if (res.headersSent) return next(error);
  const status = error.httpStatus || error.status || 500;
  const message = error.httpStatus ? error.message : "Unable to process the request.";
  res.status(status).json({ success: false, message });
});
export default app;
