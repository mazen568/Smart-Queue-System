import { AppError } from "../helpers/AppError.js"
//validate body

export const validateBody = (schema) =>{
    return (req,res,next)=>{
        const {error , value } = schema.validate(req.body,{abortEarly:false , stripUnknown:true})

        if (error) {
            const errors = error.details.map(detail=>({
                field:detail.path.join("."),
                message:detail.message}))

                const err = new AppError("Body validation Failed",400)
                err.details = errors
                return next(err)
        }

        req.body = value
        next()
    }
}

//validate URL params
export const validateParams = (schema) =>{
    return (req,res,next)=>{
        const {error , value } = schema.validate(req.params,{abortEarly:false , stripUnknown:true})

        if (error) {
            const errors = error.details.map(detail=>({
                field:detail.path.join("."),
                message:detail.message}))

                const err = new AppError("Params validation Failed",400)
                err.details = errors
                return next(err)
        }

        req.params = value
        next()
    }
}

//validate query params
export const validateQuery = (schema) =>{
    return (req,res,next)=>{
        const {error , value } = schema.validate(req.query,{abortEarly:false , stripUnknown:true})

        if (error) {
            const errors = error.details.map(detail=>({
                field:detail.path.join("."),
                message:detail.message}))

                const err = new AppError("Query params validation Failed",400)
                err.details = errors
                return next(err)
        }

        // req.query = value//this is an issue , because its read only
        req.validatedQuery = value
        next()
    }
}