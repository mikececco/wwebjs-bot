const express = require('express');
const bodyParser = require('body-parser');
const { Client, LocalAuth } = require('whatsapp-web.js');
const path = require('path');
const WebSocket = require('ws');
const qrcode = require('qrcode');
const qrcodeTerminal = require('qrcode-terminal');

const app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));
// Find Chromium executable path
const findChromiumExecutable = () => {
    return require('puppeteer').executablePath();
};

const client = new Client({
    authStrategy: new LocalAuth({
        dataPath: path.join('/tmp', '.wwebjs_auth'),
    }),
    puppeteer: {
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu',
            '--no-first-run',
            '--no-zygote',
            '--single-process'
        ]
    }
});

// Add debugging information
console.log('Chrome path:', '/usr/bin/chromium-browser');
console.log('Current directory:', process.cwd());
try {
    console.log('Directory contents of /usr/bin:', require('fs').readdirSync('/usr/bin').filter(file => file.includes('chrom')));
} catch (error) {
    console.error('Error reading directory:', error);
}

// Add error handling
client.on('auth_failure', msg => {
    console.error('Authentication failure:', msg);
});

client.on('disconnected', (reason) => {
    console.log('Client was disconnected:', reason);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
// Initialize WebSocket server
const wss = new WebSocket.Server({ noServer: true });

const server = app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});

// Handle WebSocket upgrade
server.on('upgrade', (request, socket, head) => {
    wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
    });
});

// Initialize WhatsApp client
client.initialize();

// QR Code event
client.on('qr', async (qr) => {
    // Display QR in terminal
    qrcodeTerminal.generate(qr, { small: true });
    
    try {
        // Generate QR code as base64
        const qrImage = await qrcode.toDataURL(qr);
        
        // Send to all connected WebSocket clients
        wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({
                    type: 'qr',
                    qr: qrImage.split(',')[1] // Remove the data URL prefix
                }));
            }
        });
    } catch (err) {
        console.error('QR Code generation error:', err);
    }
});

// Client Ready event
client.on('ready', () => {
    console.log('Client is ready!');
});

// Handle the 'message' event, which will be triggered when a message is received
client.on('message', message => {
    // Check if the received message is "!ping"
    if (message.body === '!ping') {
      // If true, send the reply "pong" to the sender
      console.log(message.from);
      
      client.sendMessage(message.from, 'pong');
    }
  });

// Authentication event
client.on('authenticated', () => {
    console.log('Client is authenticated!');
});

// Rest of your code (schedule message function and routes) remains the same...

// Schedule message function
function scheduleMessage(phoneNumber, message, dateTime) {
  const now = new Date();
  const timeToWait = dateTime - now;

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
  client.sendMessage(phone, message)

  scheduleMessage(phone, message, dateTime);
  res.send('Message scheduled successfully!');
});