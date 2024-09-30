/**
 * Main entry point of our web server
 *
 * @version 1.0.0
 */

/**
 * Required External Modules
 */
import * as dotenv from "dotenv";
import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import * as bodyParser from "body-parser";
import mongoose from "mongoose";
const sqlite3 = require("sqlite3").verbose();

import routes from "./routes";

dotenv.config();

/**
 * App variables
 */
// if (!process.env.PORT) {
//   process.exit(1);
// }

// const PORT: number = Number(process.env.PORT) || 3003;
const PORT: number = parseInt(process.env.PORT as string, 10) || 3003;
const corsOpts = {
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTION", "PATCH"],
  allowedHeaders: ["Content-Type"],
};

/**
 * Eastablish database connection
 */

// if (err) {
//     console.log(err.message);
// }

const app = express();

// app.use((req: Request, res: Response, next: NextFunction) => {
//     res.setHeader('Access-Control-Allow-Origin', '*');
//     next();
// })

/**
 * App Configurations
 */
// app.use(helmet());
app.use(cors(corsOpts));
app.use(express.json());

app.use("/", routes);

mongoose.connect(process.env.DATABASE_URL || "").then(() => {
  console.log("connected");
});

/**
 * Server Activation
 */
app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`);
});
