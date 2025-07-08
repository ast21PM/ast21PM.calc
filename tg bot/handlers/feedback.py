from telegram import Update, ReplyKeyboardMarkup
from telegram.ext import ContextTypes, ConversationHandler, CommandHandler, MessageHandler, filters
import os

# Состояния для диалога
WAITING_FOR_TEXT, WAITING_FOR_PHOTO = range(2)

async def feedback_start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if update.message:
        keyboard = [["Отмена"]]
        reply_markup = ReplyKeyboardMarkup(keyboard, resize_keyboard=True, one_time_keyboard=True)
        await update.message.reply_text("Пожалуйста, опиши проблему на сайте.", reply_markup=reply_markup)
    context.user_data.clear()
    return WAITING_FOR_TEXT

async def handle_text(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if update.message.text == "Отмена":
        await update.message.reply_text("Диалог отменен.", reply_markup=ReplyKeyboardMarkup([["/start"]], resize_keyboard=True))
        return ConversationHandler.END
    elif update.message.text == "Перезапустить":
        context.user_data.clear()
        await update.message.reply_text("Бот перезапущен.", reply_markup=ReplyKeyboardMarkup([["/start"]], resize_keyboard=True))
        return ConversationHandler.END
    context.user_data['text'] = update.message.text
    keyboard = [["Да, прикрепить фото"], ["Нет"]]
    reply_markup = ReplyKeyboardMarkup(keyboard, resize_keyboard=True, one_time_keyboard=True)
    await update.message.reply_text("Хочешь прикрепить скриншот?", reply_markup=reply_markup)
    return WAITING_FOR_PHOTO

async def handle_photo(update: Update, context: ContextTypes.DEFAULT_TYPE):
    photo = update.message.photo[-1]  # Берем фото наилучшего качества
    context.user_data['photo'] = photo
    await process_feedback(update, context)
    return ConversationHandler.END

async def skip_photo(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if update.message.text in ["Нет", "Да, прикрепить фото", "Отмена", "Перезапустить"]:
        if update.message.text == "Нет":
            await process_feedback(update, context)
            return ConversationHandler.END
        elif update.message.text == "Да, прикрепить фото":
            await update.message.reply_text("Пожалуйста, отправь фото.")
            return WAITING_FOR_PHOTO
        elif update.message.text == "Отмена":
            await update.message.reply_text("Диалог отменен.", reply_markup=ReplyKeyboardMarkup([["/start"]], resize_keyboard=True))
            return ConversationHandler.END
        elif update.message.text == "Перезапустить":
            context.user_data.clear()
            await update.message.reply_text("Бот перезапущен.", reply_markup=ReplyKeyboardMarkup([["/start"]], resize_keyboard=True))
            return ConversationHandler.END
    await update.message.reply_text("Понял, жду фото или выбери действие.")
    return WAITING_FOR_PHOTO

async def process_feedback(update: Update, context: ContextTypes.DEFAULT_TYPE):
    text = context.user_data.get('text', 'Без текста')
    username = update.effective_user.username or update.effective_user.id
    admin_chat_id = os.getenv('ADMIN_CHAT_ID')

    # Объединяем текст и фото в одно сообщение
    try:
        if 'photo' in context.user_data:
            await context.bot.send_photo(
                chat_id=admin_chat_id,
                photo=context.user_data['photo'].file_id,
                caption=f"Сообщение от @{username}: {text}"
            )
        else:
            await context.bot.send_message(
                chat_id=admin_chat_id,
                text=f"Сообщение от @{username}: {text}"
            )
    except Exception as e:
        print(f"Ошибка отправки админу: {e}")

    await update.message.reply_text("Спасибо! Твое сообщение отправлено.", reply_markup=ReplyKeyboardMarkup([["/start"]], resize_keyboard=True))
    context.user_data.clear()

# Обработчик для команды или текста
feedback_handler = ConversationHandler(
    entry_points=[CommandHandler("feedback", feedback_start), MessageHandler(filters.Regex("^(Обратная связь)$"), feedback_start)],
    states={
        WAITING_FOR_TEXT: [MessageHandler(filters.TEXT & ~filters.COMMAND, handle_text)],
        WAITING_FOR_PHOTO: [
            MessageHandler(filters.PHOTO, handle_photo),
            MessageHandler(filters.TEXT & ~filters.COMMAND, skip_photo)
        ]
    },
    fallbacks=[]
)