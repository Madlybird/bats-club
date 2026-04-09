# Bats Club Telegram Bot

Admin bot for uploading anime figures via Telegram.

## Setup

1. Fill in `.env`:
   - `ANTHROPIC_API_KEY` — get from console.anthropic.com
   - `ADMIN_TELEGRAM_IDS` — your Telegram user ID(s), comma-separated (find yours via @userinfobot). Leave empty to allow all users.

2. Run:
   ```
   node index.js
   ```

## Flow

1. Send a **photo** of a figure
2. Bot analyzes it with Claude vision and shows extracted data
3. Reply **YES** to confirm, or send corrections as text
4. Reply **YES 150** (price in USD) to add to shop, or **NO** to skip
5. If adding to shop, reply with condition: `Mint` / `Near Mint` / `Good` / `Fair` / `Poor`
6. Bot uploads to Supabase Storage and saves to database

## Commands

- `/start` or `/help` — show help
- `/cancel` — cancel current operation
