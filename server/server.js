require('./config/config');

const Telegraf = require('telegraf');
const { Extra, Markup } = require('telegraf');

const session = require('telegraf/session');
const Stage = require('telegraf/stage');
const Scene = require('telegraf/scenes/base');

const express = require('express');
const mongodb = require('mongodb');

var {mongoose} = require('./db/mongoose');
var { 
  Alert, 
  getAllAlerts,
  deleteAlert,
  addAlert 
} = require('./models/alert');

const app = express();

const BOT_TOKEN = process.env.BOT_TOKEN || '';
const PORT = process.env.PORT;
const URL = process.env.URL;

const bot = new Telegraf(BOT_TOKEN);

bot.start(async ctx => {
  var name = ctx.update.message.from.first_name;
  await ctx.reply(`Welcome ${name}.`);
  await ctx.reply('What do you want to do?', alertsKeyboard);
});

const alertsButtons = (alerts) => {
  const buttons = alerts.map(item => {
      return Markup.callbackButton(`${item.text}`, `delete ${item._id}`);
  });

  // console.log(buttons);
  return Extra.markup(Markup.inlineKeyboard(buttons, { columns: 2 }));
}

const alertsKeyboard = Markup.keyboard([
  ['📢 New alert', '🗑️ Delete alert', '🔍 List alerts'], // Row1 with 2 buttons
])
.resize()
.extra();

const newAlertScene = new Scene('newAlert');

newAlertScene.enter(ctx => {
  ctx.reply('Type the number of line or route you want to be alerted.\nEg. Line 1, Route 34');
});

newAlertScene.leave(ctx => {
  ctx.reply('What do you want to do?', alertsKeyboard);
});

newAlertScene.hears([/line (\d+)/gi, /route (\d+)/gi], async ctx => {
  var description = ctx.update.message.text;
  var userId = ctx.update.message.from.id;
  var alert = await addAlert(description, userId).catch((e) => e.message);
  if(alert._id) {
    await ctx.reply('Alert added!');
  } else {
    await ctx.reply(`An error has occurred. Try again.\n${alert}`);
  }
    return await ctx.scene.leave();
    // console.log('left');
});

newAlertScene.on('message', ctx => {
  ctx.reply('This is the pattern you should follow:\nLine 1\nLine 3\nRoute 12\nRoute 510');
});

const listAlertScene = new Scene('list');

listAlertScene.enter(async ctx => {
  var userId = ctx.update.message.from.id;
  var alerts = await getAllAlerts(userId);
  // console.log(alerts);
  if(alerts.length) {
    await ctx.reply('Here are your alerts\nClick on them to remove.', alertsButtons(alerts));
  } else {
    await ctx.reply('You don\'t have any alerts registered.');
    ctx.scene.leave();
  }
});

bot.action(/delete (.*)/, async ctx => {
  var userId = ctx.chat.id;
  const id = ctx.match[1];
  // console.log(id);
  var res = await deleteAlert(id);
  if(res.n === 1) {
    var alerts = await getAllAlerts(userId);
    var reply = alertsButtons(alerts);
    if(alerts.length) {
      await ctx.editMessageReplyMarkup(reply.reply_markup);
      await ctx.answerCbQuery('Alert removed.');
    } else {
      await ctx.editMessageText('All alerts removed.');
    }

  } else {
    ctx.reply('An error has occurred. Try again. /start');
    // ctx.scene.leave();
  }
})

// listAlertScene.leave(ctx => {
//   ctx.reply('What do you want to do?', alertsKeyboard);
// });

if(process.env.NODE_ENV === 'production') {
bot.telegram.setWebhook(`${URL}/bot${BOT_TOKEN}`);
app.use(bot.webhookCallback(`/bot${BOT_TOKEN}`));
} else {
    bot.startPolling();
}
app.get('/', (req, res) => {
  res.send('Hello World!');
});

//SESSION HANDLER

const stage = new Stage([newAlertScene, listAlertScene]);
bot.use(session());
bot.use(stage.middleware());

bot.hears('📢 New alert', Stage.enter('newAlert'));
bot.hears(['🗑️ Delete alert', '🔍 List alerts'], Stage.enter('list'));

//app.post()
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});