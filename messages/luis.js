var restify = require('restify');
var builder = require('botbuilder');
var fs = require("fs");

// Setup Restify Server
var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function () {
 console.log('%s listening to %s', server.name, server.url); 
});

// Create chat connector for communicating with the Bot Framework Service
var connector = new builder.ChatConnector({
  appId: process.env.MICROSOFT_APP_ID,
  appPassword: process.env.MICROSOFT_APP_PASSWORD
});

// Listen for messages from users 
server.post('/api/messages', connector.listen());
// This bot enables users to either make a dinner reservation or order dinner.
var bot = new builder.UniversalBot(connector, function (session) {
  session.send("Hi... I'm a sample bot.");
  console.log(fs)
});

// Add a global LUIS recognizer to the bot by using the endpoint URL of the LUIS app
var model = 'https://westus.api.cognitive.microsoft.com/luis/v2.0/apps/d91b5656-8a4e-46b8-a9c8-9191a56a36c8?subscription-key=6d19866f425d48cea31af49f75b289cf';
var recognizer = new builder.LuisRecognizer(model);
bot.recognizer(recognizer);

//有关数量的问题
bot.dialog('count', function (session, args) {
    // retrieve hotel name from matched entities
    var Entitys = builder.EntityRecognizer.findAllEntities(args.intent.entities, 'numKey');
    var bestScore = 0;
    var tempScore = 0;
    var bestSentence = '';
    var data = '';
  // 创建可读流 
  var readerStream = fs.createReadStream('.\\data\\num.txt');
  // 设置编码为 utf8。
  readerStream.setEncoding('UTF8');
  // 处理流事件 --> data, end, and error
  readerStream.on('data', function(sentence) {
    data += sentence;
  });
  readerStream.on('end',function(){
    var arr = data.split('\n');
    var tempStr = '';
    tempScore = 0;
    for(var i=0;i<arr.length;i++){
      for(var j=0;j< args.intent.entities.length;j++){
        tempStr = args.intent.entities[j].entity.replace(/\s+/g, '');
        if(arr[i].match(tempStr) != null){
          tempScore += 1;
        }
      }
      
      tempScore = tempScore / arr[i].length;
      if (tempScore > bestScore){
        bestScore = tempScore;
        bestSentence = arr[i];
        console.log(tempScore);
      }
    }
    if(bestScore == 0){
     session.send("没有这个问题的答案");
   }else{
     session.send(bestSentence);
   }

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