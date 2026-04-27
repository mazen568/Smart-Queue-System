import jwt from 'jsonwebtoken';
import { AppError } from '../helpers/AppError.js';

const authenticate = (req,res,next)=>{
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        throw new AppError("Unauthorized: No token provided",401)
    }

    const token = authHeader.split(" ")[1]

    try {
        const payload = jwt.verify(token,process.env.JWT_SECRET)
        req.user = payload
        next()

    } catch (error) {
        throw new AppError("Unauthorized: Invalid token",401)
    }
}

export default authenticate