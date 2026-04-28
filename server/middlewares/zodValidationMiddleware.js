import { AppError } from "../helpers/AppError.js";

/**
 * Validates request body using Zod schema
 */
export const validateZodBody = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);

  if (!result.success) {
    const errors = result.error.errors.map((detail) => ({
      field: detail.path.join("."),
      message: detail.message,
    }));

    const err = new AppError("Body validation Failed", 400);
    err.details = errors;
    return next(err);
  }

  req.body = result.data;
  next();
};

/**
 * Validates URL parameters using Zod schema
 */
export const validateZodParams = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.params);

  if (!result.success) {
    const errors = result.error.errors.map((detail) => ({
      field: detail.path.join("."),
      message: detail.message,
    }));

    const err = new AppError("URL Parameters validation Failed", 400);
    err.details = errors;
    return next(err);
  }

  req.params = result.data;
  next();
};
