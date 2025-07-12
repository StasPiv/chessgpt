export function cleanPgn(pgn) {
    if (!pgn) {
        return '';
    }

    // Убираем непечатаемые символы (включая NUL) и обрезаем пробелы
    let cleanedPgn = pgn.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').trim();
    
    // Разделяем заголовки и ходы
    const parts = cleanedPgn.split(/\n\s*\n/);
    let headers = '', moves = '';
    
    if (parts.length >= 2) {
        // Если есть пустая строка между заголовками и ходами
        headers = parts[0];
        moves = parts.slice(1).join('\n\n');
    } else {
        // Если нет четкого разделения, пробуем определить по первому символу
        if (cleanedPgn.startsWith('[')) {
            // Ищем последний заголовок
            const lastHeaderIndex = cleanedPgn.lastIndexOf(']');
            headers = cleanedPgn.substring(0, lastHeaderIndex + 1);
            moves = cleanedPgn.substring(lastHeaderIndex + 1).trim();
        } else {
            moves = cleanedPgn;
        }
    }

    // Если заголовков нет, добавляем минимальный набор
    if (!headers.includes('[Event')) {
        headers = '[Event "Casual Game"]\n[Site "?"]\n[Date "????.??.??"]\n[Round "?"]\n[White "?"]\n[Black "?"]\n[Result "*"]';
    }

    // Обрабатываем только специфичные проблемы в записи ходов
    if (moves) {
        // Исправляем только сокращенную запись вариантов из Arena (5. .. -> 5...)
        moves = moves.replace(/(\d+)\.\s*\.\./g, '$1...');
        
        // Проверяем наличие результата игры
        if (!moves.match(/1-0|0-1|1\/2-1\/2|\*$/)) {
            moves += ' *';
        }
        
        // Убираем лишние пробелы в конце, но сохраняем один перенос строки
        moves = moves.replace(/\s+$/, '\n');
    }

    // Собираем PGN обратно
    if (parts.length >= 2) {
        // Если изначально была пустая строка, сохраняем её
        return headers + '\n\n' + moves;
    } else {
        // Если не было пустой строки, но есть заголовки, добавляем её
        if (headers && moves) {
            return headers + '\n\n' + moves;
        } else if (headers) {
            return headers;
        } else {
            return moves;
        }
    }
}