# WhatsApp Accounting Bot 💼

A WhatsApp chatbot for capturing business accounting data through conversational Q&A flows. Perfect for small businesses to track income, expenses, and invoices on-the-go.

## Features

- 💰 Record Income transactions
- 💸 Record Expense transactions
- 🧾 Record and track Invoices
- 📊 View financial summary
- 📝 View recent transactions
- 💾 Automatic data persistence

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **WhatsApp Integration**: Twilio API
- **Deployment**: Vercel (Serverless)
- **Storage**: JSON file-based (can be replaced with database)

## Setup Instructions

### 1. Prerequisites

- Node.js 18+ installed
- A Twilio account ([Sign up here](https://www.twilio.com/try-twilio))
- Vercel account ([Sign up here](https://vercel.com))

### 2. Twilio Setup

1. Go to [Twilio Console](https://console.twilio.com/)
2. Navigate to **Messaging** → **Try it out** → **Send a WhatsApp message**
3. Follow the steps to activate the Twilio WhatsApp Sandbox
4. Copy your:
   - Account SID
   - Auth Token
   - WhatsApp Sandbox number (format: `whatsapp:+14155238886`)

### 3. Local Development

1. Clone/download this repository

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory:
   ```env
   TWILIO_ACCOUNT_SID=your_account_sid
   TWILIO_AUTH_TOKEN=your_auth_token
   TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
   ```

4. Run locally with Vercel CLI:
   ```bash
   npm install -g vercel
   vercel dev
   ```

### 4. Deploy to Vercel

1. Install Vercel CLI (if not already installed):
   ```bash
   npm install -g vercel
   ```

2. Login to Vercel:
   ```bash
   vercel login
   ```

3. Deploy:
   ```bash
   vercel
   ```

4. Add environment variables in Vercel:
   - Go to your project on Vercel dashboard
   - Navigate to **Settings** → **Environment Variables**
   - Add:
     - `TWILIO_ACCOUNT_SID`
     - `TWILIO_AUTH_TOKEN`
     - `TWILIO_WHATSAPP_NUMBER`

5. Redeploy to apply environment variables:
   ```bash
   vercel --prod
   ```

### 5. Configure Twilio Webhook

1. After deployment, copy your Vercel URL (e.g., `https://your-app.vercel.app`)

2. Go to Twilio Console → **Messaging** → **Settings** → **WhatsApp Sandbox Settings**

3. Set the webhook URL:
   ```
   https://your-app.vercel.app/webhook
   ```

4. Make sure **HTTP POST** is selected

5. Save the settings

## Testing the Bot

1. **Join the Twilio WhatsApp Sandbox**:
   - Send the join code to the Twilio WhatsApp number (shown in Twilio Console)
   - Example: Send `join <your-code>` to the number

2. **Start chatting**:
   - Send any message to start
   - Or send `menu` to see options

## Usage Examples

### Recording Income
```
You: menu
Bot: [Shows main menu]
You: 1
Bot: What is the amount?
You: 1500.00
Bot: What is the source of this income?
You: Sales
Bot: Please provide a brief description:
You: Product sales for March
Bot: Date of transaction?
You: today
Bot: ✅ Income Recorded Successfully!
```

### Recording Expense
```
You: 2
Bot: What is the amount?
You: 350.50
Bot: What category is this expense?
You: Utilities
...
```

### View Summary
```
You: 4
Bot: 📊 Financial Summary
     Total Income: $1500.00
     Total Expenses: $350.50
     Net Profit: $1149.50
     ...
```

## Bot Commands

- `menu` or `start` - Show main menu
- `cancel` - Cancel current operation
- `help` - Show help information

## Project Structure

```
WA-Chat/
├── api/
│   └── webhook.js          # Vercel serverless function (webhook endpoint)
├── utils/
│   ├── conversationFlow.js # Q&A flow logic and processing
│   ├── sessionManager.js   # User session management
│   └── dataStorage.js      # Data persistence layer
├── data/                   # JSON storage (auto-created)
├── package.json
├── vercel.json            # Vercel configuration
├── .env.example           # Environment variables template
└── .gitignore
```

## Data Storage

Currently uses JSON file-based storage. Each user's transactions are stored in `data/{phone_number}.json`.

### Upgrading to Database (Optional)

For production use, replace `dataStorage.js` with a database adapter:

**Recommended options**:
- **MongoDB** (via MongoDB Atlas)
- **PostgreSQL** (via Supabase or Railway)
- **Firebase Firestore**
- **Vercel Postgres**

Example for MongoDB:
```javascript
// In dataStorage.js
const { MongoClient } = require('mongodb');
const client = new MongoClient(process.env.MONGODB_URI);
// ... implement saveTransaction, getTransactions, etc.
```

## Customization

### Adding New Transaction Types

Edit `utils/conversationFlow.js` and add a new flow:

```javascript
myCustomFlow: {
  steps: [
    {
      question: 'Your question here?',
      field: 'fieldName',
      validator: (input) => /* validation logic */,
      errorMessage: 'Error message'
    },
    // ... more steps
  ]
}
```

### Modifying Categories

Edit the flows in `conversationFlow.js` to add predefined categories or validation.

### Changing Session Timeout

Edit `utils/sessionManager.js`:

```javascript
this.SESSION_TIMEOUT = 60 * 60 * 1000; // 1 hour
```

## Troubleshooting

### Bot doesn't respond
- Check Twilio webhook URL is correct
- Verify environment variables are set in Vercel
- Check Vercel function logs

### Messages delayed
- Twilio sandbox has rate limits
- Upgrade to a Twilio production WhatsApp number for better performance

### Data not saving
- Check file permissions for `data/` directory
- Verify the directory is created (it auto-creates)
- Consider switching to a database for production

## Limitations

- Twilio Sandbox requires users to join with a code
- JSON storage is not suitable for high-volume production
- Sessions are stored in memory (will reset on serverless function cold start)

## Upgrading to Production

1. **Get a Twilio WhatsApp Business Account**
   - Apply for WhatsApp Business API access through Twilio
   - This removes the sandbox join requirement

2. **Use a Database**
   - Replace JSON storage with MongoDB, PostgreSQL, etc.

3. **Add Authentication**
   - Implement user verification
   - Add business/user separation

4. **Add Persistent Sessions**
   - Store sessions in Redis or database

## License

MIT License - feel free to use for your projects!

## Support

For issues or questions:
- Check Twilio documentation: https://www.twilio.com/docs/whatsapp
- Check Vercel documentation: https://vercel.com/docs

---

Built with ❤️ for small businesses
