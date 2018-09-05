require('./config/config');

var {mongoose} = require('./db/mongoose');

const Telegraf = require('telegraf');
const { Extra, Markup } = require('telegraf');
const Twit = require('twit');
const moment = require('moment');

const session = require('telegraf/session');
const Stage = require('telegraf/stage');
const Scene = require('telegraf/scenes/base');

const express = require('express');

const T = new Twit({
  consumer_key:         process.env.CONSUMER_KEY,
  consumer_secret:      process.env.CONSUMER_SECRET,
  access_token:         process.env.ACCESS_TOKEN,
  access_token_secret:  process.env.ACCESS_TOKEN_SECRET
});

var { setFilterAffects, sendLogMessage } = require('./utils/utils');

var {  
  getAllAlerts,
  deleteAlert,
  addAlert,
  getUsers,
  addDescription
} = require('./services/alert.service');

var {  
  getAllTweets,
  deleteTweet,
  addTweet 
} = require('./services/tweet.service');

const app = express();

const BOT_TOKEN = process.env.BOT_TOKEN || '';
const PORT = process.env.PORT;
const URL = process.env.URL;

const bot = new Telegraf(BOT_TOKEN);
const twitterUserId = process.env.MONITOR_ID;

var stream = T.stream('statuses/filter', { follow: twitterUserId });

stream.on('tweet', async (tweet) => {
  var text = tweet.text;
  var createdAt = tweet.timestamp_ms;
  var tweetId = tweet.id;
  var affects = setFilterAffects(tweet.text);
  var myTweet;
  // console.log(affects);
  //verify if tweet starts with RT or contains @TTCnotices
  
  try {
    myTweet = await addTweet(text, createdAt, tweetId, affects);
    // console.log('My Tweet' + myTweet);
  } catch(err) {
    console.log('error after addTweet: ' + err);
      return bot.telegram.sendMessage(process.env.MY_ID, sendLogMessage(err));
  }
  

  if(myTweet) {
    try {
      var users = await getUsers(myTweet.text);
      console.log('checked users: ' + users);

    } catch (err){
      console.log('Error after checking users: ' + err);
      return bot.telegram.sendMessage(process.env.MY_ID, sendLogMessage(err));
    }
    
    if(!users) {
      return
    }

    var message = 
    `🚫 <strong>TTC</strong> has just informed an issue on the system.
    
    💬 <strong>${myTweet.text.substr(0, myTweet.text.indexOf(':'))}:</strong> ${myTweet.text.substring(myTweet.text.indexOf(':') + 1)}

    🕑 <strong>When:</strong> <i>${moment(myTweet.createdAt, 'x').format('LLL')}</i>`;

    users.forEach(user => {
      // console.log('entrou');
          bot.telegram.sendMessage(user, message, {parse_mode : 'html'}).catch((err) => console.log(err));
    });
  }
});

stream.on('delete', async (tweet) => {
  try {
    await deleteTweet(tweet.id)
  } catch(err) {
    return bot.telegram.sendMessage(process.env.MY_ID, sendLogMessage(err));
  }
});

const alertsButtons = (alerts) => {
  const buttons = alerts
    .map(item => {
        return Markup.callbackButton(`${addDescription(item.text)}`, `delete ${item._id}`);
    });

  // console.log(buttons);
  return Extra.markup(Markup.inlineKeyboard(buttons, { columns: 2 }));
}

const alertsKeyboard = Markup.keyboard([
  ['📢 New alert'],
  ['🗑️ Delete alert', '🔍 List alerts'],
  ['📇 List stations'] // Row1 with 2 buttons
])
.resize()
.extra();

bot.start(async ctx => {
  var name = ctx.update.message.from.first_name;
  await ctx.replyWithHTML(`Welcome <b>${name}</b>.\nWhat do you want to do❓`,alertsKeyboard);
});

const newAlertScene = new Scene('newAlert');

newAlertScene.enter(ctx => {
  ctx.replyWithHTML('<b>Type the station, line or route you want to be alerted.</b>\n<i>Eg. Line 1, Route 34, Victoria Park</i>');
});

newAlertScene.leave(ctx => {
  ctx.reply('What do you want to do❓', alertsKeyboard);
});

newAlertScene.hears([/line (\d+)/gi, /route (\d+)/gi], async ctx => {
  var description = ctx.match[1];
  var userId = ctx.update.message.from.id;
  var alert = await addAlert(userId, description);
  if(!alert) {
    await ctx.reply('👎 An error has occurred. Try again.');
  } else {
    if(alert._id) {
      await ctx.reply('👍 Alert added!');
    } else {
      await ctx.reply(`👎 An error has occurred. Try again.\n${alert.message}`);
    }
  }
    return await ctx.scene.leave();
});

newAlertScene.on('text', async ctx => {
  var description = ctx.update.message.text;
  var userId = ctx.update.message.from.id;
  var alert = await addAlert(userId, description);
  // console.log(alert);
  if(!alert) {
    await ctx.reply('👎 An error has occurred. Try again.');
  } else {
    if(alert._id) {
      await ctx.reply('👍 Alert added!');
    } else {
      await ctx.reply(`👎 An error has occurred. Try again.\n${alert.message}`);
    }
  }
    return await ctx.scene.leave();
})
newAlertScene.on('message', ctx => {
  ctx.replyWithHTML('🔒 This is the pattern you should follow:<b>\nLine 1\nLine 3\nRoute 12\nRoute 510\nFinch\nVaughan Metropolitan Centre</b>');
});

const listAlertScene = new Scene('list');

listAlertScene.enter(async ctx => {
  var userId = ctx.update.message.from.id;
  var alerts = await getAllAlerts(userId);
  
  if(alerts.length) {
    await ctx.replyWithHTML('<b>Here are your alerts</b>\nClick on them to remove.', alertsButtons(alerts));
  } else if(!alerts.message) {
    await ctx.reply('😔 You don\'t have any alerts registered.');
    ctx.scene.leave();
  } else {
    await ctx.reply('👎 An error has occurred. Try again.');
    ctx.scene.leave();
  }
});

bot.action(/delete (.*)/, async ctx => {
  var userId = ctx.chat.id;
  const id = ctx.match[1];
  // console.log(id);
  var res = await deleteAlert(userId, id);
  console.log(res);
  if(!res) {
    ctx.reply('👎 An error has occurred. Try again.');
    
  } else {
    var alerts = await getAllAlerts(userId);
    
    var reply = alertsButtons(alerts);
    if(alerts.length) {
      await ctx.editMessageReplyMarkup(reply.reply_markup);
      await ctx.answerCbQuery('🗑️ Alert removed.');
    } else {
      await ctx.editMessageText('🗑️ All alerts removed.');
    }
  }
});


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