const express = require('express');
const bodyParser = require('body-parser');
const { Client, LocalAuth } = require('whatsapp-web.js');
const path = require('path');

const app = express();
const port = 3000;

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public')); // Serve static files from the public directory

// Create a new instance of the Client with specific configurations
const client = new Client({
  authStrategy: new LocalAuth({
    dataPath: path.join('/tmp', '.wwebjs_auth'), // Use /tmp for session storage
  }),
  puppeteer: {
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-gpu',
      '--disable-dev-shm-usage', // Overcome limited resource problems
      '--disable-setuid-sandbox',
      '--disable-extensions',
      '--disable-infobars',
      '--window-size=1280,800',
    ],
  },
  webVersionCache: { type: 'remote', remotePath: 'https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2412.54.html' },
});

// Initialize the WhatsApp client
client.initialize();

// Schedule message function
function scheduleMessage(phoneNumber, message, dateTime) {
  const now = new Date();
  const timeToWait = dateTime - now;

  console.log(dateTime);
  

  if (timeToWait > 0) {
    setTimeout(() => {
      client.sendMessage(phoneNumber, message)
        .then(() => {
          console.log('Message sent successfully!');
        })
        .catch(err => {
          console.error('Failed to send message:', err);
        });
    }, timeToWait);
  } else {
    console.log('Selected time is in the past. Please select a future time.');
  }
}

// Serve the form at the root path
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html'); // Serve the index.html file
  });

// Handle form submission
app.post('/schedule', (req, res) => {
  const { phone, message, datetime } = req.body;
  const dateTime = new Date(datetime);

  scheduleMessage(phone, message, dateTime);
  res.send('Message scheduled successfully!');
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});