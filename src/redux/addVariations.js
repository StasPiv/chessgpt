// Функция для добавления вариантов в PGN
function addVariations(mainPgn, variationPgn, moveNumber, isWhiteMove) {
    if (!mainPgn || !variationPgn) {
        return mainPgn || '';
    }

    // Разделяем PGN на заголовки и ходы
    const mainLines = mainPgn.split('\n');
    const headerLines = [];
    const moveLines = [];

    // Разделяем заголовки и ходы в основной линии
    let inHeaders = true;
    for (const line of mainLines) {
        if (inHeaders && line.startsWith('[')) {
            headerLines.push(line);
        } else if (line.trim() === '') {
            if (inHeaders) {
                headerLines.push(line);
                inHeaders = false;
            }
        } else {
            inHeaders = false;
            moveLines.push(line);
        }
    }

    // Объединяем строки с ходами, фильтруя пустые строки
    const movesText = moveLines
        .map(line => line.trim())  // Убираем пробелы с краев каждой строки
        .filter(line => line.length > 0)  // Удаляем пустые строки
        .join(' ');

    // Подготавливаем текст вариации (удаляем заголовки, если они есть)
    const variationLines = variationPgn.split('\n');
    let variationMovesText = '';
    inHeaders = true;
    for (const line of variationLines) {
        if (inHeaders && line.startsWith('[')) {
            continue;
        } else if (line.trim() === '') {
            if (inHeaders) {
                inHeaders = false;
            }
        } else {
            inHeaders = false;
            variationMovesText += line.trim() + ' ';
        }
    }
    variationMovesText = variationMovesText.trim();

    // Находим позицию для вставки вариации
    let movePattern;
    if (isWhiteMove) {
        // Для хода белых ищем "номер_хода. ход_белых"
        movePattern = new RegExp(`${moveNumber}\\s*\\.\\s*([^\\s]+)`);
    } else {
        // Для хода черных ищем "номер_хода. ход_белых ход_черных"
        movePattern = new RegExp(`${moveNumber}\\s*\\.\\s*([^\\s]+)\\s+([^\\s]+)`);
    }

    const moveMatch = movesText.match(movePattern);
    if (!moveMatch) {
        return mainPgn; // Не нашли указанный ход
    }

    // Определяем позицию для вставки
    let insertPosition;
    if (isWhiteMove) {
        // Для хода белых вставляем после "номер_хода. ход_белых"
        insertPosition = moveMatch.index + moveMatch[0].length;
    } else {
        // Для хода черных вставляем после "номер_хода. ход_белых ход_черных"
        insertPosition = moveMatch.index + moveMatch[0].length;
    }

    // Вставляем вариацию
    const resultMovesText = 
        movesText.substring(0, insertPosition) + 
        ` (${variationMovesText}) ` + 
        movesText.substring(insertPosition);

    // Убираем лишние пробелы
    const cleanedResult = resultMovesText.replace(/\(\s*(.*?)\s*\)\s+/g, '($1) ');

    // Возвращаем заголовки + обновленные ходы
    if (headerLines.length > 0) {
        return headerLines.join('\n') + '\n' + cleanedResult;
    } else {
        return cleanedResult;
    }
}

export { addVariations };
