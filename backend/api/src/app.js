import "dotenv/config";
import cookieParser from "cookie-parser";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import authRoutes from "./modules/auth/auth.routes.js";
import interviewRoutes from "./modules/interviews/interview.routes.js";
import path from "node:path";

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
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  })
);

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
app.use(
  "/uploads",
  express.static(path.resolve(process.cwd(), "uploads"))
);
export default app;
