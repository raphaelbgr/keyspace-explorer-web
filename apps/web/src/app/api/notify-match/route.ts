import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withRateLimit } from '../../../lib/middleware/rateLimit';
import { handleApiError } from '../../../lib/middleware/errorHandler';

const notifyMatchSchema = z.object({
  privateKey: z.string().min(1),
  address: z.string().min(1),
  balance: z.number().positive(),
  addressType: z.string().optional(),
});

// Telegram configuration
const TELEGRAM_URL = "https://api.telegram.org/bot7688830724:AAHnBdSNgwnjNKyq62f_ZjlhQiNFHzm0SIU/sendMessage";
const TELEGRAM_ID = "27196478";

// PostgreSQL configuration
const PG_HOST = '192.168.7.101';
const PG_USER = 'postgres';
const PG_PASSWORD = 'tjq5uxt3';
const PG_DATABASE = 'cryptodb';

// Async function to send Telegram notification with retry
async function sendTelegramNotification(message: string, maxRetries: number = 5): Promise<boolean> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(TELEGRAM_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: TELEGRAM_ID,
          text: message,
          parse_mode: 'HTML',
        }),
      });

      if (response.ok) {
        console.log(`Telegram notification sent successfully on attempt ${attempt}`);
        return true;
      } else {
        console.warn(`Telegram notification failed on attempt ${attempt}: ${response.status}`);
      }
    } catch (error) {
      console.error(`Telegram notification error on attempt ${attempt}:`, error);
    }

    // Wait before retry (exponential backoff)
    if (attempt < maxRetries) {
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
    }
  }

  console.error('Failed to send Telegram notification after all retries');
  return false;
}

// Async function to store match in PostgreSQL
async function storeMatchInDatabase(privateKey: string, address: string, balance: number): Promise<boolean> {
  try {
    const { Client } = await import('pg');
    const client = new Client({
      host: PG_HOST,
      user: PG_USER,
      password: PG_PASSWORD,
      database: PG_DATABASE,
    });

    await client.connect();

    const query = `
      INSERT INTO matches (address, private_key_hex, token, balance, found_at)
      VALUES ($1, $2, $3, $4, NOW())
      ON CONFLICT (address) DO NOTHING
    `;

    await client.query(query, [address, privateKey, 'BTC', balance]);
    await client.end();

    console.log(`Match stored in database: ${address}`);
    return true;
  } catch (error) {
    console.error('Database error:', error);
    return false;
  }
}

// Async function to append to local file
async function appendToFile(privateKey: string, address: string, balance: number): Promise<void> {
  try {
    const fs = await import('fs/promises');
    const path = await import('path');
    
    const logEntry = `${new Date().toISOString()} - Private Key: ${privateKey} - Address: ${address} - Balance: ${balance} BTC\n`;
    const logPath = path.join(process.cwd(), 'matches.log');
    
    await fs.appendFile(logPath, logEntry);
    console.log(`Match logged to file: ${address}`);
  } catch (error) {
    console.error('File logging error:', error);
  }
}

export async function POST(request: NextRequest) {
  return withRateLimit(async () => {
    try {
      const body = await request.json();
      const { privateKey, address, balance, addressType } = notifyMatchSchema.parse(body);

      // Create notification message
      const message = `
🚨 <b>BITCOIN BALANCE FOUND!</b> 🚨

💰 <b>Balance:</b> ${balance} BTC
🔑 <b>Private Key:</b> <code>${privateKey}</code>
📍 <b>Address:</b> <code>${address}</code>
📝 <b>Type:</b> ${addressType || 'Unknown'}
⏰ <b>Found:</b> ${new Date().toLocaleString()}

🎯 <b>Action Required:</b> Check this address immediately!
      `.trim();

      // Execute all operations asynchronously
      Promise.all([
        sendTelegramNotification(message),
        storeMatchInDatabase(privateKey, address, balance),
        appendToFile(privateKey, address, balance)
      ]).catch(error => {
        console.error('Error in async operations:', error);
      });

      return NextResponse.json({ 
        success: true, 
        message: 'Notification sent and match stored',
        address,
        balance 
      });

    } catch (error) {
      return handleApiError(error);
    }
  });
} 