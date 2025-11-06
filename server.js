import express from "express";
import fetch from "node-fetch";
import bodyParser from "body-parser";
import cors from "cors";

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static("public"));

const DISCORD_WEBHOOK = "YOUR_DISCORD_WEBHOOK_HERE";
const GOOGLE_CHAT_WEBHOOK = "YOUR_GOOGLE_CHAT_WEBHOOK_HERE";

// Default blocked words
let blocklist = ["spam", "test-block"];

// API endpoint to send messages
app.post("/send-message", async (req, res) => {
  const { message } = req.body;

  const lowerMsg = message.toLowerCase();
  for (const word of blocklist) {
    if (word && lowerMsg.includes(word.toLowerCase())) {
      return res.json({ success: false, blocked: true });
    }
  }

  try {
    // Send to Discord
    const discordResp = await fetch(DISCORD_WEBHOOK, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: message }),
    });

    // Send to Google Chat
    const googleResp = await fetch(GOOGLE_CHAT_WEBHOOK, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: message }),
    });

    if (discordResp.ok && googleResp.ok) {
      return res.json({ success: true, blocked: false });
    } else {
      return res.json({ success: false, blocked: false });
    }
  } catch (err) {
    console.error(err);
    res.json({ success: false, blocked: false });
  }
});

// Endpoint to add blocked words (moderator)
app.post("/add-blockword", (req, res) => {
  const { word } = req.body;
  if (!word || blocklist.includes(word.toLowerCase())) {
    return res.json({ success: false });
  }
  blocklist.push(word.toLowerCase());
  res.json({ success: true, blocklist });
});

// Endpoint to remove blocked words (moderator)
app.post("/remove-blockword", (req, res) => {
  const { word } = req.body;
  blocklist = blocklist.filter((w) => w !== word.toLowerCase());
  res.json({ success: true, blocklist });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
