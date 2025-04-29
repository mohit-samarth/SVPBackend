import { body } from "express-validator";

export const validateLogin = [
  body("email").isEmail().withMessage("Please enter a valid email"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long"),
];

export const validateSignIn = [
    body("svpEmail")
    .isEmail()
    .withMessage("Please enter a valid email"),

  body("password")
    .isLength({ min: 8, max: 32 })
    .withMessage("Password must be between 8 and 32 characters"),

  body("sanchArea")
  .isIn(["Nashik", "Dindori"])
    .withMessage("Please provide a valid aanchal area (Nashik or Dindori)"),

  body("role")
    .equals("sanchPramukh")
    .withMessage("Role must be 'sanchPramukh'")
];
