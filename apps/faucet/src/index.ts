import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { body, validationResult } from "express-validator";
import { RateLimiterMemory } from "rate-limiter-flexible";
import { ethers } from "ethers";
import dotenv from "dotenv";
import { drip, wallet, getHotWalletBalance } from "./wallet";

dotenv.config({ path: require("path").resolve(__dirname, "../../.env") });

const app = express();
const port = Number(process.env.PORT || 8080);
const dripAmount = ethers.parseEther(process.env.DRIP_AMOUNT || "0.5");
const cooldownHours = Number(process.env.COOLDOWN_HOURS || 24);
const allowedOrigin = process.env.ALLOWED_ORIGIN || "https://eltx.online";

app.use(express.json());
app.use(helmet({ crossOriginResourcePolicy: { policy: "same-origin" } }));
app.use(
  cors({
    origin: allowedOrigin,
    methods: ["POST", "OPTIONS"],
    credentials: false
  })
);
app.use(morgan("combined"));

const ipLimiter = new RateLimiterMemory({ points: 10, duration: 60 });
const addressLimiter = new RateLimiterMemory({ points: 1, duration: cooldownHours * 3600 });

app.get("/healthz", async (_req, res) => {
  try {
    const balance = await getHotWalletBalance();
    res.json({ status: "ok", wallet: wallet.address, balance: ethers.formatEther(balance) });
  } catch (error) {
    res.status(500).json({ status: "error", error: (error as Error).message });
  }
});

app.post(
  "/drip",
  body("address").isString().custom((value) => ethers.isAddress(value)),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const target = (req.body.address as string).toLowerCase();
    const ip = req.ip;

    try {
      await ipLimiter.consume(ip);
      await addressLimiter.consume(target);
    } catch (rateErr) {
      return res.status(429).json({ message: "Rate limit exceeded. Try again later." });
    }

    // Optional captcha validation stub
    if (process.env.CAPTCHA_SECRET) {
      const token = req.body.captchaToken;
      if (!token) {
        return res.status(400).json({ message: "captchaToken required" });
      }
      // TODO: verify token with Cloudflare Turnstile / Google reCAPTCHA
    }

    try {
      const receipt = await drip(target, dripAmount);
      res.json({ hash: receipt.transactionHash, amount: ethers.formatEther(dripAmount) });
    } catch (error) {
      console.error("Faucet error", error);
      res.status(500).json({ message: "Unable to send ELTX", error: (error as Error).message });
    }
  }
);

app.listen(port, () => {
  console.log(`ELTX faucet listening on port ${port} with hot wallet ${wallet.address}`);
});
