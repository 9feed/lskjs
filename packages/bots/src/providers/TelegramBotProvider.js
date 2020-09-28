import Telegraf from 'telegraf';
import BotProvider from './BotProvider';
// https://telegraf.js.org/#/

export default class TelegramBotProvider extends BotProvider {
  name = 'TelegramBotProvider';
  Telegraf = Telegraf;
  async init() {
    await super.init();
    if (!this.config.token) throw 'TelegramBotProvider !config.token';
    this.client = new Telegraf(this.config.token);
  }
  async run() {
    await super.run();
    if (!this.client) return;
    await this.client.launch();
    await this.client.startPolling();
  }
}
