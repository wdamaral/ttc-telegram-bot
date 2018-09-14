
const {
  Extra,
  Markup
} = require('telegraf');

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
    if (step === 1) {
      buttons = Extra.markdown().markup(Markup.inlineKeyboard([
        Markup.callbackButton('>>', '>')
      ], {
        columns: 1
      }));
    } else if (step < 5) {
      buttons = Extra.markdown().markup(Markup.inlineKeyboard([
        Markup.callbackButton('<<', '<'),
        Markup.callbackButton('>>', '>')
      ], {
        columns: 2
      }));
    } else {
      buttons = Extra.markdown().markup(Markup.inlineKeyboard([
        Markup.callbackButton('<<', '<')
      ], {
        columns: 1
      }));
    }
  
    return buttons;
  }

  module.exports = {
    alertsButtons,
    timeFrameButtons,
    stationsButtons,
    helpButtons,
    alertsKeyboard
  }