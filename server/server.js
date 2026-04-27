import express from "express"
import mongoose from "mongoose"
import dotenv from "dotenv"
import { errorHandler } from "./middlewares/errorHandling.js"
import authRouter from "./routes/authRoutes.js"
import adminRouter from "./routes/adminRoutes.js"
import cookieParser from "cookie-parser"
import cors from "cors"


dotenv.config()

const port = process.env.PORT

const baseURL = process.env.BASE_URL

const app = express()

app.use(express.json())

app.use(cookieParser())

app.use(cors({
    origin: process.env.CLIENT_URL,
    credentials: true
}))



//public routes

app.use(`${baseURL}/auth`, authRouter)

//protected routes
app.use(`${baseURL}/admin`, adminRouter)





//error handling middleware
app.use(errorHandler)


//connection 
mongoose.connect(process.env.MONGODB_URL)
    .then(() => {
        console.log("Connected to DB");

        app.listen(port, () => {
            console.log(`Server Listening on port : ${port}`);
        })

    })
    .catch((err) => {
        console.log("An error occurred While connecting to DB", err);
    })