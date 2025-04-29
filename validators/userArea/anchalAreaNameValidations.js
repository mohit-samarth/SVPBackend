import { body } from "express-validator";

export const validateAnchalAreaName = [
  body("anchalName")
    .trim()
    .notEmpty()
    .withMessage("Anchal name is required")
    .isString()
    .withMessage("Anchal name must be a valid string")
    .isLength({ min: 5, max: 30 })
    .withMessage("Anchal name must be between 5 and 30 characters long")
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage("Anchal name must not contain numbers or special characters"),

  body("zoneName")
    .trim()
    .notEmpty()
    .withMessage("Zone name is required")
    .isString()
    .withMessage("Zone name must be a valid string"),

];
