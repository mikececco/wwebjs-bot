// Import the qrcode-terminal module to display QR code in the terminal
const qrcode = require('qrcode-terminal');

// Import the Client and LocalAuth from the whatsapp-web.js module
const { Client, LocalAuth } = require('whatsapp-web.js');

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

// Handle the 'qr' event, which will be triggered when a QR code is required
client.on('qr', qr => {
  // Display the QR code in the terminal
  qrcode.generate(qr, { small: true });
});

// Handle the 'ready' event, which will be triggered when the bot is ready
client.on('ready', () => {
  // Print the message "Client is ready!" in the console
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

function scheduleMessage() {
    const now = new Date();
    console.log(`Current time: ${now.toLocaleTimeString()}`); // Log the current time
  
    const targetTime = new Date(now.getTime() + 1 * 60000); // Set to one minute from now
  
    const timeToWait = targetTime - now;
  
    // Schedule the message
    setTimeout(() => {
      client.sendMessage('393483216205@c.us', 'Good morning! This is your scheduled message.') // Replace 'recipient_number' with the actual number
        .then(() => {
          console.log('Message sent successfully!'); // Log when the message is sent
        })
        .catch(err => {
          console.error('Failed to send message:', err); // Log any errors that occur
        });
      
      // Reschedule for the next minute
      scheduleMessage();
    }, timeToWait);
  }
// Start the bot by calling the initialize() method
client.initialize();
scheduleMessage();
