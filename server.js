import express from "express";
import fetch from "node-fetch";
import bodyParser from "body-parser";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
const PORT = process.env.PORT || 3000;

// ==================== CONFIG ====================
const DISCORD_WEBHOOK = "https://discord.com/api/webhooks/1435775034365837342/zXkb3gRYzIFtmSgAWQ62YKDOiNL9ge8bU0qKfifI1kIZbaXnZ_qiumaWoZMknHvjBnYw";
const GOOGLE_CHAT_WEBHOOK = "https://chat.googleapis.com/v1/spaces/AAAAtHf5I1A/messages?key=AIzaSyDdI0hCZtE6vySjMm-WEfRq3CPzqKqqsHI&token=tS_ALY3TyVsX84WLmf2Sj47hn1z-n4el4ZHeevFFuGg";

// Permanent blocklist (cannot be changed)
const blocklist = [
  "fuck","f*ck","fck","fock","fu",
  "shit","sh*t","sh1t",
  "bitch","b1tch","biatch","b!tch",
  "asshole","a**hole","assh0le","ass","a$$",
  "damn","d*mn","damm",
  "cunt","c*nt","cunn",
  "nigger","n1gger","nigga",
  "slut","sl*t","whore","w*ore",
  "fag","f4g","faggot","f@g",
  "cock","c*ck","penis","dick","d!ck",
  "pussy","p*ssy","bastard","b@stard",
  "bollocks","arse","crap","prick"
];

// ==================== MIDDLEWARE ====================
app.use(bodyParser.json());
app.use(express.static("public"));

// ==================== ROUTES ====================

// Serve the frontend HTML
app.get("/", (req, res) => {
  res.sendFile(path.join(path.dirname(fileURLToPath(import.meta.url)), "index.html"));
});

// Send message endpoint
app.post("/send-message", async (req, res) => {
  let { message } = req.body;
  if (!message) return res.status(400).json({ error: "Message required" });

  // Filter bad words
  const lowerMessage = message.toLowerCase();
  let blocked = false;
  for (const word of blocklist) {
    if (lowerMessage.includes(word)) {
      blocked = true;
      message = "[blocked]";
      break;
    }
  }

  let discordSuccess = false;
  let googleSuccess = false;

  if (!blocked) {
    try {
      const d = await fetch(DISCORD_WEBHOOK, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: message })
      });
      discordSuccess = d.ok;
    } catch (e) {
      console.error("Discord webhook failed", e);
    }

    try {
      const g = await fetch(GOOGLE_CHAT_WEBHOOK, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: message })
      });
      googleSuccess = g.ok;
    } catch (e) {
      console.error("Google Chat webhook failed", e);
    }
  }

  res.json({ blocked, discordSuccess, googleSuccess });
});

// ==================== START SERVER ====================
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
