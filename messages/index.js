/*-----------------------------------------------------------------------------
This template demonstrates how to use an IntentDialog with a LuisRecognizer to add 
natural language support to a bot. 
For a complete walkthrough of creating this type of bot see the article at
https://aka.ms/abs-node-luis
-----------------------------------------------------------------------------*/
"use strict";
var builder = require("botbuilder");
var botbuilder_azure = require("botbuilder-azure");
//var path = require('path');

var useEmulator = (process.env.NODE_ENV == 'development');

var connector = useEmulator ? new builder.ChatConnector() : new botbuilder_azure.BotServiceConnector({
    appId: process.env['MicrosoftAppId'],
    appPassword: process.env['MicrosoftAppPassword'],
    stateEndpoint: process.env['BotStateEndpoint'],
    openIdMetadata: process.env['BotOpenIdMetadata']
});

// var bot = new builder.UniversalBot(connector);
var bot = new builder.UniversalBot(connector, function (session) {
  session.send("啥是"+session.message.text);
    session.send('count question');
    session.send(__dirname);
    session.send(process.cwd());
});
//bot.localePath(path.join(__dirname, './locale'));

// Make sure you add code to validate these fields
// var luisAppId = process.env.LuisAppId;
// var luisAPIKey = process.env.LuisAPIKey;
// var luisAPIHostName = process.env.LuisAPIHostName || 'westus.api.cognitive.microsoft.com';

// const LuisModelUrl = 'https://' + luisAPIHostName + '/luis/v1/application?id=' + luisAppId + '&subscription-key=' + luisAPIKey;

// // Main dialog with LUIS
// var recognizer = new builder.LuisRecognizer(LuisModelUrl);
// var intents = new builder.IntentDialog({ recognizers: [recognizer] })
/*
.matches('<yourIntent>')... See details at http://docs.botframework.com/builder/node/guides/understanding-natural-language/
*/
// .onDefault((session) => {
//     session.send('Sorry, I did not understand \'%s\'.', session.message.text);
// });
var model = 'https://westus.api.cognitive.microsoft.com/luis/v2.0/apps/d91b5656-8a4e-46b8-a9c8-9191a56a36c8?subscription-key=6d19866f425d48cea31af49f75b289cf';
var recognizer = new builder.LuisRecognizer(model);
bot.recognizer(recognizer);


//有关数量的问题
bot.dialog('count', function (session, args) {
    // retrieve hotel name from matched entities
    console.log('count question');
    console.log(__dirname);
    console.log(process.cwd());
    var Entitys = builder.EntityRecognizer.findAllEntities(args.intent.entities, 'numKey');
    var bestScore = 0;
    var tempScore = 0;
    var bestSentence = '';
    var data = '';
  // 创建可读流 
  var readerStream = fs.createReadStream(path.join(__dirname,'./data/num.txt'));
  // 设置编码为 utf8。
  readerStream.setEncoding('UTF8');
  // 处理流事件 --> data, end, and error
  readerStream.on('data', function(sentence) {
    data += sentence;
    console.log(data);
  });
  readerStream.on('end',function(){
    session.send('read the file already');
    // var arr = data.split('\n');
    // var tempStr = '';
    // tempScore = 0;
    // for(var i=0;i<arr.length;i++){
    //   for(var j=0;j< args.intent.entities.length;j++){
    //     tempStr = args.intent.entities[j].entity.replace(/\s+/g, '');
    //     if(arr[i].match(tempStr) != null){
    //       tempScore += 1;
    //     }
    //   }
      
    //   tempScore = tempScore / arr[i].length;
    //   if (tempScore > bestScore){
    //     bestScore = tempScore;
    //     bestSentence = arr[i];
    //     console.log(tempScore);
    //   }
    // }
    if(bestScore == 0){
     session.send("没有这个问题的答案");
   }else{
     session.send(bestSentence);
   }
 });

  readerStream.on("close", function() {
      console.log("文件被关闭。");
  });
  readerStream.on("error", function() {
      console.log("读取文件失败。");
  });
  session.endDialog();
}).triggerAction({
  matches: 'count'
});

