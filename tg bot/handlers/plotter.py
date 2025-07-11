import os
import requests
from telegram import Update, ReplyKeyboardMarkup, InputFile
from telegram.ext import ContextTypes, ConversationHandler, CommandHandler, MessageHandler, filters
from dotenv import load_dotenv

load_dotenv()
WOLFRAM_API_KEY = os.getenv('WOLFRAMALPHA_API_KEY')

WAITING_FOR_FUNCTION = range(1)

async def plotter_start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    keyboard = [["Назад", "Перезапустить"]]
    reply_markup = ReplyKeyboardMarkup(keyboard, resize_keyboard=True, one_time_keyboard=False)
    await update.message.reply_text(
        "Введите функцию для построения графика (например, y = sin(x), y = x^2).\nДля выхода нажмите 'Назад', для перезапуска — 'Перезапустить'.",
        reply_markup=reply_markup
    )
    context.user_data.clear()
    return WAITING_FOR_FUNCTION

async def handle_plot(update: Update, context: ContextTypes.DEFAULT_TYPE):
    text = update.message.text
    if text == "Назад":
        keyboard = [["Обратная связь", "Калькулятор"], ["Графический калькулятор", "Конвертер валют"], ["Система счисления", "Перезапустить"]]
        reply_markup = ReplyKeyboardMarkup(keyboard, resize_keyboard=True, one_time_keyboard=False)
        await update.message.reply_text("Возвращение к главному экрану.", reply_markup=reply_markup)
        return ConversationHandler.END
    elif text == "Перезапустить":
        context.user_data.clear()
        keyboard = [["Обратная связь", "Калькулятор"], ["Графический калькулятор", "Конвертер валют"], ["Система счисления", "Перезапустить"]]
        reply_markup = ReplyKeyboardMarkup(keyboard, resize_keyboard=True, one_time_keyboard=False)
        await update.message.reply_text("Бот перезапущен.", reply_markup=reply_markup)
        return ConversationHandler.END

    await update.message.reply_text('Запрос принят, график строится...')
    try:
        query = f'plot {text}'
        url = f'https://api.wolframalpha.com/v1/simple?appid={WOLFRAM_API_KEY}&i={requests.utils.quote(query)}'
        response = requests.get(url)
        if response.status_code == 200 and response.headers['Content-Type'].startswith('image'):
            with open('plot.png', 'wb') as f:
                f.write(response.content)
            with open('plot.png', 'rb') as f:
                await update.message.reply_photo(photo=InputFile(f), caption=f'График функции: {text}')
            os.remove('plot.png')
        else:
            await update.message.reply_text('Не удалось построить график. Проверьте корректность функции.')
    except Exception:
        await update.message.reply_text('Произошла ошибка. Попробуйте еще раз.')
    return WAITING_FOR_FUNCTION

plotter_handler = ConversationHandler(
    entry_points=[CommandHandler("plot", plotter_start), MessageHandler(filters.Regex("Графический калькулятор"), plotter_start)],
    states={
        WAITING_FOR_FUNCTION: [MessageHandler(filters.TEXT & ~filters.COMMAND, handle_plot)]
    },
    fallbacks=[]
)
