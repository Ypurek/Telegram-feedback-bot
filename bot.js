const token = 'TELEGRAM BOT TOKEN';
const tgBotUrl = 'https://api.telegram.org/bot' + token;
const hookUrl = 'GOOGLE APPS SCRIPT WEB SERVICE URL';
const sheetLogId = 'GOOGLE SHEETS FILE ID';
const adminChatId = -1;
const botId = 1;

function doGet(e) {
  return HtmlService.createHtmlOutput('hello');
}

function doPost(e) {
  let content = JSON.parse(e.postData.contents);
  
  // handle admin chat
  if (content.message.chat.id == adminChatId) {
    // handle replies
    if(content.message.reply_to_message != undefined) {
      // any replies
      if(content.message.reply_to_message.from.id != botId) {
        // do nothing
        return HtmlService.createHtmlOutput();
      } 
      // replies to bot
      else {
        let re = /chatId:\S*/;
        let chatId = content.message.reply_to_message.text.match(re)[0].split(':')[1];
        
        let payload = {
          chat_id: chatId,
          text: content.message.text
        }
  
        sendMessage(payload);
      }
    }
    return HtmlService.createHtmlOutput();
  }
  
  // handle /start
  if (content.message.text == '/start') {
    // send response 
    let payload = {
      chat_id: content.message.chat.id,
      text: 'Дякуємо, що написали нам! Ми прочитаємо ваш відгук і відповімо повідомленням в цьому боті️'
    }
  
    sendMessage(payload);
    return HtmlService.createHtmlOutput();
  }
  
  saveMessage(content);
  
  // notify admins
  payload = {
    'chat_id': adminChatId,
    'text': prepareNotification(content)
  }
  sendMessage(payload); 
  
  //return http 200 OK
  return HtmlService.createHtmlOutput();
}

function setWebHook() {
  let response = UrlFetchApp.fetch(tgBotUrl + "/setWebhook?url=" + hookUrl);
  Logger.log('telegram response status is ' + response.getResponseCode());
}

function getWebHook() {
  let response = UrlFetchApp.fetch(tgBotUrl + "/getWebhookInfo");
  if (response.getResponseCode() == 200) {
    let data = JSON.parse(response.getContentText())
    Logger.log('current webhook ur is ' + data.result.url);
  } else {
    Logger.log('telegram response status is ' + response.getResponseCode());
  }
}

function saveMessage(message) {
  let file = SpreadsheetApp.openById(sheetLogId);
  // first tab of the file
  let sheet = file.getSheets()[0];
  // get last row
  let lastRow = sheet.getLastRow() + 1;
  
  sheet.setActiveSelection('A' + lastRow).setValue(Date(message.message.date)); // date
  sheet.setActiveSelection('B' + lastRow).setValue(message.message.chat.id); // chat id
  sheet.setActiveSelection('C' + lastRow).setValue(message.message.from.username); // username
  sheet.setActiveSelection('D' + lastRow).setValue(message.message.text); // message
  sheet.setActiveSelection('E' + lastRow).setValue(JSON.stringify(message));
}

function sendMessage(payload){
  let options = {
    'method' : 'post',
    'contentType': 'application/json',
    'payload': JSON.stringify(payload)
  }
  return UrlFetchApp.fetch(tgBotUrl + "/sendMessage", options);
}

function prepareNotification(content) {
  return "користувач @" + content.message.from.username + "\n" +
         "chatId:" + content.message.chat.id + "\n" +
         "написав:\n" + content.message.text;
}



