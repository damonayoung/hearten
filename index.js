const path = require('path');
const dotenv = require('dotenv');
const restify = require('restify');
const {
    CloudAdapter,
    ConfigurationServiceClientCredentialFactory,
    createBotFrameworkAuthenticationFromConfiguration
} = require('botbuilder');
const { EchoBot } = require('./bot');

// Import required bot configuration.
const ENV_FILE = path.join(__dirname, '.env');
dotenv.config({ path: ENV_FILE });

// Validate required environment variables
const requiredEnvVars = ['MicrosoftAppId', 'MicrosoftAppPassword', 'MicrosoftAppType', 'MicrosoftAppTenantId'];
requiredEnvVars.forEach(varName => {
    if (!process.env[varName]) {
        console.error(`Error: Environment variable ${varName} is not set.`);
        process.exit(1);
    }
});

// Create HTTP server
const server = restify.createServer();
server.use(restify.plugins.bodyParser());

const credentialsFactory = new ConfigurationServiceClientCredentialFactory({
    MicrosoftAppId: process.env.MicrosoftAppId,
    MicrosoftAppPassword: process.env.MicrosoftAppPassword,
    MicrosoftAppType: process.env.MicrosoftAppType,
    MicrosoftAppTenantId: process.env.MicrosoftAppTenantId
});

const botFrameworkAuthentication = createBotFrameworkAuthenticationFromConfiguration(null, credentialsFactory);

// Create adapter.
const adapter = new CloudAdapter(botFrameworkAuthentication);

// Catch-all for errors.
const onTurnErrorHandler = async (context, error) => {
    console.error(`\n [onTurnError] unhandled error: ${error}`);
    console.error(error.stack);

    await context.sendTraceActivity(
        'OnTurnError Trace',
        `${error}`,
        'https://www.botframework.com/schemas/error',
        'TurnError'
    );

    await context.sendActivity('The bot encountered an error or bug.');
    await context.sendActivity('To continue to run this bot, please fix the bot source code.');
};

// Set the onTurnError for the singleton CloudAdapter.
adapter.onTurnError = onTurnErrorHandler;

// Create the main dialog.
const myBot = new EchoBot();

// Test route
server.get('/', (req, res, next) => {
    console.log('Received GET request on /');
    res.send('Bot is running!');
});

// Listen for incoming requests.
server.post('/api/messages', (req, res, next) => {
    console.log('Received a message on /api/messages');
    console.log('Request headers:', JSON.stringify(req.headers));
    console.log('Request body:', JSON.stringify(req.body));
    adapter.process(req, res, async (context) => {
        await myBot.run(context);
        console.log('Message processed successfully');
    }).catch(err => {
        console.error('Error processing message:', err);
        res.status(500).send('Internal Server Error');
        next(err);
    });
});

// Listen for Upgrade requests for Streaming.
server.on('upgrade', async (req, socket, head) => {
    console.log('Received an upgrade request');
    try {
        const streamingAdapter = new CloudAdapter(botFrameworkAuthentication);
        streamingAdapter.onTurnError = onTurnErrorHandler;
        await streamingAdapter.process(req, socket, head, (context) => myBot.run(context));
        console.log('Upgrade request processed successfully');
    } catch (err) {
        console.error('Error processing upgrade request:', err);
        socket.destroy();
    }
});

// Start the server
server.listen(process.env.port || process.env.PORT || 3978, () => {
    console.log(`\n${server.name} listening to ${server.url}`);
    console.log('\nGet Bot Framework Emulator: https://aka.ms/botframework-emulator');
    console.log('\nTo talk to your bot, open the emulator select "Open Bot"');
});

console.log('Bot server initialized');