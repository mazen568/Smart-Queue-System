import express from "express"
import mongoose from "mongoose"
import dotenv from "dotenv"
import path from "path"
import { fileURLToPath } from "url"
import { createServer } from "http"
import { errorHandler } from "./middlewares/errorHandling.js"
import authRouter from "./routes/authRoutes.js"
import adminRouter from "./routes/adminRoutes.js"
import patientRouter from "./routes/patientRoutes.js"
import publicRouter from "./routes/publicRoutes.js"
import receptionRouter from "./routes/receptionRoutes.js"
import { initSocket } from "./config/socket.config.js"
import cookieParser from "cookie-parser"
import cors from "cors"


dotenv.config()

const port = process.env.PORT || 3000

const baseURL = process.env.BASE_URL || "/api/v1"

const app = express()
const server = createServer(app)

// Initialize Socket.io
initSocket(server)

app.use(express.json())

app.use(cookieParser())

app.use(cors({
    origin: "http://localhost:4200",
    credentials: true
}))



//public routes

app.use(`${baseURL}/auth`, authRouter)
app.use(`${baseURL}/patient`, patientRouter)
// Public, non-prefixed API for patient experience (browse/tickets/queues)
app.use(`${baseURL}`, publicRouter)

//protected routes
app.use(`${baseURL}/admin`, adminRouter)
app.use(`${baseURL}/reception`, receptionRouter)

// Serve uploads statically
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use("/uploads", express.static(path.join(__dirname, "uploads")));





//error handling middleware
app.use(errorHandler)


//connection 
mongoose.connect(process.env.MONGODB_URL)
    .then(() => {
        console.log("Connected to DB");

        server.listen(port, () => {
            console.log(`Server Listening on port : ${port}`);
        })

    })
    .catch((err) => {
        console.log("An error occurred While connecting to DB", err);
    })
