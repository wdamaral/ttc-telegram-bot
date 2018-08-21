require('./config/config');

const Telegraf = require('telegraf');
const { Extra, Markup } = require('telegraf');
const Composer = require('telegraf/composer');
const session = require('telegraf/session');
const Stage = require('telegraf/stage');
const WizardScene = require('telegraf/scenes/wizard');

const express = require('express');
const mongodb = require('mongodb');

var {mongoose} = require('./db/mongoose');
var {Alert, getAllAlerts} = require('./models/alert');

const app = express();

const BOT_TOKEN = process.env.BOT_TOKEN || '';
const PORT = process.env.PORT;
const URL = process.env.URL;

const bot = new Telegraf(BOT_TOKEN);

var alerts;
var obj = {};

bot.catch((err) => {
  console.log('Sorry! Not able to connect to Telegram.\n'+ err);
  return
});

const alertHandler = new Composer();

alertHandler.hears('📢 Alerts', (ctx) => {
  ctx.reply('📢 TTC Alerts configuration.', Markup
  .keyboard([
      ['📢 New alert', '🗑️ Delete alert', '🔍 List alerts'], // Row1 with 2 buttons
      ['📝 Main menu'] // Row2 with 2 buttons
  ])
  .oneTime()
  .resize()
  .extra()
  );
  return ctx.wizard.next();
});

alertHandler.hears('🔍 List alerts', (ctx) => {
  var userId = ctx.from.id;
  alerts = getAllAlerts(userId);

  alerts.then((myAlerts) => {

    myAlerts.forEach((anAlert) => {
      obj[anAlert.text] = anAlert.id;
    });
    
    const buttons = Object.keys(obj)
      .map(key => Markup.callbackButton(key, obj[key]));
      console.log(buttons);
    ctx.reply('Here they are. Click to remove.', Extra.HTML().markup((m) => m.inlineKeyboard(buttons, {columns: 2})))
    .catch((err) => {
    ctx.reply('An error has occurred while fetching alerts.' + err);
  });

  return ctx.wizard.next();
})
});

alertHandler.hears('📢 New alert', (ctx) => {
  return ctx.reply('Type one filter at a time: Line 1 OR Line 2 OR Pape OR Route 510')
  .then(() => {
      return bot.on('message', (ctx) => {
          var text = ctx.message.text;
          var userId = ctx.message.from.id;
          var alertBody = {
            text,
            userId
          }
          var alert = new Alert(alertBody);
          return alert.save().then(() => {
            ctx.reply('Your alert has been saved.');
            return ctx.scene.leave();
          })
          .catch((e) => {
            ctx.reply('An error has occurred. \n' + e.message);
            return ctx.scene.leave();
          });
        });
      });
});

const superWizard = new WizardScene('super-wizard',
  (ctx) => {
    ctx.reply('Welcome to TTC Alerts.', Markup
    .keyboard([
        ['📢 Alerts', '🕒 Time config'], // Row1 with 2 buttons
        ['☸ Setting', '👥 Share'] // Row2 with 2 buttons
    ])
    .oneTime()
    .resize()
    .extra()
);
    return ctx.wizard.next();
  },
  alertHandler,
  alertHandler,
  (ctx) => {
    ctx.reply('Step 4');
    return ctx.wizard.next();
  },
  (ctx) => {
    ctx.scene.leave();
    return ctx.reply('/start');
  }
);

// bot.hears('📝 Main menu', ({ reply }) => {
//   return reply('Welcome to TTC Alerts.', Markup
//       .keyboard([
//           ['📢 Alerts', '🕒 Time config'], // Row1 with 2 buttons
//           ['☸ Setting', '👥 Share'] // Row2 with 2 buttons
//       ])
//       .oneTime()
//       .resize()
//       .extra()
//   );
// });

// bot.hears('📢 Alerts', ({reply}) => {
//   return reply('📢 TTC Alerts configuration.', Markup
//   .keyboard([
//       ['📢 New alert', '🗑️ Delete alert', '🔍 List alerts'], // Row1 with 2 buttons
//       ['📝 Main menu'] // Row2 with 2 buttons
//   ])
//   .oneTime()
//   .resize()
//   .extra()
//   );
// });

// bot.hears('📢 New alert', (ctx) => {
//     return ctx.reply('Type one filter at a time: Line 1 OR Line 2 OR Pape OR Route 510').then(() => {
//       return bot.on('message', (ctx) => {
//         var text = ctx.message.text;
//         var userId = ctx.message.from.id;
//         var alertBody = {
//           text,
//           userId
//         }
//         var alert = new Alert(alertBody);

//         return alert.save().then(() => {
//           return ctx.reply('Your alert has been saved.').then(() => {
//             return ctx.reply('/start');
//           });
//         })
//         .catch((e) => {
//           return ctx.reply('An error has occurred. \n' + e.message);
//         });
//       })
//     });
// });


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

//SESSION HANDLER

const stage = new Stage([superWizard], { default: 'super-wizard' });
bot.use(session());
bot.use(stage.middleware());


//app.post()
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});