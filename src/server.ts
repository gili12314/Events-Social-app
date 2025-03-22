import express from "express";
import session from "express-session";
import passport from "passport";
import "./config/passport"; 
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/db";
import authRoutes from "./routes/authRoutes";
import eventRoutes from "./routes/eventRoutes";
import notificationRoutes from "./routes/notificationRoutes";
import userRoutes from "./routes/userRoutes";
import { apiLimiter } from "./middleware/rateLimit";
import morgan from "morgan";
import compression from "compression";
import commentRoutes from "./routes/commentRoutes";
import swaggerUi from "swagger-ui-express";
import swaggerSpec from "./swaggerSpec";

dotenv.config();
connectDB();

const app = express();

app.use(
  cors({
    origin: ["http://localhost:5173", "https://yourfrontenddomain.com"],
    methods: "GET,POST,PUT,DELETE",
    allowedHeaders: "Content-Type,Authorization",
  })
);

app.use(express.json());
app.use(
  session({
    secret: "supersecret",
    resave: false,
    saveUninitialized: true,
  })
);
app.use(morgan("dev"));
app.use(compression());

// Configuring Swagger UI to display documentation
app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Middleware for request limiting
app.use("/api/", apiLimiter);

app.use("/api/comments", commentRoutes);
app.use("/api/users", userRoutes);
app.use("/uploads", express.static("uploads"));
app.use("/api/events", eventRoutes);
app.use("/api/notifications", notificationRoutes);
app.use(passport.initialize());
app.use(passport.session());
app.use("/api/auth", authRoutes);

app.get("/", (req, res) => {
  res.send("API is running...");
});

if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

export default app;
