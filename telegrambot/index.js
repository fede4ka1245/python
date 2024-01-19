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
const S3_PUBLIC_URL = process.env.S3_PUBLIC_URL

const bot = new TelegramBot(TELEGRAM_TOKEN, { polling: true });
bot.onText(/\/start/, (msg) => start(msg));
bot.onText(/\/open_app/, (msg) => this._openWebApp(msg));

const getS3Link = (path) => {
    return S3_PUBLIC_URL + path;
}

async function notifyUsers(subs, data) {
    const warnMsgs = ['- повреждение вайпера', '- ошибка распыления порошка'];
    const msg = ['*Ошибка печати*'];

    for (const warn of data.warns) {
        msg.push(warnMsgs[warn.reason]);
    }

    const photos = [];

    if (data.svg_image) {
        photos.push({ type: 'photo', media: getS3Link(data.svg_image) });
    }

    if (data.before_melting_image) {
        photos.push({ type: 'photo', media: getS3Link(data.before_melting_image) });
    }

    if (data.after_melting_image) {
        photos.push({ type: 'photo', media: getS3Link(data.after_melting_image) });
    }

  const button = {
    text: 'Открыть приложение',
    url: `${SITE_URL}/printerId/${data?.printer_uid}/projectId/${data?.project_id}`
  };

  const keyboard = {
    inline_keyboard: [[button]]
  };

    for (const sub of subs) {
        let text = `\n${msg.join('\n\n')}\n\n`;

        if (sub.telegram_chat_id) {
              try {
                  photos[0].caption = text
                  photos[0].parse_mode = 'markdown'
                  const msg = await bot.sendMediaGroup(sub.telegram_chat_id, photos);
                  const messageId = msg[0]?.message_id
                  await bot.sendMessage(sub.telegram_chat_id, 'Нажми на кнопку, чтобы посмотреть деффекты 👇', { reply_markup: keyboard, reply_parameters: { message_id: messageId } });
              } catch(er) {
                  console.log(er);
              }
        }
    }
}

const mongoURL = `mongodb://${MONGO_INITDB_ROOT_USERNAME}:${MONGO_INITDB_ROOT_PASSWORD}@${MONGO_HOST}:${MONGO_PORT}/${MONGO_INITDB_DATABASE}?authSource=admin`;

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
  const connection = await MongoClient.connect(mongoURL, { tls: false });
  const db = connection.db()
  const usersCollection = db.collection('users');

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
    console.log(`Waiting for messages in queue '${QUEUE_NAME}'. To exit press CTRL+C, here`);

    channel.consume(QUEUE_NAME, async (message) => {
      try {
        if (message?.content && !message?.content.toString().includes('undefined')) {
          const layer = JSON.parse(message.content.toString());
          const connection = await MongoClient.connect(mongoURL, { tls: false });
          const db = connection.db()
          const users = await db.collection('subs').find({ printer_uid: layer.printer_uid }).limit(8000).toArray();
          await notifyUsers(users, layer);
        }
      } catch {}
    }, { noAck: true });
  } catch (error) {
    console.error('Error:', error.message);
  }
}

consumeMessages();