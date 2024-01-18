import TelegramBot from 'node-telegram-bot-api';
import { MongoClient } from 'mongodb';
import amqp from 'amqplib';

const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const SITE_URL = process.env.SITE_URL;
const MONGO_INITDB_ROOT_USERNAME = process.env.MONGO_INITDB_ROOT_USERNAME
const MONGO_INITDB_ROOT_PASSWORD = process.env.MONGO_INITDB_ROOT_PASSWORD
const MONGO_INITDB_DATABASE = process.env.MONGO_INITDB_DATABASE
const MONGO_HOST = process.env.MONGO_HOST
const MONGO_PORT = process.env.MONGO_PORT

const mongoURL = `mongodb://mongodb:27017`;

const bot = new TelegramBot(TELEGRAM_TOKEN, { polling: true });
bot.onText(/\/start/, (msg) => start(msg));
bot.onText(/\/open_app/, (msg) => this._openWebApp(msg));

const start = async (msg) => {
  await bot.sendMessage(msg.chat.id, 'Это телеграм бот для контроля slm печати');
  await openWebApp(msg);
  await regUser(msg.chat.id);
}

const openWebApp = async (msg) => {
  const button = {
    text: 'Открыть приложение',
    url: SITE_URL
  };

  const keyboard = {
    inline_keyboard: [[button]]
  };

  await bot.sendMessage(msg.chat.id, 'Нажми на кнопку, чтобы подписаться на обновления slm принтера 👇', { reply_markup: keyboard });
}

const regUser = async (chatId) => {
  const connection = await MongoClient.connect(mongoURL, {
    proxyPassword: MONGO_INITDB_ROOT_PASSWORD,
    proxyUsername: MONGO_INITDB_ROOT_USERNAME,
    proxyHost: MONGO_HOST,
    proxyPort: MONGO_PORT
  });
  const db = connection.db()
  const usersCollection = db.collection('users');
  console.log(`here`);

  await usersCollection.updateOne(
    { telegram_chat_id: chatId },
    { $set: { telegram_chat_id: chatId } },
    { upsert: true }
  );
  await connection.close()
}

const RABBITMQ_HOST = process.env.RABBIT_MQ_HOST;
const RABBITMQ_PORT = process.env.RABBIT_MQ_PORT;
const RABBITMQ_USERNAME = process.env.RABBITMQ_DEFAULT_USER;
const RABBITMQ_PASSWORD = process.env.RABBITMQ_DEFAULT_PASS;
const QUEUE_NAME = 'layers';

async function consumeMessages() {
  try {
    const connection = await amqp.connect(`amqp://${RABBITMQ_USERNAME}:${RABBITMQ_PASSWORD}@${RABBITMQ_HOST}:${RABBITMQ_PORT}`);
    const channel = await connection.createChannel();
    await channel.assertQueue(QUEUE_NAME, { durable: true });
    console.log(`Waiting for messages in queue '${QUEUE_NAME}'. To exit press CTRL+C`);

    channel.consume(QUEUE_NAME, (message) => {
      if (message !== null) {
        console.log(`Received message: ${message.content.toString()}`);
        channel.ack(message);
      }
    });
  } catch (error) {
    console.error('Error:', error.message);
  }
}

consumeMessages();