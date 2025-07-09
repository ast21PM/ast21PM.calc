from telegram import Update, ReplyKeyboardMarkup
from telegram.ext import ContextTypes, ConversationHandler, CommandHandler, MessageHandler, filters
import requests
import os

# Состояния для диалога конвертера
WAITING_FOR_AMOUNT, WAITING_FOR_FROM_CURRENCY, WAITING_FOR_TO_CURRENCY = range(3)

async def converter_start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    currencies = [
        "USD - Доллар США", "EUR - Евро", "GBP - Британский фунт", "JPY - Японская иена",
        "AUD - Австралийский доллар", "CAD - Канадский доллар", "CHF - Швейцарский франк",
        "CNY - Китайский юань", "INR - Индийская рупия", "RUB - Российский рубль",
        "BRL - Бразильский реал", "ZAR - Южноафриканский рэнд", "MXN - Мексиканское песо",
        "SGD - Сингапурский доллар", "HKD - Гонконгский доллар", "KRW - Южнокорейская вона",
        "TRY - Турецкая лира", "SEK - Шведская крона", "NOK - Норвежская крона",
        "DKK - Датская крона", "PLN - Польский злотый", "THB - Тайский бат",
        "IDR - Индонезийская рупия", "HUF - Венгерский форинт", "CZK - Чешская крона",
        "ILS - Израильский шекель", "CLP - Чилийское песо", "PHP - Филиппинское песо",
        "AED - Дирхам ОАЭ", "SAR - Саудовский риял"
    ]
    currency_list = "\n".join([f"- {c}" for c in currencies])
    keyboard = [["Отмена"]]
    reply_markup = ReplyKeyboardMarkup(keyboard, resize_keyboard=True, one_time_keyboard=True)
    await update.message.reply_text(
        f"Доступные валюты:\n{currency_list}\n\nВведите сумму для конвертации:",
        reply_markup=reply_markup
    )
    return WAITING_FOR_AMOUNT

async def handle_amount(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if update.message.text == "Отмена":
        await return_to_main_menu(update, context)
        return ConversationHandler.END
    try:
        amount = float(update.message.text)
        if amount <= 0:
            raise ValueError
        context.user_data['amount'] = amount
        await update.message.reply_text("Введите исходную валюту (например, USD):")
        return WAITING_FOR_FROM_CURRENCY
    except ValueError:
        await update.message.reply_text("Пожалуйста, введите корректную положительную сумму.")
        return WAITING_FOR_AMOUNT

async def handle_from_currency(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if update.message.text == "Отмена":
        await return_to_main_menu(update, context)
        return ConversationHandler.END
    from_currency = update.message.text.upper()
    API_KEY = os.getenv('EXCHANGE_API_KEY')
    if not API_KEY:
        await update.message.reply_text("Ошибка: API-ключ не настроен. Обратитесь к администратору.")
        return ConversationHandler.END
    response = requests.get(f"https://v6.exchangerate-api.com/v6/{API_KEY}/latest/{from_currency}", timeout=5)
    if response.status_code != 200:
        await update.message.reply_text("Ошибка при получении данных о валюте. Попробуйте другую валюту.")
        return WAITING_FOR_FROM_CURRENCY
    data = response.json()
    if 'conversion_rates' not in data:
        await update.message.reply_text("Не удалось получить курсы для этой валюты. Попробуйте другую.")
        return WAITING_FOR_FROM_CURRENCY
    context.user_data['rates'] = data['conversion_rates']
    context.user_data['from_currency'] = from_currency
    await update.message.reply_text("Введите целевую валюту (например, EUR):")
    return WAITING_FOR_TO_CURRENCY

async def handle_to_currency(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if update.message.text == "Отмена":
        await return_to_main_menu(update, context)
        return ConversationHandler.END
    to_currency = update.message.text.upper()
    rates = context.user_data['rates']
    if to_currency not in rates:
        await update.message.reply_text("Целевая валюта не поддерживается. Попробуйте другую.")
        return WAITING_FOR_TO_CURRENCY
    amount = context.user_data['amount']
    from_currency = context.user_data['from_currency']
    rate = rates[to_currency]
    converted_amount = amount * rate
    response = f"{amount} {from_currency} = {converted_amount:.2f} {to_currency}"
    await update.message.reply_text(response)
    await return_to_main_menu(update, context)
    return ConversationHandler.END

async def return_to_main_menu(update: Update, context: ContextTypes.DEFAULT_TYPE):
    keyboard = [
        ["Обратная связь"],
        ["Калькулятор"],
        ["Конвертер валют"],
        ["Перезапустить"]
    ]
    reply_markup = ReplyKeyboardMarkup(keyboard, resize_keyboard=True, one_time_keyboard=False)
    await update.message.reply_text("Возвращение к главному экрану.", reply_markup=reply_markup)

converter_handler = ConversationHandler(
    entry_points=[CommandHandler("convert", converter_start), MessageHandler(filters.Regex("^(Конвертер валют)$"), converter_start)],
    states={
        WAITING_FOR_AMOUNT: [MessageHandler(filters.TEXT & ~filters.COMMAND, handle_amount)],
        WAITING_FOR_FROM_CURRENCY: [MessageHandler(filters.TEXT & ~filters.COMMAND, handle_from_currency)],
        WAITING_FOR_TO_CURRENCY: [MessageHandler(filters.TEXT & ~filters.COMMAND, handle_to_currency)],
    },
    fallbacks=[]
)