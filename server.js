const express = require('express');
const bodyParser = require('body-parser');
const { Client, LocalAuth } = require('whatsapp-web.js');

const app = express();
const port = 3000;

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public')); // Serve static files from the public directory

// Create a new instance of the Client
// const client = new Client({
//   authStrategy: new LocalAuth(),
// });

// Create a new instance of the Client with specific configurations
const client = new Client({
    // Use the LocalAuth strategy (store the QR code session locally)
    authStrategy: new LocalAuth(),
    // Puppeteer configuration (the library used by whatsapp-web.js)
    puppeteer: {
      // Run Puppeteer in headless mode (without a GUI)
      headless: true,
      // Additional arguments for Puppeteer
      args: ['--no-sandbox', '--disable-gpu'],
    },
    // Fetch the WhatsApp web version from a remote source
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
  res.send(`
    <form action="/schedule" method="POST">
      <label for="phone">Phone Number:</label>
      <input type="text" id="phone" name="phone" required><br><br>
      
      <label for="message">Message:</label>
      <textarea id="message" name="message" required></textarea><br><br>
      
      <label for="datetime">Select Date and Time:</label>
      <input type="datetime-local" id="datetime" name="datetime" required><br><br>
      
      <input type="submit" value="Schedule Message">
    </form>
  `);
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