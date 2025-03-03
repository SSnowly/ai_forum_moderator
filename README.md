# 🤖 AI Forum Moderator

A powerful Discord bot that uses AI to automatically moderate and validate forum posts. Built with Discord.js and Google's Gemini AI.

## ✨ Features

- **AI-Powered Validation**: Automatically checks posts for quality and compliance
- **Scam Detection**: Uses advanced AI to identify and remove potential scam posts
- **Smart Moderation Flow**:
  - Locks threads pending review
  - Provides instant feedback to users
  - Sends detailed reports to moderators
  - Supports manual approval/denial with one click

## 🚀 Setup

1. Clone the repository
2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file with:
```env
DISCORD_TOKEN=your_bot_token
DISCORD_CLIENT_ID=your_client_id
DISCORD_MODERATOR_ROLE_ID=your_mod_role_id
DISCORD_FORUM_CATEGORY_ID=your_forum_category_id
DISCORD_SCAM_LOG_CHANNEL_ID=your_log_channel_id
GEMINI_API_KEY=your_gemini_api_key
```

4. Build and start:
```bash
npm run build
npm start
```

## 🛠️ Commands

- Posts are automatically processed when created
- Moderators can use buttons to:
  - ✅ Approve posts
  - ❌ Deny posts

## 🔒 Security

- Role-based access control
- Secure API key handling
- Automatic thread locking
- Scam detection with user timeout

## 🤝 Contributing

Feel free to submit issues and pull requests!

## 📝 License

MIT License - feel free to use and modify as you wish!

---
Made with ❤️ using Discord.js and Gemini AI by Snowy