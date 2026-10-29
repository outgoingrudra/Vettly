import "dotenv/config";
import cookieParser from "cookie-parser";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import authRoutes from "./modules/auth/auth.routes.js";
import interviewRoutes from "./modules/interviews/interview.routes.js";

const app = express();

app.disable("x-powered-by");

app.use(helmet());

if (process.env.NODE_ENV === "development") {
  app.use(cors());
} else {
  app.use(
    cors({
      origin: process.env.FRONTEND_URL,
      credentials: true,
    })
  );
}

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
export default app;
