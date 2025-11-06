import express from "express";
import fetch from "node-fetch";
import bodyParser from "body-parser";
import cors from "cors";

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static("public"));

// Your webhooks
const DISCORD_WEBHOOK = "https://discord.com/api/webhooks/1435775034365837342/zXkb3gRYzIFtmSgAWQ62YKDOiNL9ge8bU0qKfifI1kIZbaXnZ_qiumaWoZMknHvjBnYw";
const GOOGLE_CHAT_WEBHOOK = "https://chat.googleapis.com/v1/spaces/AAAAtHf5I1A/messages?key=AIzaSyDdI0hCZtE6vySjMm-WEfRq3CPzqKqqsHI&token=tS_ALY3TyVsX84WLmf2Sj47hn1z-n4el4ZHeevFFuGg";

// Default blocked words
let blocklist = ["spam", "test-block"];

// Endpoint to send messages
app.post("/send-message", async (req, res) => {
  const { message } = req.body;

  const lowerMsg = message.toLowerCase();
  for (const word of blocklist) {
    if (word && lowerMsg.includes(word.toLowerCase())) {
      return res.json({ success: false, blocked: true });
    }
  }

  try {
    const discordResp = await fetch(DISCORD_WEBHOOK, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: message }),
    });

    const googleResp = await fetch(GOOGLE_CHAT_WEBHOOK, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: message }),
    });

    const success = discordResp.ok && googleResp.ok;
    res.json({ success, blocked: false });
  } catch (err) {
    console.error(err);
    res.json({ success: false, blocked: false });
  }
});

// Add blocked word (moderator)
app.post("/add-blockword", (req, res) => {
  const { word } = req.body;
  if (!word || blocklist.includes(word.toLowerCase())) return res.json({ success: false });
  blocklist.push(word.toLowerCase());
  res.json({ success: true, blocklist });
});

// Remove blocked word (moderator)
app.post("/remove-blockword", (req, res) => {
  const { word } = req.body;
  blocklist = blocklist.filter((w) => w !== word.toLowerCase());
  res.json({ success: true, blocklist });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
