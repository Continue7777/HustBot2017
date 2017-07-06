/*-----------------------------------------------------------------------------
This template demonstrates how to use an IntentDialog with a LuisRecognizer to add 
natural language support to a bot. 
For a complete walkthrough of creating this type of bot see the article at
https://aka.ms/abs-node-luis
-----------------------------------------------------------------------------*/
"use strict";
var builder = require("botbuilder");
var botbuilder_azure = require("botbuilder-azure");
var fs = require("fs");
var path = require("path");
var globalAcademic = '';
var globalPost = '';


var useEmulator = (process.env.NODE_ENV == 'development');

var connector = useEmulator ? new builder.ChatConnector() : new botbuilder_azure.BotServiceConnector({
    appId: process.env['MicrosoftAppId'],
    appPassword: process.env['MicrosoftAppPassword'],
    stateEndpoint: process.env['BotStateEndpoint'],
    openIdMetadata: process.env['BotOpenIdMetadata']
});

// This bot enables users to either make a dinner reservation or order dinner.
var bot = new builder.UniversalBot(connector, function (session) {

  session.send('hello');

  //获取全局变量，为了上下文。

  globalAcademic = null;
  globalPost = null;
  globalBossNum = 0;
});

var model = 'https://westus.api.cognitive.microsoft.com/luis/v2.0/apps/d91b5656-8a4e-46b8-a9c8-9191a56a36c8?subscription-key=6d19866f425d48cea31af49f75b289cf';
var recognizer = new builder.LuisRecognizer(model);
bot.recognizer(recognizer);


var globalAcademic = null;
var globalPost = null;
var globalBossNum = 0;

