require('./config/config');

var {
  mongoose
} = require('./db/mongoose');

const Telegraf = require('telegraf');
const {
  Extra,
  Markup
} = require('telegraf');
const Twit = require('twit');
const moment = require('moment');

const session = require('telegraf/session');
const Stage = require('telegraf/stage');
const Scene = require('telegraf/scenes/base');

const express = require('express');

const T = new Twit({
  consumer_key: process.env.CONSUMER_KEY,
  consumer_secret: process.env.CONSUMER_SECRET,
  access_token: process.env.ACCESS_TOKEN,
  access_token_secret: process.env.ACCESS_TOKEN_SECRET
});

var {
  setFilterAffects,
  sendLogMessage,
  createMessage,
  addDescription,
  getMessageStep
} = require('./utils/utils');

var {
  getAllAlerts,
  deleteAlert,
  addAlert,
  getUsers,
  getAlertAffects
} = require('./services/alert.service');

var {
  getLastTweets,
  deleteTweet,
  addTweet
} = require('./services/tweet.service');

var stations = require('./utils/ttc-stations.json');

const app = express();

const BOT_TOKEN = process.env.BOT_TOKEN || '';
const PORT = process.env.PORT;
const URL = process.env.URL;

const bot = new Telegraf(BOT_TOKEN);
const twitterUserId = process.env.MONITOR_ID;

var stream = T.stream('statuses/filter', {
  follow: twitterUserId
});

stream.on('tweet', async (tweet) => {
  var myTweet;
  var text = tweet.text;
  var createdAt = tweet.timestamp_ms;
  var tweetId = tweet.id;
  var affects = setFilterAffects(tweet.text);

  //verify if tweet contains @TTCnotices

  try {
    myTweet = await addTweet(text, createdAt, tweetId, affects);
  } catch (err) {
    return bot.telegram.sendMessage(process.env.MY_ID, sendLogMessage(err));
  }


  if (myTweet) {
    try {
      var users = await getUsers(myTweet.text);

    } catch (err) {
      return bot.telegram.sendMessage(process.env.MY_ID, sendLogMessage(err));
    }

    if (!users) {
      return
    }

    var message = createMessage(myTweet);

    users.forEach(user => {
      bot.telegram.sendMessage(user, message, {
        parse_mode: 'html'
      }).catch((err) => console.log(err));
    });
  }
});

stream.on('delete', async (tweet) => {
  try {
    await deleteTweet(tweet.id)
  } catch (err) {
    return bot.telegram.sendMessage(process.env.MY_ID, sendLogMessage(err));
  }
});

const alertsButtons = (alerts) => {
  const buttons = alerts
    .map(item => {
      return Markup.callbackButton(`${addDescription(item.text)}`, `delete ${item._id}`);
    });

  return Extra.markup(Markup.inlineKeyboard(buttons, {
    columns: 2
  }));
}

const timeFrameButtons = () => {
  return Markup.inlineKeyboard([
    Markup.callbackButton('<2 hours', `lastAlerts 2`),
    Markup.callbackButton('<4 hours', `lastAlerts 4`),
    Markup.callbackButton('<6 hours', `lastAlerts 6`),
    Markup.callbackButton('<8 hours', `lastAlerts 8`)
  ]).extra()
}

const stationsButtons = () => {
  var ttcStations = stations.stations;

  const buttons = ttcStations
    .map(station => {
      return Markup.callbackButton(`${station}`, `alert ${station}`);
    });

  return Extra.markup(Markup.inlineKeyboard(buttons, {
    columns: 2
  }));
}
const alertsKeyboard = Markup.keyboard([
    ['📢 Create alert'],
    ['🔍 Show MY alerts', '🔍 Show TTC alerts'],
    ['🔍 Show TTC stations']
    // ['📇 List stations'] // Row1 with 2 buttons
  ])
  .resize()
  .extra();

const helpButtons = (step) => {
  var buttons;
  if(step === 1) {
    buttons = Extra.markdown().markup(Markup.inlineKeyboard([
      Markup.callbackButton('>>', '>')
    ], {columns: 1}));
  } else if (step < 5) {
    buttons = Extra.markdown().markup(Markup.inlineKeyboard([
      Markup.callbackButton('<<', '<'),
      Markup.callbackButton('>>', '>')
    ], {columns: 2}));
  } else {
    buttons = Extra.markdown().markup(Markup.inlineKeyboard([
      Markup.callbackButton('<<', '<')
    ], {columns: 1}));
  }

  return buttons;
}

const generateLastAlertsMessage = async (ctx, hours) => {
  var userId = ctx.chat.id;
  var affects = await getAlertAffects(userId);
  var alerts = await getLastTweets(affects, hours);

  if (alerts.length) {
    var msg = '';

    alerts.forEach(element => {
      msg = msg + `<strong>Where:</strong> ${element.text}\n<strong>When:</strong> ${moment(element.createdAt, 'x').format('LLL')}\n\n`
    });

    return await ctx.replyWithHTML(`<b>Here are the alerts posted by TTC in the last ${hours}</b>\n${msg}`);
  } else if (!alerts.message) {
    return await ctx.replyWithMarkdown(`😔 Sorry! No alerts have been posted in the last *${hours} hours*.`);
  }
  return await ctx.reply('⚠️ An error has occurred. Try again.');
}

bot.start(async ctx => {
  var name = ctx.update.message.from.first_name;
  await ctx.replyWithHTML(`Welcome <b>${name}</b>.\nWhat do you want me to do❓`, alertsKeyboard);
});

const newAlertScene = new Scene('newAlert');

newAlertScene.enter(ctx => {
  ctx.replyWithMarkdown('*Send me a route, station or subway line you want to be alerted.*\n_Eg. Line 1, Route 34, Victoria Park_');
});

