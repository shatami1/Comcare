# Telegram Bot Setup for ComfortCare Form Submissions

## Step 1: Create a Telegram Bot

1. Open Telegram and search for **@BotFather**
2. Click the result and start a chat
3. Send the message: `/newbot`
4. BotFather will ask for a bot name. Enter: `ComfortCareBot`
5. BotFather will ask for a username. Enter: `comfortcare_form_bot` (or any unique name)
6. BotFather will give you a **bot token** that looks like: `123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11`
   - **SAVE THIS TOKEN** - you'll need it

## Step 2: Create a Telegram Channel or Group

Option A: Use your personal Telegram account chat
- Open Telegram and start a chat with yourself
- Get your Chat ID (you'll do this in Step 3)

Option B: Create a private channel for notifications
1. In Telegram, create a new private channel named "ComfortCare Messages"
2. Add your bot to the channel (you'll do this after getting the bot token)

## Step 3: Get Your Chat ID

1. Open this URL in your browser (replace BOT_TOKEN with your actual token):
   ```
   https://api.telegram.org/botBOT_TOKEN/getMe
   ```
   You should see a JSON response confirming your bot exists.

2. Send a test message in Telegram to your bot or the channel
3. Open this URL to get updates:
   ```
   https://api.telegram.org/botBOT_TOKEN/getUpdates
   ```
4. Look for the "chat" object and find the **"id"** field. That's your Chat ID.
   - Format: usually like `-1001234567890` for channels or large positive number for personal chats

## Step 4: Update the Configuration

Once you have:
- **Bot Token**: 123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11
- **Chat ID**: -1001234567890

Tell me those values, and I'll update the forms to send submissions to Telegram.

## Alternative: Share Your Bot Token

1. Get your Bot Token from BotFather
2. Send it to me (or write it in a config file)
3. I'll configure the forms to send notifications to your account