//领导联系方式的问题
bot.dialog('leadTelEm', function (session, args) {
    // retrieve hotel name from matched entities
  var postEntitys = builder.EntityRecognizer.findAllEntities(args.intent.entities, 'post');
  var academicEntitys = builder.EntityRecognizer.findAllEntities(args.intent.entities, 'academic');
  var string = '';
  var academicStr = '';
  var postStr = '';
  fs.readFile('./data/人员数据总.csv', function (err, data) {
      var table = new Array();
      if (err) {
          console.log(err.stack);
          return;
      }
      //根据csv文件，进行匹配
      ConvertToTable(data, function (table) {
          console.log(academicEntitys[0].resolution)
          for(var i=0;i<table.length;i++){
            academicStr = academicEntitys[0].entity.replace(/\s+/g, '');
            postStr = postEntitys[0].entity.replace(/\s+/g, '');
            //console.log(table[i][1].match(academicStr));
            // console.log(table[i][0]);
            // console.log(table[i][1]);
            if (table[i][1] == academicStr && table[i][2] == postStr)
            {
              if(table[i][3] != 'None' && table[i][4] != 'None'){
                string = table[i][0] + "是" + table[i][1] + table[i][2] + ",电话是" + table[i][3] + ",邮箱是" + table[i][4];
              }
              else if(table[i][3] != 'None' && table[i][4] == 'None'){
                string = table[i][0] + "是" + table[i][1] + table[i][2] + ",电话是" + table[i][3];
              }
              else if(table[i][3] == 'None' && table[i][4] != 'None'){
                string = table[i][0] + "是" + table[i][1] + table[i][2] + ",邮箱是" + table[i][4];
              }              
              else{
                string = table[i][0] + "是" + table[i][1] + table[i][2] + ",官网没有他的联系方式";
              }
              session.send(string);
            }
          }
      })
  }); 

  session.endDialog();
}).triggerAction({
  matches: 'leadTelEm'
});


//领导姓名问题
bot.dialog('leaderName', function (session, args) {
    // retrieve hotel name from matched entities
  var postEntitys = builder.EntityRecognizer.findAllEntities(args.intent.entities, 'post');
  var academicEntitys = builder.EntityRecognizer.findAllEntities(args.intent.entities, 'academic');
  var string = '';
  var academicStr = '';
  var postStr = '';
  fs.readFile('./data/人员数据总.csv', function (err, data) {
      var table = new Array();
      if (err) {
          console.log(err.stack);
          return;
      }
      //根据csv文件，进行匹配
       ConvertToTable(data, function (table) {
          for(var i=0;i<table.length;i++){
            console.log(academicEntitys);
            console.log(academicEntitys[0].resolution.values[0]);
            academicStr = academicEntitys[0].resolution.values[0].replace(/\s+/g, '');
            postStr = postEntitys[0].entity.replace(/\s+/g, '');
            //console.log(table[i][1].match(academicStr));
            // console.log(table[i][0]);
            // console.log(table[i][1]);
            if (table[i][1] == academicStr && table[i][2] == postStr)
            {
              if(table[i][0] != 'None'){
                string = table[i][1] + "的" + table[i][2] + "是" + table[i][0];
              }
              else{
                string = table[i][1] + "的" + table[i][2] + ",官网没有他的姓名信息";
              }
              session.send(string);
            }
          }
      })
  }); 

  session.endDialog();
}).triggerAction({
  matches: 'leaderName'
});


function ConvertToTable(data, callBack) {
    data = data.toString();
    var table = new Array();
    var rows = new Array();
    rows = data.split("\n");
    for (var i = 0; i < rows.length; i++) {
        table.push(rows[i].split(","));
    }
    callBack(table);
}

if (useEmulator) {
    var restify = require('restify');
    var server = restify.createServer();
    server.listen(3978, function() {
        console.log('test bot endpont at http://localhost:3978/api/messages');
    });
    server.post('/api/messages', connector.listen());    
} else {
    module.exports = { default: connector.listen() }
}

