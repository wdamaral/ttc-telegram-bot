require('./config/config');

const Telegraf = require('telegraf');
const express = require('express');
const mongodb = require('mongodb');
const { Extra, Markup } = require('telegraf');

var {startMenu} = require('./extras');
var {mongoose} = require('./db/mongoose');
var {Alert} = require('./models/alert');

const app = express();

const BOT_TOKEN = process.env.BOT_TOKEN || '';
const PORT = process.env.PORT;
const URL = process.env.URL;

const bot = new Telegraf(BOT_TOKEN);
bot.catch((err) => {
  console.log('Sorry! Not able to connect to Telegram.\n'+err);
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

bot.command('start', ({ reply }) => {
  return reply('Welcome to TTC Alerts.', Markup
      .keyboard([
          ['📢 Alerts', '🕒 Time config'], // Row1 with 2 buttons
          ['☸ Setting', '👥 Share'] // Row2 with 2 buttons
      ])
      .oneTime()
      .resize()
      .extra()
  );
});

bot.hears('📝 Main menu', ({ reply }) => {
  return reply('Welcome to TTC Alerts.', Markup
      .keyboard([
          ['📢 Alerts', '🕒 Time config'], // Row1 with 2 buttons
          ['☸ Setting', '👥 Share'] // Row2 with 2 buttons
      ])
      .oneTime()
      .resize()
      .extra()
  );
});

bot.hears('📢 Alerts', ({reply}) => {
  return reply('📢 TTC Alerts configuration.', Markup
  .keyboard([
      ['📢 New alert', '🗑️ Delete alert', '🔍 List alerts'], // Row1 with 2 buttons
      ['📝 Main menu'] // Row2 with 2 buttons
  ])
  .oneTime()
  .resize()
  .extra()
  );
});

bot.hears('📢 New alert', (ctx) => {
  return ctx.reply('Type one filter at a time: Line 1 OR Line 2 OR Pape OR Route 510').then(
    bot.on('message', (ctx) => {
      var text = ctx.message.text;
      var userId = ctx.message.from.id;
      var alertBody = {
        text,
        userId
      }
      var alert = new Alert(alertBody);

      alert.save().then(() => {
        ctx.reply('Your alert has been saved.').then(() => {
          ctx.reply('📢 New alert');
        });
      }).catch((e) => {
        ctx.reply('An error has ocurred. ' + e).then(() => {
          ctx.reply('📢 New alert');
        });
      });
  })
);
});

//app.post()
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});