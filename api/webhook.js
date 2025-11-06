const { MessagingResponse } = require('twilio').twiml;
const { processMessage } = require('../utils/conversationFlow');

/**
 * Vercel Serverless Function - WhatsApp Webhook Handler
 */
module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle OPTIONS request for CORS
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only accept POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Extract message details from Twilio webhook
    const { From, Body } = req.body;

    if (!From || !Body) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    // Process the message and get response
    const responseText = await processMessage(From, Body);

    // Create Twilio response
    const twiml = new MessagingResponse();
    twiml.message(responseText);

    // Send response
    res.setHeader('Content-Type', 'text/xml');
    res.status(200).send(twiml.toString());

  } catch (error) {
    console.error('Error processing webhook:', error);
    
    // Send error message to user
    const twiml = new MessagingResponse();
    twiml.message('Sorry, an error occurred. Please try again or reply "menu" to start over.');
    
    res.setHeader('Content-Type', 'text/xml');
    res.status(200).send(twiml.toString());
  }
};
