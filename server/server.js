require('./config/config');

const Telegraf = require('telegraf');
const express = require('express');
const mongodb = require('mongodb');

// var {mongoose} = require('./db/mongoose');
var {Alert} = require('./models/alert');

const app = express();

const BOT_TOKEN = process.env.BOT_TOKEN || '';
const PORT = process.env.PORT;
const URL = process.env.URL;

const bot = new Telegraf(BOT_TOKEN);
bot.catch((err) => {
  console.log('Sorry! Not able to connect to Telegram.');
  return
});

// app.use(bodyParser.json());

if(process.env.NODE_ENV === 'production') {
bot.telegram.setWebhook(`${URL}/bot${BOT_TOKEN}`);
app.use(bot.webhookCallback(`/bot${BOT_TOKEN}`));
} else {
    bot.startPolling();
}
app.get('/', (req, res) => {
  res.send('Hello World!');
});

bot.start((ctx) => ctx.reply('Welcome'));
bot.hears('hi', (ctx) => ctx.reply('Hey there' + ctx.from.id));
//app.post()
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});