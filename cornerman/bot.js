const { ActivityHandler, MessageFactory } = require('botbuilder');

   class EchoBot extends ActivityHandler {
       constructor() {
           super();
           this.onMessage(async (context, next) => {
               console.log(`Received message: ${context.activity.text}`);
               const replyText = `Echo: ${context.activity.text}`;
               console.log(`Sending reply: ${replyText}`);
               await context.sendActivity(MessageFactory.text(replyText, replyText));
               console.log('Reply sent');
               await next();
           });

           this.onMembersAdded(async (context, next) => {
               console.log('New member added to the conversation');
               const membersAdded = context.activity.membersAdded;
               const welcomeText = 'Hello and welcome!';
               for (let cnt = 0; cnt < membersAdded.length; ++cnt) {
                   if (membersAdded[cnt].id !== context.activity.recipient.id) {
                       console.log(`Sending welcome message to member: ${membersAdded[cnt].id}`);
                       await context.sendActivity(MessageFactory.text(welcomeText, welcomeText));
                       console.log('Welcome message sent');
                   }
               }
               await next();
           });

           this.onTurn(async (context, next) => {
               console.log(`Processing activity: ${context.activity.type}`);
               await next();
               console.log('Turn complete');
           });
       }
   }

   module.exports.EchoBot = EchoBot;
