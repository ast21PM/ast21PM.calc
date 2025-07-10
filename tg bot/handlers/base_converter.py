import re
from telegram import Update, ReplyKeyboardMarkup
from telegram.ext import ContextTypes, ConversationHandler, CommandHandler, MessageHandler, filters

WAITING_FOR_NUMBER, WAITING_FOR_FROM_BASE, WAITING_FOR_TO_BASE = range(3)

def int_to_base(n, base):
    digits = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ"
    if n == 0:
        return "0"
    sign = ""
    if n < 0:
        sign = "-"
        n = -n
    res = ""
    while n > 0:
        res = digits[n % base] + res
        n //= base
    return sign + res

def escape_md(text):
    return re.sub(r'([_\*\[\]()~`>#+\-=|{}.!\\])', r'\\\1', str(text))

async def base_converter_start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    keyboard = [["Назад", "Перезапустить"]]
    reply_markup = ReplyKeyboardMarkup(keyboard, resize_keyboard=True, one_time_keyboard=False)
    await update.message.reply_text(
        "🔢 *Введите число для перевода* \\(например: 1011, 1A, 255\\):",
        reply_markup=reply_markup,
        parse_mode='MarkdownV2'
    )
    context.user_data.clear()
    return WAITING_FOR_NUMBER

async def handle_number(update: Update, context: ContextTypes.DEFAULT_TYPE):
    text = update.message.text.strip()
    if text.lower() == "назад":
        keyboard = [["Обратная связь"], ["Калькулятор"], ["Конвертер валют"], ["Система счисления"], ["Перезапустить"]]
        reply_markup = ReplyKeyboardMarkup(keyboard, resize_keyboard=True, one_time_keyboard=False)
        await update.message.reply_text("🏠 Возвращение к главному экрану.", reply_markup=reply_markup)
        return ConversationHandler.END
    if text.lower() == "перезапустить":
        return await handle_back_or_restart(update, context, text)
    context.user_data['number'] = text
    # Кастомная клавиатура для исходной системы счисления
    keyboard = [["2", "8"], ["10", "16"], ["Введите свою систему счисления"], ["Назад", "Перезапустить"]]
    await update.message.reply_text(
        "🔢 *Введите исходную систему счисления* \\(2\\-36\\):",
        reply_markup=ReplyKeyboardMarkup(keyboard, resize_keyboard=True),
        parse_mode='MarkdownV2'
    )
    return WAITING_FOR_FROM_BASE

async def handle_from_base(update: Update, context: ContextTypes.DEFAULT_TYPE):
    text = update.message.text.strip()
    if text.lower() == "назад":
        keyboard = [["Назад", "Перезапустить"]]
        reply_markup = ReplyKeyboardMarkup(keyboard, resize_keyboard=True)
        await update.message.reply_text(
            "🔢 *Введите число для перевода* \\(например: 1011, 1A, 255\\):",
            reply_markup=reply_markup,
            parse_mode='MarkdownV2'
        )
        return WAITING_FOR_NUMBER
    if text.lower() == "перезапустить":
        return await handle_back_or_restart(update, context, text)
    try:
        base = int(text)
        if not (2 <= base <= 36):
            raise ValueError
        context.user_data['from_base'] = base
        # Кастомная клавиатура для целевой системы счисления
        keyboard = [["2", "8"], ["10", "16"], ["Введите свою систему счисления"], ["Назад", "Перезапустить"]]
        await update.message.reply_text(
            "🎯 *Введите целевую систему счисления* \\(2\\-36\\):",
            reply_markup=ReplyKeyboardMarkup(keyboard, resize_keyboard=True),
            parse_mode='MarkdownV2'
        )
        return WAITING_FOR_TO_BASE
    except ValueError:
        # Кастомная клавиатура для исходной системы счисления
        keyboard = [["2", "8"], ["10", "16"], ["Введите свою систему счисления"], ["Назад", "Перезапустить"]]
        await update.message.reply_text(
            "⚠️ Пожалуйста, введите целое число от 2 до 36\\.",
            reply_markup=ReplyKeyboardMarkup(keyboard, resize_keyboard=True),
            parse_mode='MarkdownV2'
        )
        return WAITING_FOR_FROM_BASE