//有关数量的问题
bot.dialog('count', function (session, args) {
    // retrieve hotel name from matched entities
    var numKeyEntitys = builder.EntityRecognizer.findAllEntities(args.intent.entities, 'numKey');
    var academicEntitys = builder.EntityRecognizer.findAllEntities(args.intent.entities, 'academic');
    var bestScore = 0;
    var tempScore = 0;
    var bestSentence = '';
    var data = '';
    var tempStr = ''

    var postEntitys = builder.EntityRecognizer.findAllEntities(args.intent.entities, 'post');
    var academicEntitys = builder.EntityRecognizer.findAllEntities(args.intent.entities, 'academic');
  //获取全局变量，为了上下文。
  if(academicEntitys.length!=0){
    globalAcademic = null;
}
if(postEntitys.length!=0){
    globalPost = null;
}
globalBossNum = 0;
    //如果不是问的学校有关的信息，返回学院的官网
    if(academicEntitys.length ==0)
    {
        // 创建可读流 
        var readerStream = fs.createReadStream(path.join(__dirname,'./data/num.txt'));
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
            for(var j=0;j< numKeyEntitys.length;j++){
              tempStr = numKeyEntitys[j].entity.replace(/\s+/g, '');
              if(arr[i].match(tempStr) != null){
                tempScore += 1;
            }
        }
        tempScore = tempScore / arr[i].length;
        if (tempScore > bestScore){
          bestScore = tempScore;
          bestSentence = arr[i];
      }
  }
  if(bestScore == 0){
      session.send("这个关于数量的问题没有答案");
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
    }
    else{
      tempStr = '由于本Bot没有统计到各个学院的数量信息，下面给出您想了解学院的官网'+'\n';
      //获取官网列表
      var table = new Array();
      fs.readFile(path.join(__dirname,'./data/hust-websites.csv'), function (err, data) {
        if (err) {
            console.log(err.stack);
            return;
        }
        //根据csv文件，进行匹配
        ConvertToTable(data, function (table) {
          for(var i=0;i<academicEntitys.length;i++){
            tempStr += academicEntitys[i].resolution.values[0].replace(/\s+/g, '') + "的官网是：";
            for(var j=0;j<table.length;j++){
              if(academicEntitys[i].resolution.values[0].replace(/\s+/g, '') == table[j][0]){
                tempStr += table[j][1];
            }
        }
    }
    session.send(tempStr);
}); 
    });
  }

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
    globalBossNum = 0;
  //获取全局变量，为了上下文。
  if(academicEntitys.length!=0){
    globalAcademic = academicEntitys;
}
if(postEntitys.length!=0){
    globalPost = postEntitys;
}

if( academicEntitys.length == 0 && globalAcademic != null){
    academicEntitys = globalAcademic;
}
if(postEntitys.length==0 && globalPost != null){
    postEntitys = globalPost;
}


fs.readFile(path.join(__dirname,'./data/人员数据总.csv'), function (err, data) {
  var table = new Array();
  if (err) {
      console.log(err.stack);
      return;
  }
      //根据csv文件，进行匹配
      ConvertToTable(data, function (table) {
          if( academicEntitys.length != 0 && postEntitys.length!=0){
            academicStr = academicEntitys[0].resolution.values[0].replace(/\s+/g, '');
            postStr = postEntitys[0].resolution.values[0].replace(/\s+/g, '');
            for(var i=0;i<table.length;i++){
              for(var j=0;j<table[i][2].split('、').length;j++){
                if (table[i][1] == academicStr && table[i][2].split('、')[j] == postStr){
                  if(table[i][3] != 'None' && table[i][4] != 'None'){
                    string += table[i][0] + " " + table[i][1] + table[i][2] + ",电话是" + table[i][3] + ",邮箱是" + table[i][4];
                }
                else if(table[i][3] != 'None' && table[i][4] == 'None'){
                    string += table[i][0] + " " + table[i][1] + table[i][2] + ",电话是" + table[i][3];
                }
                else if(table[i][3] == 'None' && table[i][4] != 'None'){
                    string += table[i][0] + " " + table[i][1] + table[i][2] + ",邮箱是" + table[i][4];
                }              
                else{
                    string += table[i][0] + " " + table[i][1] + table[i][2] + ",官网没有他的联系方式";
                }
            }
            else if(table[i][1] == '学校' && table[i][2].split('、')[j] == postStr){
             if(table[i][3] != 'None' && table[i][4] != 'None'){
                string += table[i][0] + " " + table[i][1] + table[i][2] + ",电话是" + table[i][3] + ",邮箱是" + table[i][4];
            }
            else if(table[i][3] != 'None' && table[i][4] == 'None'){
                string += table[i][0] + " " + table[i][1] + table[i][2] + ",电话是" + table[i][3];
            }
            else if(table[i][3] == 'None' && table[i][4] != 'None'){
                string += table[i][0] + " " + table[i][1] + table[i][2] + ",邮箱是" + table[i][4];
            }              
            else{
                string += table[i][0] + " " + table[i][1] + table[i][2] + ",官网没有他的联系方式";
            }
        }
    }
}
if(string == ''){
  session.send("本Bot在官网没有找到" + academicStr +"这个职务的信息");
}
else{
  session.send(string);
}
}else if(academicEntitys.length == 0 && postEntitys.length!=0){
 academicStr = '学校';
 postStr = postEntitys[0].resolution.values[0].replace(/\s+/g, '');
 for(var i=0;i<table.length;i++){
   
  for(var j=0;j<table[i][2].split('、').length;j++){
   console.log(table[i][2].split('、')[j]);
   console.log(postStr);
   if (table[i][1] == academicStr && table[i][2].split('、')[j] == postStr)
   {
    if(table[i][3] != 'None' && table[i][4] != 'None'){
      string +=table[i][0] + " " + table[i][1] + table[i][2] + ",电话是" + table[i][3] + ",邮箱是" + table[i][4];
  }
  else if(table[i][3] != 'None' && table[i][4] == 'None'){
      if(table[i][3].match('www')){
         string +=table[i][0] + " " + table[i][1] + table[i][2] + ",网址是" + table[i][3] + '没有电话信息';
     }
     else{
      string +=table[i][0] + " " + table[i][1] + table[i][2] + ",电话是" + table[i][3];
  }
}
else if(table[i][3] == 'None' && table[i][4] != 'None'){
 string +=table[i][0] + " " + table[i][1] + table[i][2] + ",邮箱是" + table[i][4];
}              
else{
 string +=table[i][0] + " " + table[i][1] + table[i][2] + ",官网没有他的联系方式";
}
}
}
}
if(string == ''){
  session.send("本Bot在官网没有找到" + academicStr +"这个职务的信息");
}
else{
  session.send(string);
}
}
else{
    session.send('输入的查询信息不完整，请给我更多信息')
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
    globalBossNum = 0;
  //获取全局变量，为了上下文。
  if(academicEntitys.length!=0){
    globalAcademic = academicEntitys;
}
if(postEntitys.length!=0){
    globalPost = postEntitys;
}


if( academicEntitys.length == 0 && globalAcademic != null){
    academicEntitys = globalAcademic;
}
if(postEntitys.length==0 && globalPost != null){
    postEntitys = globalPost;
}

console.log(academicEntitys);
console.log(postEntitys);
fs.readFile(path.join(__dirname,'./data/人员数据总.csv'), function (err, data) {
  var table = new Array();
  if (err) {
      console.log(err.stack);
      return;
  }
           //根据csv文件，进行匹配
           ConvertToTable(data, function (table) {
              if( academicEntitys.length != 0 && postEntitys.length!=0){
                for(var i=0;i<table.length;i++){
                    academicStr = academicEntitys[0].resolution.values[0].replace(/\s+/g, '');
                    postStr = postEntitys[0].entity.replace(/\s+/g, '');
                    for(var j=0;j<table[i][2].split('、').length;j++){
                        if (table[i][1] == academicStr && table[i][2].split('、')[j] == postStr){

                          if(table[i][0] != 'None'){
                            string += table[i][1] + "的" + table[i][2] + " " + table[i][0];
                        }
                    }else if(table[i][1] == '学校' && table[i][2].split('、')[j] == postStr){
                      string += table[i][1] + "的" + table[i][2] + " " + table[i][0];
                  }
              }
          } 
          if(string == ''){
              string = "本Bot在官网没有找到" + academicStr +"这个职务的信息";
          }
          session.send(string);
      }
      else if(academicEntitys.length == 0 && postEntitys.length !=0){
         academicStr = '学校';
         postStr = postEntitys[0].resolution.values[0].replace(/\s+/g, '');
         console.log(postStr)
         for(var i=0;i<table.length;i++){
          for(var j=0;j<table[i][2].split('、').length;j++){
            if (table[i][1] == academicStr && table[i][2].split('、')[j] == postStr){
              if(table[i][0] != 'None'){
                string += table[i][1] + "的" + table[i][2] + " " + table[i][0];
            }
        }
    }
    
}
if(string == ''){
  session.send("本Bot在官网没有找到" + academicStr +"这个职务的信息");
}
else{
  session.send(string);
}
}else{
    session.send("请给的信息不足，请告诉我更完整的信息");
}
})
       }); 

session.endDialog();
}).triggerAction({
  matches: 'leaderName'
});

//领导负责工作问题
bot.dialog('leadDuty', 
  function (session, args) {
    // retrieve hotel name from matched entities
    var postEntitys = builder.EntityRecognizer.findAllEntities(args.intent.entities, 'post');
    var academicEntitys = builder.EntityRecognizer.findAllEntities(args.intent.entities, 'academic');
    var string = '';
    var academicStr = '';
    var postStr = '';
    globalBossNum = 0;
    //获取全局变量，为了上下文。
    if(academicEntitys.length!=0){
      globalAcademic = academicEntitys;
  }
  if(postEntitys.length!=0){
      globalPost = postEntitys;
  }


  if( academicEntitys.length == 0 && globalAcademic != null){
      academicEntitys = globalAcademic;
  }
  if(postEntitys.length==0 && globalPost != null){
      postEntitys = globalPost;
  }



  fs.readFile(path.join(__dirname,'./data/人员数据总.csv'), function (err, data) {
    var table = new Array();
    if (err) {
        console.log("error");
        console.log(err.stack);
        return;
    }
        //根据csv文件，进行匹配
        if (academicEntitys.length && postEntitys.length) {
          ConvertToTable(data, function (table) {
              for(var i=0;i<table.length;i++) {
                  academicStr = academicEntitys[0].resolution.values[0].replace(/\s+/g, '');
                  postStr = postEntitys[0].entity.replace(/\s+/g, '');
                  for(var j=0;j<table[i][2].split('、').length;j++){
                    if (table[i][1] == academicStr && table[i][2].split('、')[j] == postStr)
                    {
                        if(!table[i][5].match('None')){
                          console.log(table[i][5]);
                          string = table[i][1] + "的" + table[i][2] + "主要负责" + table[i][5];
                      }
                      else{
                          string = "对于" + table[i][1] + "的" + table[i][2] + ",官网没有相关的工作信息";
                      }
                  }
                  else if(table[i][1] == '学校' && table[i][2].split('、')[j] == postStr){
                    if(!table[i][5].match('None')){
                      console.log(table[i][5]);
                      string = table[i][1] + "的" + table[i][2] + "主要负责" + table[i][5];
                  }
                  else{
                      string = "对于" + table[i][1] + "的" + table[i][2] + ",官网没有相关的工作信息";
                  }
              }
          }
      }
      if(string == ''){
          string = "本Bot在官网没有找到" + academicStr +"这个职务的信息";
      }
      session.send(string);
  })
      }
      else if(academicEntitys.length == 0 && postEntitys.length !=0){
         academicStr = '学校';
         postStr = postEntitys[0].resolution.values[0].replace(/\s+/g, '');
         console.log(postStr)
         for(var i=0;i<table.length;i++){
          for(var j=0;j<table[i][2].split('、').length;j++){
            if (table[i][1] == academicStr && table[i][2].split('、')[j] == postStr){
              if(!table[i][5].match('None')){
                  console.log(table[i][5]);
                  string = table[i][1] + "的" + table[i][2] + "主要负责" + table[i][5];
              }
              else{
                  string = "对于" + table[i][1] + "的" + table[i][2] + ",官网没有相关的工作信息";
              }
          }
      }
      
  }
  if(string == ''){
      session.send("本Bot在官网没有找到" + academicStr +"这个职务的信息");
  }
  else{
      session.send(string);
  }
}
else {
  session.send('您给的信息不足，请告诉我更多信息，~^_^~');
}
}); 
  session.endDialog();
}).triggerAction({
  matches: 'leadDuty'
});

//校级领导信息
bot.dialog('schoolLeader',function(session,arg){
      //获取全局变量，为了上下文。
      var string = '';
      var postStr = '';
      var postEntitys = globalPost;
      var postList;
      globalBossNum = 0;
      if(postEntitys.length!=0){
          fs.readFile(path.join(__dirname,'./data/华科校级领导统计.csv'), function (err, data) {
            var table = new Array();
            if (err) {
                console.log("error");
                console.log(err.stack);
                return;
            }
            //根据csv文件，进行匹配
            ConvertToTable(data, function (table) {
                for(var i=0;i<table.length;i++) {
                  postList = table[i][1].replace(/\s+/g, '').split("、");
                  for(var j=0;j<postList.length;j++){
                    postStr = postList[j];
                    if(postEntitys[0].entity.replace(/\s+/g, '') == postStr){
                        string = table[i][0] + "是HUST的" + table[i][1] + "，他的主要工作是" +table[i][2] + '，官网介绍在' + table[i][3] +'，以上是所有信息，没有联系方式。';
                        session.send(string);
                    }
                }
                  // postStr = postEntitys[0].entity.replace(/\s+/g, '');
                  // console.log(table[i][1]);
              }
          });
        });
      }else{
          session.send('貌似回答不了');
      }
      
      session.endDialog();
  }).triggerAction({
      matches: 'schoolLeader'
  });

//官网信息
bot.dialog('websiteInfo',function(session,args){
    var websiteEntitys = builder.EntityRecognizer.findAllEntities(args.intent.entities, 'websitesKey');
    var academicEntitys = builder.EntityRecognizer.findAllEntities(args.intent.entities, 'academic');
    var flag=true;
    globalBossNum = 0;
    if(websiteEntitys.length!=0 ||academicEntitys.length!=0){
      var table = new Array();
      fs.readFile(path.join(__dirname,'./data/hust-websites.csv'), function (err, data) {
        if (err) {
            console.log(err.stack);
            return;
        }
        //根据csv文件，进行匹配
        ConvertToTable(data, function (table) {
          for(var i=0;i<table.length;i++){
            if(academicEntitys.length!=0){
              for(var j=0;j<academicEntitys.length;j++)
              {
                if(table[i][0] == academicEntitys[j].resolution.values[0].replace(/\s+/g, '')){
                  session.send(table[i][0] +'的官网是'+table[i][1]);
                  flag = false;
              }
          }
      }
      if(websiteEntitys.length!=0){
          for(var j=0;j<websiteEntitys.length;j++){
            if(table[i][0] == websiteEntitys[j].resolution.values[0].replace(/\s+/g, '')){
                session.send(table[i][0] +'的官网是'+table[i][1]);
                flag = false;
            }
        }
    }

}
if(flag == true){
    session.send("不好意思没有查到改信息的官网，所以不能给您提供信息了（逃");
}
}); 
    });
  } 
  session.endDialog();
}).triggerAction({
  matches: 'websiteInfo'
});

//校长上届问题
bot.dialog('schoolmaster', function (session, args) {
  var numEntitys = builder.EntityRecognizer.findAllEntities(args.intent.entities, 'num');
  var postEntitys = builder.EntityRecognizer.findAllEntities(args.intent.entities, 'post');
  var bossList = ['查谦','朱九思','吴再德','薛德麟','黄树槐','杨叔子','周济','樊明武','李培根','丁烈云']
  var consours = 0;
  if(postEntitys.length == 0){
    if(globalPost != null){
      console.log(111)
      if( globalPost[0].entity.replace(/\s+/g, '') == '校长'){
       globalBossNum += parseInt(numEntitys[0].resolution.values[0]);
       if(bossList.length-globalBossNum-1 >=0){
          session.send(bossList[bossList.length-globalBossNum-1]);
      }else{
          session.send('哪来的这么多任。。');
      }
  }else{
    session.send('本Bot只自己去爬了本校历任校长的信息，其他的往届信息木有找到哎~');
}
}
return;
}

if(postEntitys.length != 0 && postEntitys[0].entity.replace(/\s+/g, '') == '校长'){
  console.log(postEntitys);
  globalBossNum += parseInt(numEntitys[0].resolution.values[0]);
  if(globalPost != null){
    if(bossList.length-globalBossNum-1 >=0){
      session.send(bossList[bossList.length-globalBossNum-1]);
  }else{
      session.send('哪来的这么多任。。');
  }
}
else{
  session.send('本Bot只自己去爬了本校历任校长的信息，其他的往届信息木有找到哎~');
}

}else{
  session.send('本Bot只自己去爬了本校历任校长的信息，其他的往届信息木有找到哎~');
}

session.endDialog();
}).triggerAction({
  matches: 'bossList'
});

//None,固定问答对
bot.dialog('None',function(session,args){
   var noneKeyEntitys = builder.EntityRecognizer.findAllEntities(args.intent.entities, 'noneKey');
   console.log(args.intent);
   var data = '';
   if(noneKeyEntitys.length == 0){
    session.send("你好，我是HUST Bot ,我还很蠢，不要问有难度的问题，好不啦~ ^_^");
}else{
      // 创建可读流 
      var readerStream = fs.createReadStream(path.join(__dirname,'./data/常见问题对.csv'));
        // 设置编码为 utf8。
        readerStream.setEncoding('UTF8');
        // 处理流事件 --> data, end, and error
        readerStream.on('data', function(sentence) {
          data += sentence;
      });
        readerStream.on('end',function(){
          var arr = data.split('\n');
          var qna;
          for(var i=0;i<arr.length;i++){
            qna = arr[i].split(' ');
            for(var j=0;j<noneKeyEntitys.length;j++){
              if(noneKeyEntitys[j].resolution.values[0].replace(/\s+/g, '') == qna[0]){
                  session.send(qna[1]);
                  break;
              }
          }
      }
  });
    }
    globalAcademic = null;
    globalPost = null;
    globalBossNum = 0;
    session.endDialog();
}).triggerAction({
  matches: 'None' 
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

