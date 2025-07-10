from telegram import ReplyKeyboardMarkup
from telegram.ext import ContextTypes, CommandHandler, ConversationHandler

async def start(update, context: ContextTypes.DEFAULT_TYPE):
    keyboard = [
        ["Обратная связь"],
        ["Калькулятор"],
        ["Конвертер валют"],
        ["Система счисления"],
        ["Перезапустить"]
    ]
    reply_markup = ReplyKeyboardMarkup(keyboard, resize_keyboard=True, one_time_keyboard=False)
    await update.message.reply_text(
        "Привет! Я бот для твоего сайта. Выбери действие:",
        reply_markup=reply_markup
    )
    return ConversationHandler.END

start_handler = CommandHandler("start", start)