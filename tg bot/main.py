import os
from dotenv import load_dotenv
from telegram.ext import Application, CommandHandler, ConversationHandler, MessageHandler, filters, ContextTypes
from telegram import ReplyKeyboardMarkup 
# Загрузка переменных окружения
load_dotenv()
TOKEN = os.getenv('BOT_TOKEN')

# Импорт обработчиков
from handlers.start import start_handler
from handlers.feedback import feedback_handler

def main():
    # Создание приложения
    application = Application.builder().token(TOKEN).build()

    # Добавление обработчиков
    application.add_handler(start_handler)
    application.add_handler(feedback_handler)

    # Глобальный обработчик для "Перезапустить"
    application.add_handler(MessageHandler(filters.Regex("^(Перезапустить)$") & ~filters.COMMAND, reset_bot))

    # Запуск бота
    application.run_polling()

async def reset_bot(update, context: ContextTypes.DEFAULT_TYPE):
    context.user_data.clear()
    keyboard = [
        ["Обратная связь"],
        ["Перезапустить"]
    ]
    reply_markup = ReplyKeyboardMarkup(keyboard, resize_keyboard=True, one_time_keyboard=False)
    await update.message.reply_text("Бот перезапущен.", reply_markup=reply_markup)

if __name__ == "__main__":
    main()