newAlertScene.leave(ctx => {
  ctx.replyWithMarkdown('*What do you want me to do*❓', alertsKeyboard);
});

newAlertScene.hears([/line (\d+.?)/gi, /route (\d+.?)/gi], async ctx => {
  var description = ctx.match[1];

  var userId = ctx.update.message.from.id;
  var alert = await addAlert(userId, description);
  if (!alert) {
    await ctx.reply('👎 An error has occurred. Try again.');
  } else {
    if (alert._id) {
      await ctx.replyWithMarkdown('💾 I saved your alert.\n🔍 I\'ll monitor TTC from now on!');
    } else {
      await ctx.reply(`⚠️ An error has occurred. Try again.\n${alert.message}`);
    }
  }
  return await ctx.scene.leave();
});

newAlertScene.on('text', async ctx => {
  var description = ctx.update.message.text;
  var userId = ctx.update.message.from.id;
  var alert = await addAlert(userId, description);

  if (!alert) {
    await ctx.reply('👎 An error has occurred. Try again.');
  } else {
    if (alert._id) {
      await ctx.replyWithMarkdown('💾 I saved your alert.\n🔍 I\'ll monitor TTC from now on!');
    } else {
      await ctx.reply(`⚠️ An error has occurred. Try again.\n${alert.message}`);
    }
  }
  return await ctx.scene.leave();
})

newAlertScene.on('message', ctx => {
  ctx.replyWithHTML('⚠️ This is the pattern you should follow:<b>\nLine 1\nLine 3\nRoute 12\nRoute 510\nFinch\nVaughan Metropolitan Centre</b>');
});

const listAlertScene = new Scene('list');

listAlertScene.enter(async ctx => {
  var userId = ctx.update.message.from.id;
  var alerts = await getAllAlerts(userId);

  if (alerts.length) {
    await ctx.replyWithHTML('<b>Here are your alerts</b>\nClick on them to remove.', alertsButtons(alerts));
  } else if (!alerts.message) {
    await ctx.reply('😔 You don\'t have any alerts registered.');
    ctx.scene.leave();
  } else {
    await ctx.reply('⚠️ An error has occurred. Try again.');
    ctx.scene.leave();
  }
});

const lastAlertsScene = new Scene('last');

lastAlertsScene.enter(async ctx => {
  return await ctx.replyWithMarkdown('🕖 *Select the time space you want to see the alerts or type it.*', timeFrameButtons());
});

lastAlertsScene.hears(/\d+/, async ctx => {
  var hours = ctx.match[0];

  return generateLastAlertsMessage(ctx, hours);
});

lastAlertsScene.on('message', ctx => {
  var userName = ctx.update.message.from.first_name;
  ctx.replyWithMarkdown(`Sorry *${userName}*, I can only undestand *hours* in numbers. Also, keep in mind that I only store alerts from the *last 48 hours*.`);
});

bot.action(/delete (.*)/, async ctx => {
  var userId = ctx.chat.id;
  const id = ctx.match[1];
  var res = await deleteAlert(userId, id);

  if (!res) {
    ctx.reply('⚠️ An error has occurred. Try again.');

  } else {
    var alerts = await getAllAlerts(userId);

    var reply = alertsButtons(alerts);
    if (alerts.length) {
      await ctx.editMessageReplyMarkup(reply.reply_markup);
      await ctx.answerCbQuery('🗑️ Alert removed.');
    } else {
      await ctx.editMessageText('🗑️ All alerts removed.');
    }
  }
});

bot.action(/lastAlerts (\d+)/, async ctx => {
  var hours = ctx.match[1];
  return generateLastAlertsMessage(ctx, hours);
});

bot.action(/alert ([^\r]*)/, async ctx => {
  const userId = ctx.chat.id;
  var station = ctx.match[1];

  var alert = await addAlert(userId, station);

  if (!alert) {
    await ctx.reply('👎 An error has occurred. Try again.');
  } else {
    if (alert._id) {
      await ctx.replyWithMarkdown('💾 I saved your alert.\n🔍 I\'ll monitor TTC from now on!');
    } else {
      await ctx.reply(`⚠️ An error has occurred. Try again.\n${alert.message}`);
    }
  }
});

if (process.env.NODE_ENV === 'production') {
  bot.telegram.setWebhook(`${URL}/bot${BOT_TOKEN}`);
  app.use(bot.webhookCallback(`/bot${BOT_TOKEN}`));
} else {
  bot.startPolling();
}
app.get('/', (req, res) => {
  res.send('Hello World!');
});

//SESSION HANDLER

const stage = new Stage([newAlertScene, listAlertScene, lastAlertsScene]);
bot.use(session());
bot.use(stage.middleware());

bot.hears('📢 Create alert', Stage.enter('newAlert'));
bot.hears('🔍 Show MY alerts', Stage.enter('list'));
bot.hears('🔍 Show TTC alerts', Stage.enter('last'));
bot.hears('🔍 Show TTC stations', async ctx => {
  await ctx.replyWithHTML('*Here there are all TTC stations. Click on them to add the alert.', stationsButtons());
});

let step = 1;
bot.command('help', async ctx => {
  step = 1;
  var userName = ctx.update.message.from.first_name;
  await ctx.replyWithMarkdown(`All right *${userName}*. Thanks for having me on your telegram.`);
  await ctx.replyWithMarkdown(getMessageStep(step), helpButtons(step));
});

bot.action('<', ctx => {
  step--;
  return ctx.editMessageText(getMessageStep(step), helpButtons(step), {parse_mode: 'Markdown'});
});

bot.action('>', ctx => {
  step++;
  return ctx.editMessageText(getMessageStep(step), helpButtons(step), {parse_mode: 'Markdown'});
});



//app.post()
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});