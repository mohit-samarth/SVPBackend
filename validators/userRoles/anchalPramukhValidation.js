//**only svp domain */
// .custom((value) => {
//   if (!value.endsWith(EMAIL_DOMAIN)) {
//     throw new Error(`Email must end with ${EMAIL_DOMAIN}`);
//   }
//   return true;
// })
// const EMAIL_DOMAIN = "@svp.edu.in";

//only @svp.edu.in
//**only svp domain */

import { Anchal } from "../../models/userArea/anchalSchema.js";
import { body } from "express-validator";

const PASSWORD_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,16}$/;
const PASSWORD_MESSAGE =
  "Password must contain at least one uppercase letter, one lowercase letter, one number, one special character, and be between 8 and 16 characters long";

const EMAIL_DOMAINS = ["@svp.edu.in", "@gmail.com"];

// Common validation chains
const passwordChain = () =>
  body("password")
.trim()
.notEmpty()
.withMessage("Password is required")
.isLength({ min: 8, max: 16 })
.withMessage("Password must be between 8 and 16 characters long")


    

const emailChain = () =>
  body("svpEmail")
    .trim()
    .notEmpty()
    .withMessage("SVP Email is required")
    .isEmail()
    .withMessage("Please enter a valid email address")
    .custom((value) => {
      const isValidDomain = EMAIL_DOMAINS.some((domain) =>
        value.endsWith(domain)
      );
      if (!isValidDomain) {
        throw new Error(
          `Email must end with one of the following domains: ${EMAIL_DOMAINS.join(
            ", "
          )}`
        );
      }
      return true;
    })
    .normalizeEmail();



    const roleChain = () =>
      body("role")
        .trim()
        .notEmpty()
        .withMessage("Role is required")
        .custom((value) => {
          if (value !== "anchalPramukh") {
            throw new Error("Invalid role. Only 'anchalPramukh' is allowed.");
          }
          return true;
        });


// Validation middlewares
export const validateLogin = [emailChain(), passwordChain(),roleChain()];

export const validateSignIn = [
  emailChain(),


];

export const validateChangePassword = [
  body("currentPassword")
    .trim()
    .notEmpty()
    .withMessage("Current password is required")
    .isString()
    .withMessage("Current password must be a string")
    .isLength({ min: 8, max: 16 })
    .withMessage("Password must be between 8 and 16 characters long"),

  body("newPassword")
    .trim()
    .notEmpty()
    .withMessage("New password is required")
    .matches(PASSWORD_REGEX)
    .withMessage(PASSWORD_MESSAGE)
    .custom((value, { req }) => {
      if (value === req.body.currentPassword) {
        throw new Error("New password must be different from current password");
      }
      return true;
    }),

  body("confirmPassword")
    .trim()
    .notEmpty()
    .withMessage("Confirm password is required")
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error("Passwords do not match");
      }
      return true;
    }),
];

export const validateResetPassword = [
  emailChain(),
  body("otp")
    .trim()
    .notEmpty()
    .withMessage("OTP is required")
    .isString()
    .withMessage("OTP must be a valid string")
    .isLength({ min: 6, max: 6 })
    .withMessage("OTP must be 6 characters long")
    .isNumeric()
    .withMessage("OTP must contain only numbers"),

  body("newPassword")
    .trim()
    .notEmpty()
    .withMessage("New password is required")
    .matches(PASSWORD_REGEX)
    .withMessage(PASSWORD_MESSAGE),
 

  body("confirmPassword")
    .trim()
    .notEmpty()
    .withMessage("Confirm password is required")
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error("Passwords do not match");
      }
      return true;
    }),
];

export const validateResendOtp = [emailChain()];

export const validateForgotPassword = [emailChain(),roleChain()];
