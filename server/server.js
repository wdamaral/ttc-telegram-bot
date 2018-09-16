require('./config/config');

var { mongoose } = require('./db/mongoose');

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

var {
  addUser,
  getUser,
  deleteUsers
} = require('./services/user.service');

var {
  alertsButtons,
  timeFrameButtons,
  stationsButtons,
  helpButtons,
  alertsKeyboard
} = require('./utils/buttons');


const app = express();

const BOT_TOKEN = process.env.BOT_TOKEN || '';
const PORT = process.env.PORT;
const URL = process.env.URL;

const bot = new Telegraf(BOT_TOKEN);
const twitterUserId = process.env.MONITOR_ID;

var stream = T.stream('statuses/filter', {
  follow: twitterUserId
});

bot.use(session());


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

const generateLastAlertsMessage = async (ctx, hours) => {
  var userId = ctx.session.user._id;;
  var affects = await getAlertAffects(userId);
  var alerts = await getLastTweets(affects, hours);
  
  if (alerts.length) {
    var msg = '';

    alerts.forEach(element => {
      msg = msg + `<strong>Where:</strong> ${element.text}\n<strong>When:</strong> ${moment(element.createdAt, 'x').format('LLL')}\n\n`
    });

      await ctx.replyWithHTML(`<b>Here are the alerts posted by TTC in the last ${hours} hours.</b>\n${msg}`);
  } else if (!alerts.message) {
      await ctx.replyWithMarkdown(`😔 Sorry! No alerts have been posted in the last *${hours} hours*.`);
  } else {
    return await ctx.reply('⚠️ An error has occurred. Try again.');
  }
  return await ctx.scene.leave();
}

const getMe = async (ctx) => {
  var userId = ctx.update.message.from.id;
  ctx.session.user = await getUser(userId);
  // await console.log(ctx.session);
  
  if(!ctx.session.user) {
    try {
      ctx.session.user = await addUser(userId);
    } catch (e) {
      return await ctx.reply(`⚠️ An error has occurred. Try again typing /start.\n${alert.message}`);
    }
  }
  return true;
}

bot.start(async ctx => {
  var name = ctx.update.message.from.first_name;
  await getMe(ctx);
  await ctx.replyWithHTML(`Welcome <b>${name}</b>.\nWhat do you want me to do❓`, alertsKeyboard);
});

const newAlertScene = new Scene('newAlert');

newAlertScene.enter(async ctx => {
  await getMe(ctx);
  return await ctx.replyWithMarkdown('*Send me a route, station or subway line you want to be alerted.*\n_Eg. Line 1, Route 34, Victoria Park_');
});

newAlertScene.leave(ctx => {
  ctx.replyWithMarkdown('*What do you want me to do*❓', alertsKeyboard);
});

newAlertScene.hears([/line (\d+.?)/gi, /route (\d+.?)/gi], async ctx => {
  // await getMe(ctx);
  var description = ctx.match[1];
  var userId = ctx.session.user._id;
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
  // await getMe(ctx);
  var description = ctx.update.message.text;
  var userId = ctx.session.user._id;;
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
  await getMe(ctx);
  var userId = ctx.session.user._id;;
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
  await getMe(ctx);
  return await ctx.replyWithMarkdown('🕖 *Select the time space you want to see the alerts or type it.*', timeFrameButtons());
});

lastAlertsScene.hears(/\d+/, async ctx => {
  
  var hours = ctx.match[0];

  generateLastAlertsMessage(ctx, hours);
  return ctx.scene.leave();
});

lastAlertsScene.action(/lastAlerts (\d+)/, async ctx => {
  var hours = ctx.match[1];
  return generateLastAlertsMessage(ctx, hours);
});

lastAlertsScene.on('message', ctx => {
  var userName = ctx.update.message.from.first_name;
  return ctx.replyWithMarkdown(`Sorry *${userName}*, I can only undestand *hours* in numbers. Also, keep in mind that I only store alerts from the *last 48 hours*.`);
});

lastAlertsScene.leave(ctx => {
  ctx.replyWithMarkdown('*What do you want me to do*❓', alertsKeyboard);
});

bot.action(/delete (.*)/, async ctx => {
  var userId = ctx.session.user._id;
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

bot.action(/alert ([^\r]*)/, async ctx => {
  const userId = ctx.session.user._id;;
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
bot.use(stage.middleware());

bot.hears('📢 Create alert', Stage.enter('newAlert'));
bot.hears('🔍 Show MY alerts', Stage.enter('list'));
bot.hears('🔍 Show TTC alerts', Stage.enter('last'));
bot.hears('🔍 Show TTC stations', async ctx => {
  return await ctx.replyWithMarkdown('*Here there are all TTC stations. Click on them to add the alert.', stationsButtons());
});
bot.command('help', async ctx => {
  ctx.session.step = 1;
  let step = ctx.session.step;
  var userName = ctx.update.message.from.first_name;
  await ctx.replyWithMarkdown(`All right *${userName}*. Thanks for having me on your telegram.`);
  return await ctx.replyWithMarkdown(getMessageStep(step), helpButtons(step));
});

bot.action('<', ctx => {
  ctx.session.step--;
  let step = ctx.session.step;
  return ctx.editMessageText(getMessageStep(step), helpButtons(step), {
    parse_mode: 'Markdown'
  });
});

bot.action('>', ctx => {
  ctx.session.step++;
  let step = ctx.session.step;
  return ctx.editMessageText(getMessageStep(step), helpButtons(step), {
    parse_mode: 'Markdown'
  });
});



//app.post()
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});