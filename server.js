// server.js
const express = require('express');
const bodyParser = require('body-parser');
const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(express.static('public'));

// === Webhook URLs ===
const DISCORD_WEBHOOK = 'https://discord.com/api/webhooks/1435775034365837342/zXkb3gRYzIFtmSgAWQ62YKDOiNL9ge8bU0qKfifI1kIZbaXnZ_qiumaWoZMknHvjBnYw';
const GOOGLE_CHAT_WEBHOOK = 'https://chat.googleapis.com/v1/spaces/AAAAtHf5I1A/messages?key=AIzaSyDdI0hCZtE6vySjMm-WEfRq3CPzqKqqsHI&token=tS_ALY3TyVsX84WLmf2Sj47hn1z-n4el4ZHeevFFuGg';

// === Bad word filter (automatic, no add/remove) ===
const blockedWords = [
  'fuck','fck','fock','fu','shit','sh1t','bitch','b1tch','ass','a55',
  'damn','d4mn','dick','d1ck','piss','p1ss','cunt','c*nt','nigger','n1gger',
  'nigga','n1gga','bastard','b4stard','slut','slutty','whore','w0re','fag','f4g',
  'faggot','f4ggot','motherfucker','m0therfucker'
];

// === Helper: filter message ===
function filterMessage(message) {
  let filtered = message;
  let blocked = false;
  blockedWords.forEach(word => {
    const regex = new RegExp(word, 'gi');
    if (regex.test(filtered)) {
      filtered = filtered.replace(regex, '[blocked]');
      blocked = true;
    }
  });
  return { filtered, blocked };
}

// === Save messages ===
const MESSAGES_FILE = path.join(__dirname, 'messages.json');
function saveMessage(messageObj) {
  let messages = [];
  if (fs.existsSync(MESSAGES_FILE)) {
    messages = JSON.parse(fs.readFileSync(MESSAGES_FILE));
  }
  messages.push(messageObj);
  fs.writeFileSync(MESSAGES_FILE, JSON.stringify(messages, null, 2));
}

// === Routes ===
app.post('/send-message', async (req, res) => {
  const { sender, school, message } = req.body;

  if (!sender || !message || !school) {
    return res.status(400).json({ success: false, error: 'Missing fields' });
  }

  const { filtered, blocked } = filterMessage(message);
  let status = 'success';

  if (!blocked) {
    // Send to Discord
    const discordRes = await fetch(DISCORD_WEBHOOK, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: `**${sender} [${school}]**: ${filtered}` })
    });

    // Send to Google Chat
    const googleRes = await fetch(GOOGLE_CHAT_WEBHOOK, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: `**${sender} [${school}]**: ${filtered}` })
    });

    if (!discordRes.ok || !googleRes.ok) {
      status = 'error';
    }
  } else {
    status = 'blocked';
  }

  const msgObj = {
    sender,
    school,
    original_message: message,
    filtered_message: filtered,
    blocked,
    status,
    timestamp: new Date().toISOString()
  };

  saveMessage(msgObj);
  res.json({ success: true, message: msgObj });
});

// Fetch all messages
app.get('/messages', (req, res) => {
  if (fs.existsSync(MESSAGES_FILE)) {
    const messages = JSON.parse(fs.readFileSync(MESSAGES_FILE));
    return res.json(messages);
  }
  res.json([]);
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
