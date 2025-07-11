from telegram import Update, ReplyKeyboardMarkup
from telegram.ext import ContextTypes, ConversationHandler, CommandHandler, MessageHandler, filters
from sympy import sympify, factorial, sin, cos, tan, asin, acos, atan, log, exp, sqrt, Abs, pi, E, rad
import sympy as sp

WAITING_FOR_CALC = range(1)

async def calculator_start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if update.message:
        keyboard = [["Назад", "Перезапустить"]]
        reply_markup = ReplyKeyboardMarkup(keyboard, resize_keyboard=True, one_time_keyboard=False)
        await update.message.reply_text(
            "Введите математическое выражение (например, 2 + 3, sin(30), 5!). "
            "Тригонометрические функции принимают аргументы в градусах. "
            "Для выхода нажмите 'Назад', для перезапуска — 'Перезапустить'.",
            reply_markup=reply_markup
        )
    context.user_data.clear()
    return WAITING_FOR_CALC

async def handle_calc(update: Update, context: ContextTypes.DEFAULT_TYPE):
    expression = update.message.text
    if expression == "Назад":
        keyboard = [["Обратная связь", "Калькулятор"], ["Графический калькулятор", "Конвертер валют"], ["Система счисления", "Перезапустить"]]
        reply_markup = ReplyKeyboardMarkup(keyboard, resize_keyboard=True, one_time_keyboard=False)
        await update.message.reply_text("Возвращение к главному экрану.", reply_markup=reply_markup)
        return ConversationHandler.END
    elif expression == "Перезапустить":
        context.user_data.clear()
        keyboard = [["Обратная связь", "Калькулятор"], ["Графический калькулятор", "Конвертер валют"], ["Система счисления", "Перезапустить"]]
        reply_markup = ReplyKeyboardMarkup(keyboard, resize_keyboard=True, one_time_keyboard=False)
        await update.message.reply_text("Бот перезапущен.", reply_markup=reply_markup)
        return ConversationHandler.END

    try:
        expression = expression.replace("^", "**")

        expr = sympify(expression, locals={
            'sin': lambda x: sin(rad(x)),
            'cos': lambda x: cos(rad(x)),
            'tan': lambda x: tan(rad(x)),
            'asin': lambda x: asin(x) * 180 / pi,
            'acos': lambda x: acos(x) * 180 / pi,
            'atan': lambda x: atan(x) * 180 / pi,
            'log': log, 'exp': exp, 'sqrt': sqrt,
            'abs': Abs, 'factorial': factorial,
            'pi': pi, 'e': E
        })

        result = round(float(expr.evalf()), 3)

        response = (
            f"**Выражение:** {expression}\n"
            f"**Результат:** {result}\n\n"
            "Введите новое выражение или нажмите 'Назад' для выхода, 'Перезапустить' для перезапуска."
        )
        await update.message.reply_text(response, parse_mode="Markdown", reply_markup=ReplyKeyboardMarkup([["Назад", "Перезапустить"]], resize_keyboard=True))
    except Exception:
        response = (
            f"**Выражение:** {expression}\n"
            "Ошибка: Некорректное выражение. \nПопробуйте еще раз или нажмите 'Назад' для выхода, 'Перезапустить' для перезапуска."
        )
        await update.message.reply_text(response, parse_mode="Markdown", reply_markup=ReplyKeyboardMarkup([["Назад", "Перезапустить"]], resize_keyboard=True))
    return WAITING_FOR_CALC

calculator_handler = ConversationHandler(
    entry_points=[CommandHandler("calc", calculator_start), MessageHandler(filters.Regex("Калькулятор"), calculator_start)],
    states={
        WAITING_FOR_CALC: [MessageHandler(filters.TEXT & ~filters.COMMAND, handle_calc)]
    },
    fallbacks=[]
)