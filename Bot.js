const TelegramBot = require('node-telegram-bot-api');
const { exec } = require('child_process');

// Replace 'YOUR_BOT_TOKEN' with your actual bot token
const token = 'YOUR_BOT_TOKEN';
const bot = new TelegramBot(token, { polling: true });

// Authorized user ID (only you are allowed to use the bot)
const authorizedUserId = //INSERT CHAT ID HERE; // Replace with your Telegram user ID

bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;

  const explanation =
    "Welcome to the Nmap Bot!\n\n" +
    "This bot allows you to perform Nmap scans directly from Telegram.\n" +
    "Here's how it works:\n\n" +
    "To perform a scan, use the following syntax:\n" +
    "/scan [IP addresses] [scan type] [additional options]\n\n" +
    "Example: /scan 192.168.0.1,192.168.0.2,192.168.0.3 fast\n" +
    "This will perform a fast scan on the IP addresses 192.168.0.1, 192.168.0.2, and 192.168.0.3\n\n" +
    "Available Scan Types:\n" +
    "/fast - Quick scan (equivalent to Nmap -F)\n" +
    "/advanced - Advanced scan with OS detection, version detection, etc. (equivalent to Nmap -A)\n" +
    "/full - Full port scan and detailed information (equivalent to Nmap -p- -A)\n\n" +
    "Additional Options:\n" +
    "-p [ports] - Specify ports to scan\n" +
    "-sS - TCP SYN scan (equivalent to Nmap -sS)\n" +
    "-sU - UDP scan (equivalent to Nmap -sU)\n" +
    "-O - Enable OS detection (equivalent to Nmap -O)\n\n" +
    "To send a custom Nmap command, use:\n" +
    "/nmap [your Nmap command]\n\n" +
    "Created by Mustafa Alsaadi\n\n" +
    "Disclaimer: This bot is provided for educational and informational purposes only. " +
    "Usage of Nmap and its results must comply with applicable laws and regulations. " +
    "Unauthorized scanning of networks and systems is illegal and unethical.";

  bot.sendMessage(chatId, explanation);
});

bot.onText(/\/scan (.+)/, (msg, match) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;

  //Autherisation 
  if (userId !== authorizedUserId) {
    bot.sendMessage(chatId, 'Unauthorized access denied.');
    return;
  }

  const input = match[1].split(' ');

  if (input.length < 2) {
    bot.sendMessage(chatId, 'Invalid input. Please provide both the IP addresses and the scan type.');
    return;
  }

  const targetIPs = input[0].split(','); 
  const scanType = input[1];

 
  const validScanTypes = ['fast', 'advanced', 'full'];
  if (!validScanTypes.includes(scanType.toLowerCase())) {
    bot.sendMessage(chatId, 'Invalid scan type. Please choose from available options: fast, advanced, full.');
    return;
  }

  const nmapOptions = {
    'fast': '-F',
    'advanced': '-A',
    'full': '-p- -A',
  };

  const additionalOptions = input.slice(2).join(' '); 

  const nmapOption = nmapOptions[scanType.toLowerCase()];
  const fullNmapCommand = `${nmapOption} ${additionalOptions}`;

  bot.sendMessage(chatId, `Initiating Nmap scan for ${targetIPs.join(', ')} (${scanType}) with additional options: ${additionalOptions || 'None'}.`);

  targetIPs.forEach((targetIP) => {
    runNmap(chatId, targetIP, fullNmapCommand, (scanResult) => {
      bot.sendMessage(chatId, `Nmap Scan Results for ${targetIP} (${scanType}):\n${scanResult}`);
    });
  });
});

bot.onText(/\/nmap (.+)/, (msg, match) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;

  
  if (userId !== authorizedUserId) {
    bot.sendMessage(chatId, 'Unauthorized access denied.');
    return;
  }

  const nmapCommand = match[1];

  bot.sendMessage(chatId, `Initiating custom Nmap command: ${nmapCommand}`);

  runNmap(chatId, '', nmapCommand, (scanResult) => {
    bot.sendMessage(chatId, `Nmap Custom Scan Results:\n${scanResult}`);
  });
});


function runNmap(chatId, targetIP, fullNmapCommand, callback) {
  const nmapPath = '/usr/bin/nmap'; // Replace with your Nmap path

  const nmapCommand = `${nmapPath} ${targetIP} ${fullNmapCommand}`;

  const nmapProcess = exec(nmapCommand, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error executing Nmap: ${error}`);
      callback('Nmap scan failed.');
      return;
    }

    const scanResult = `Scan Status:\n${stdout}\n\nErrors:\n${stderr}`;
    callback(scanResult);
  });

 
  nmapProcess.stdout.on('data', (data) => {
    bot.sendMessage(chatId, data.toString());
  });
}
//made by Mustafa Alsaadi
