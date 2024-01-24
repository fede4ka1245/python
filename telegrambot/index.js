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

// const getS3Link = (path) => {
//     return S3_PUBLIC_URL + path;
// }

async function notifyUsers(subs, data) {
  const warnMsgs = ['- Повреждение вайпера', '- Ошибка распределения порошка'];
  const recommendationMsgs = {
    'fix': 'Надо исправить печать',
    'stop': 'Надо останавливать печать',
    'ignore': 'Можно проигнорировать дефект, он не влияет на печать проекта',
    'metal_absence_stop': 'Остановите печать и загрузите металлическый порошок в контейнер',
    'reslice_stop': 'Остановите процесс и уберите из печати деталь с дефектом'
  };
  const msg = [`*Ошибка печати. Принетер uid: ${data?.printer_uid}. Слой #${data.order}.*\n`];

  for (const warn of data.warns) {
    let message = warnMsgs[warn.reason];

    if (warn?.rate) {
      message += `. *Критичность: ${warn?.rate.toFixed(4)}*`;
    }

    msg.push(message);
  }

  if (data?.recommendation && recommendationMsgs[data?.recommendation]) {
    msg.push(`\n\n*Рекомендация: ${recommendationMsgs[data?.recommendation]}*`);
  }

  const photos = [];

  if (data.svg_image) {
      photos.push({ type: 'photo', media: data.svg_image });
  }

  if (data.before_melting_image) {
      photos.push({ type: 'photo', media: data.before_melting_image });
  }

  if (data.after_melting_image) {
      photos.push({ type: 'photo', media: data.after_melting_image });
  }

  const button = {
    text: 'Открыть приложение',
    web_app: {
      url: `${SITE_URL}/printer/${data?.printer_uid}/${data?.project_id}?order=${data.order}`
    }
  };

  const keyboard = {
    inline_keyboard: [[button]]
  };

  for (const sub of subs) {
    let text = `${msg.join('\n')}\n`;

    if (sub.telegram_chat_id) {
      try {
        photos[0].caption = text
        photos[0].parse_mode = 'markdown'
        await bot.sendMediaGroup(sub.telegram_chat_id, photos);
        await bot.sendMessage(sub.telegram_chat_id, 'Нажми на кнопку, чтобы посмотреть деффекты 👇', { reply_markup: keyboard });
      } catch(er) {
        console.log(er);
      }
    }
  }
}

const mongoURL = `mongodb://${MONGO_INITDB_ROOT_USERNAME}:${MONGO_INITDB_ROOT_PASSWORD}@${MONGO_HOST}:${MONGO_PORT}/${MONGO_INITDB_DATABASE}?authSource=admin`;

const start = async (msg) => {
  try {
      await bot.sendMessage(msg.chat.id, 'Это телеграм бот для контроля SLM печати');
      await openWebApp(msg);
      await regUser(msg.from.id);
  } catch {}
}

const openWebApp = async (msg) => {
  const button = {
    text: 'Открыть приложение',
    web_app: {
      url: `${SITE_URL}`
    }
  };

  const keyboard = {
    inline_keyboard: [[button]]
  };

  try {
    await bot.sendMessage(msg.chat.id, 'Нажми на кнопку, чтобы подписаться на обновления SLM принтера 👇', { reply_markup: keyboard });
  } catch {}
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

setTimeout(() => {
  consumeMessages();
}, 8000);