// -------------------------- Mailer utility function --------------------------
// Can be called from anywhere via: import { resend } from "../utils/mailer.js";

import { Resend } from 'resend';
import dotenv from 'dotenv';
dotenv.config();

// use the API Key stored in .env (connected to Jamie's resend account)
export const resend = new Resend(process.env.RESEND_API_KEY);