async def handle_to_base(update: Update, context: ContextTypes.DEFAULT_TYPE):
    text = update.message.text.strip()
    if text.lower() == "назад":
        # Кастомная клавиатура для исходной системы счисления
        keyboard = [["2", "8"], ["10", "16"], ["Введите свою систему счисления"], ["Назад", "Перезапустить"]]
        reply_markup = ReplyKeyboardMarkup(keyboard, resize_keyboard=True)
        await update.message.reply_text(
            "🔢 *Введите исходную систему счисления* \\(2\\-36\\):",
            reply_markup=reply_markup,
            parse_mode='MarkdownV2'
        )
        return WAITING_FOR_FROM_BASE
    if text.lower() == "перезапустить":
        return await handle_back_or_restart(update, context, text)
    # Если выбрана кнопка 'Введите свою систему счисления', просим ввести вручную
    if text == "Введите свою систему счисления":
        await update.message.reply_text(
            "🎯 *Введите целевую систему счисления вручную* \\(2\\-36\\):",
            reply_markup=ReplyKeyboardMarkup([["Назад", "Перезапустить"]], resize_keyboard=True),
            parse_mode='MarkdownV2'
        )
        return WAITING_FOR_TO_BASE
    try:
        to_base = int(text)
        if not (2 <= to_base <= 36):
            raise ValueError
        
        number = context.user_data['number']
        from_base = context.user_data['from_base']
        sign = -1 if number.startswith('-') else 1
        num_str = number[1:] if sign == -1 else number
        
        # Форматирование сообщения
        message_parts = []
        message_parts.append(f"🔁 *Конвертация*: `{number}` \\(base {from_base}\\) → `{to_base}`")

        # Перевод в десятичную систему (если нужно)
        if from_base != 10:
            message_parts.append("\n📊 *Шаг 1: Перевод в десятичную систему*")
            value = 0
            num_list = list(num_str)[::-1]  # Перебираем справа налево
            # Новая таблица с выравниванием
            table = [
                "┌───────┬───────────────┬──────────────┬────────────┐",
                "│ Разряд │ Формула        │ Степень      │ Результат  │",
                "├───────┼───────────────┼──────────────┼────────────┤"
            ]
            for i, digit in enumerate(num_list):
                dval = int(digit, 36)
                power = i
                contribution = dval * (from_base ** power)
                value += contribution
                table.append(f"│ {str(i+1).ljust(7)}│ {(str(dval)+'×'+str(from_base)+'^'+str(power)).ljust(15)}│ {(str(from_base)+'^'+str(power)).ljust(12)}│ {str(contribution).ljust(10)}│")
            table.append("└───────┴───────────────┴──────────────┴────────────┘")
            # Формула суммы
            sum_formula = ' + '.join([f'{int(d,36)}×{from_base}^{i}' for i, d in enumerate(num_list)])
            table.append(f"\n🔸 Промежуточный результат: {sum_formula}")
            table.append(f"🔸 Сумма: {value} \\(с учетом знака: {sign * value}\\)")
            message_parts.append('```\n' + '\n'.join(table) + '\n```')
        else:
            value = int(num_str) * sign
            message_parts.append(f"\n🔹 Число уже в десятичной системе: `{value}`")

        # Перевод в целевую систему (если нужно)
        if to_base != 10:
            message_parts.append("\n🔄 *Шаг 2: Перевод в целевую систему*")
            n = abs(value)
            steps = []
            results = []
            
            # Таблица деления
            table = ["┌──────────────────────┬───────────────────┬──────────┐",
                     "│ Делимое / Основание  │ Целое частное     │ Остаток  │",
                     "├──────────────────────┼───────────────────┼──────────┤"]
            
            while n > 0:
                quotient = n // to_base
                remainder = n % to_base
                table.append(f"│ {n} / {to_base:<10} │ {quotient:<17} │ {remainder:<8} │")
                results.append(str(remainder))
                n = quotient
                steps.append(f"{n} * {to_base} + {remainder}")

            table.append("└──────────────────────┴───────────────────┴──────────┘")
            message_parts.append('```\n' + '\n'.join(table) + '\n```')
            
            # Формируем результат
            result_str = ''.join([str(int_to_base(int(x), to_base)) for x in reversed(results)])
            result = ('-' if value < 0 else '') + result_str
        else:
            result = str(value)
        
        # Финальный результат
        message_parts.append("\n✅ *Финальный результат:*")
        message_parts.append(f"```\n{number} (base {from_base}) = {result} (base {to_base})\n```")

        # Отправляем форматированное сообщение
        await update.message.reply_text(
            '\n'.join(message_parts),
            reply_markup=ReplyKeyboardMarkup([["Назад", "Перезапустить"]], resize_keyboard=True),
            parse_mode='MarkdownV2'
        )
        return WAITING_FOR_NUMBER
        
    except ValueError as e:
        error_msg = [
            "⚠️ *Ошибка конвертации!*",
            "▫️ Проверьте корректность введенных данных:",
            f"▫️ Число: `{context.user_data.get('number', '?')}`",
            f"▫️ Исходная СС: `{context.user_data.get('from_base', '?')}`",
            f"▫️ Целевая СС: `{to_base}`",
            "_Возможные причины:_",
            "1. Цифры не соответствуют исходной системе счисления",
            "2. Отрицательные числа в недесятичных системах",
            "3. Недопустимые символы в числе"
        ]
        await update.message.reply_text(
            '\n'.join(error_msg),
            parse_mode='MarkdownV2'
        )
        return WAITING_FOR_TO_BASE

async def handle_back_or_restart(update: Update, context: ContextTypes.DEFAULT_TYPE, text: str):
    if text.lower() == "назад":
        keyboard = [["Обратная связь"], ["Калькулятор"], ["Конвертер валют"], ["Система счисления"], ["Перезапустить"]]
        reply_markup = ReplyKeyboardMarkup(keyboard, resize_keyboard=True, one_time_keyboard=False)
        await update.message.reply_text("🏠 Возвращение к главному экрану.", reply_markup=reply_markup)
        return ConversationHandler.END
    elif text.lower() == "перезапустить":
        context.user_data.clear()
        keyboard = [["Обратная связь"], ["Калькулятор"], ["Конвертер валют"], ["Система счисления"], ["Перезапустить"]]
        reply_markup = ReplyKeyboardMarkup(keyboard, resize_keyboard=True, one_time_keyboard=False)
        await update.message.reply_text("🔄 Бот перезапущен.", reply_markup=reply_markup)
        return ConversationHandler.END

base_converter_handler = ConversationHandler(
    entry_points=[CommandHandler("base", base_converter_start), 
                  MessageHandler(filters.Regex("^(Система счисления)$"), base_converter_start)],
    states={
        WAITING_FOR_NUMBER: [MessageHandler(filters.TEXT & ~filters.COMMAND, handle_number)],
        WAITING_FOR_FROM_BASE: [MessageHandler(filters.TEXT & ~filters.COMMAND, handle_from_base)],
        WAITING_FOR_TO_BASE: [MessageHandler(filters.TEXT & ~filters.COMMAND, handle_to_base)],
    },
    fallbacks=[]
)