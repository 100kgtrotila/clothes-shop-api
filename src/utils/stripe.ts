import { ApiVersion } from "node_modules/stripe/cjs/apiVersion.js";
import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECERET_KEY as string);
