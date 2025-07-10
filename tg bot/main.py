import os
from dotenv import load_dotenv
from telegram.ext import Application, CommandHandler, ConversationHandler, MessageHandler, filters, ContextTypes
from telegram import ReplyKeyboardMarkup

load_dotenv()
TOKEN = os.getenv('BOT_TOKEN')

from handlers.start import start_handler
from handlers.feedback import feedback_handler
from handlers.calculator import calculator_handler
from handlers.currency_converter import converter_handler
from handlers.base_converter import base_converter_handler

def main():
    application = Application.builder().token(TOKEN).build()

    application.add_handler(start_handler)
    application.add_handler(feedback_handler)
    application.add_handler(calculator_handler)
    application.add_handler(converter_handler)
    application.add_handler(base_converter_handler)

    application.add_handler(MessageHandler(filters.Regex("^(Перезапустить)$") & ~filters.COMMAND, reset_bot))

    application.run_polling()

async def reset_bot(update, context: ContextTypes.DEFAULT_TYPE):
    context.user_data.clear()
    keyboard = [
        ["Обратная связь"],
        ["Калькулятор"],
        ["Конвертер валют"],
        ["Система счисления"],
        ["Перезапустить"]
    ]
    reply_markup = ReplyKeyboardMarkup(keyboard, resize_keyboard=True, one_time_keyboard=False)
    await update.message.reply_text("Бот перезапущен.", reply_markup=reply_markup)

if __name__ == "__main__":
    main()