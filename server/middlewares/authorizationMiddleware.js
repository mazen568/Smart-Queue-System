import { AppError } from "../helpers/AppError.js"

const authorize = (...roles)=> {
    return (req, res, next)=>{
        if(!req.user) {
            const error = new AppError("Unauthorized: No user information found",401)
            return next(error) 
        }

        if(!roles.includes(req.user.role)) {
            const error = new AppError("Forbidden: You do not have permission to access this resource",403)
            return next (error)
        }

        next()
    }
}

export default authorize