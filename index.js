import fs from 'fs-extra';
import fetch from 'node-fetch';
import {Telegraf} from 'telegraf';
import moment from 'moment-timezone';
import figlet from 'figlet';


const config = JSON.parse(fs.readFileSync('./config.json'));
const token = config.token
const bot = new Telegraf(token)
const API_KEY = config.API_KEY
const USER_NAME = config.USER_NAME
const API_URL = config.API_URL
const CoType = "application/json"
const headers = { 'Api-Key':API_KEY,'Api-Username':USER_NAME,'Content-Type': CoType }
const userid = JSON.parse(fs.readFileSync('./data/userid.json'));

console.log('-----------------------------------------------------------');
console.log(figlet.textSync('Bot Discours'));
console.log('-----------------------------------------------------------');
console.log("                     Start " + moment.tz("Asia/Riyadh").format('hh:mm'))

setInterval(async function(){ 
  const method =  'GET'
  const body = JSON.stringify()

  await fetch(`${API_URL}/latest.json`, { method, headers, body })
    .then(response => response.json())
    .then(async (data) => {

    const pcreat = data.topic_list.topics[0].created_at;
    const time = moment.tz("Asia/Riyadh").format('YYYY-MM-DDTHH:mm');
    const ptime = moment.tz(pcreat, "Asia/Riyadh").format('YYYY-MM-DDTHH:mm')
    const url = `${API_URL}/t/${data.topic_list.topics[0].slug}/${data.topic_list.topics[0].id}\n\n\n`;
    const title = `${data.topic_list.topics[0].title}\n\n`;
    const username = `➸ User : ${data.topic_list.topics[0].last_poster_username}\n`;
    const postid = `➸ post id : ${data.topic_list.topics[0].id}\n`;

    if ( ptime === time ) {
      for (let lop of userid) {
        await bot.telegram.sendMessage(lop, url + title + username + postid)
        .catch((error) => {
          let del = userid.indexOf(error.on.payload.chat_id);
          userid.splice(del, 1)
          fs.writeFileSync('./lib/userid.json', JSON.stringify(userid))
          console.log('delete :' + error.on.payload.chat_id)
        }); 
      }
    }

    })
    .catch((erro) => { console.log('Error when sending: ', erro); });

  } , 60000);



//==========//


  bot.start((ctx) => {
    var wel = `مرحبا ${ctx.message.from.first_name} 👋 \n\n\n`
    wel += `أسس (أُسُس) تهدف إلى الإثراء في البرمجيات الحرة والمفتوحة المصدر في الوطن العربي\n`
    wel += `للإطلاع على اخر موضوع تم نشره في المجتمع /topis\n`
    wel += `لرد على الموضوع /reply \n\n`
    wel += `${API_URL}\n`

    if (!userid.includes(ctx.chat.id)) {
      userid.push(ctx.chat.id);
      fs.writeFileSync('./lib/userid.json', JSON.stringify(userid))
      console.log('save :' + ctx.chat.id)
    }
  
    ctx.reply(wel)
  
  })


  bot.command('reply', (ctx) => {
    const pid = ctx.message.reply_to_message.text.split('➸ post id : ')[1]
    const fname = `${ctx.message.from.first_name}:\n\n`
    const comnt = ctx.message.text.slice(6)
    const method =  'POST'
    const body = JSON.stringify({"raw": fname+comnt,"topic_id": pid})
    

    fetch(`${API_URL}/posts.json`, { method, headers, body }).then(response => response.json())
    .then(async (data) => {

      if (data.action === 'create_post' && data.errors[0]){
        await ctx.reply(data.errors[0]);
      }
      else {ctx.reply('✅')}
    })
    
  })
  
  bot.command('topis', async (ctx) => {
    const method =  'GET'
    const body = JSON.stringify()
    
    await fetch(`${API_URL}/latest.json`, { method, headers, body }).then(response => response.json())
    .then(async (data) => {
    
    const url = `${API_URL}/t/${data.topic_list.topics[0].slug}/${data.topic_list.topics[0].id}\n\n\n`;
    const title = `${data.topic_list.topics[0].title}\n\n`;
    const username = `➸ User : ${data.topic_list.topics[0].last_poster_username}\n`;
    const postid = `➸ post id : ${data.topic_list.topics[0].id}\n`;

      await ctx.reply(url + title + username + postid)

    })
    
  })


  
bot.launch()

process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))
