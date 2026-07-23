# Bats Club Telegram Bot

Admin bot for uploading anime figures via Telegram.

## Setup

1. Fill in `.env`:
   - `ADMIN_TELEGRAM_IDS` — your Telegram user ID(s), comma-separated (find yours via @userinfobot). Leave empty to allow all users.

2. Run:
   ```
   node index.js
   ```

## Flow

1. Send **1-10 photos** of a figure, then type **DONE**
2. Bot sends a `Label: value` template — fill it in and send it back (required: Name, Series, Character, Manufacturer, Scale)
3. Reply **YES** to confirm, or send corrected lines in `Label: value` format (only recognized lines are applied)
4. Reply **YES 150** (price in USD) to add to shop, or **NO** to skip
5. If adding to shop, reply with condition: `Mint` / `Near Mint` / `Good` / `Fair` / `Poor`
6. Bot uploads to Supabase Storage and saves to database

## Commands

- `/start` or `/help` — show help
- `/cancel` — cancel current operation
