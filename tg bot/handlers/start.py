from telegram import ReplyKeyboardMarkup
from telegram.ext import ContextTypes, CommandHandler

async def start(update, context: ContextTypes.DEFAULT_TYPE):
    keyboard = [
        ["Обратная связь", "Калькулятор"],
        ["Графический калькулятор", "Конвертер валют"],
        ["Система счисления", "Перезапустить"]
    ]
    reply_markup = ReplyKeyboardMarkup(keyboard, resize_keyboard=True, one_time_keyboard=False)
    await update.message.reply_text(
        "Привет! Я бот для твоего сайта. Выбери действие:",
        reply_markup=reply_markup
    )
    return

start_handler = CommandHandler("start", start)