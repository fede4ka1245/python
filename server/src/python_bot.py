import pika
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import ApplicationBuilder, CommandHandler, ContextTypes
from shared.config import *
from shared import get_connection
import pymongo

client = pymongo.MongoClient(DATABASE_URL, username=MONGO_INITDB_ROOT_USERNAME, password=MONGO_INITDB_ROOT_PASSWORD)
db = client[MONGO_INITDB_DATABASE]


class TelegramController:
    app = None

    async def _open_web_app(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        if TELEGRAM_USE_WEBAPP:
            button_text = "Открыть приложение"
            button_url = SITE_URL
            inline_button = InlineKeyboardButton(text=button_text, url=button_url)
            inline_keyboard = InlineKeyboardMarkup([[inline_button]])
            await context.bot.send_message(chat_id=update.effective_chat.id,
                                           text="Открой приложение ниже, чтобы подписаться на обновления frontend принтера 👇",
                                           reply_markup=inline_keyboard)
        else:
            await context.bot.send_message(chat_id=update.effective_chat.id,
                                           text=f"Открой {SITE_URL}, чтобы подписаться на обновления frontend принтера. \n Для аутентификации используй ID: {update.effective_chat.id}")

    async def _start(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        await context.bot.send_message(chat_id=update.effective_chat.id,
                                       text="Это телеграм бот для контроля frontend печати")
        await self._open_web_app(update, context)
        db['users'].find_one_and_update(
            {"telegram_chat_id": update.effective_chat.id},
            {'$set': {"telegram_chat_id": update.effective_chat.id}},
            upsert=True
        )


    def init(self):
        self.app = ApplicationBuilder().token(TELEGRAM_TOKEN).build()
        self.app.add_handler(CommandHandler("start", self._start))
        self.app.add_handler(CommandHandler("open_app", self._open_web_app))
        self.app.run_polling()

messanger = TelegramController()
messanger.init()
