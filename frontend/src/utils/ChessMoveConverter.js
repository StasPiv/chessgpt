
import { Chess } from 'cm-chess';

/**
 * Конвертирует UCI-ходы в алгебраическую нотацию (SAN)
 * @param {string} uciMoves - строка с UCI-ходами, разделенными пробелами (например, "e2e4 e7e5 g1f3")
 * @param {string} startFen - FEN позиции, с которой начинается анализ
 * @returns {string[]} - массив ходов в SAN формате
 */
export function convertUciToSan(uciMoves, startFen) {
    if (!uciMoves || typeof uciMoves !== 'string') {
        return [];
    }

    const chess = new Chess(startFen);
    const movesList = uciMoves.trim().split(' ').filter(move => move.length > 0);
    const sanMoves = [];
    
    for (const uciMove of movesList) {
        try {
            // Пробуем сделать ход
            let result = chess.move(uciMove);
            if (!result) {
                // Если не получилось, пробуем с sloppy режимом
                result = chess.move(uciMove, { sloppy: true });
            }
            if (!result) {
                // Если все равно не получилось, прекращаем обработку
                console.warn(`Invalid UCI move: ${uciMove} in position ${chess.fen()}`);
                break;
            }
            sanMoves.push(result.san);
        } catch (e) {
            console.error(`Error processing UCI move: ${uciMove}`, e);
            break;
        }
    }

    return sanMoves;
}

/**
 * Форматирует SAN-ходы с номерами ходов
 * @param {string[]} sanMoves - массив ходов в SAN формате
 * @param {string} startFen - FEN позиции, с которой начинается анализ
 * @returns {string} - отформатированная строка с номерами ходов
 */
export function formatMovesWithNumbers(sanMoves, startFen) {
    if (!sanMoves || !Array.isArray(sanMoves) || sanMoves.length === 0) {
        return '';
    }
    
    // Парсим FEN для получения информации о ходе
    const fenParts = startFen.split(' ');
    const isWhiteToMove = fenParts[1] === 'w';
    const moveNumber = parseInt(fenParts[5]) || 1;
    
    const result = [];
    let currentMoveNumber = moveNumber;
    let isCurrentWhite = isWhiteToMove;
    
    for (let i = 0; i < sanMoves.length; i++) {
        const move = sanMoves[i];
        
        if (isCurrentWhite) {
            result.push(`${currentMoveNumber}. ${move}`);
        } else {
            if (i === 0) {
                // Первый ход черных
                result.push(`${currentMoveNumber}... ${move}`);
            } else {
                result.push(move);
            }
        }
        
        // Увеличиваем номер хода после хода черных
        if (!isCurrentWhite) {
            currentMoveNumber++;
        }
        
        isCurrentWhite = !isCurrentWhite;
    }
    
    return result.join(' ');
}

/**
 * Преобразует UCI-ходы сразу в отформатированную строку
 * @param {string} uciMoves - строка с UCI-ходами
 * @param {string} startFen - FEN позиции
 * @returns {string} - отформатированная строка с номерами ходов
 */
export function convertUciToFormattedMoves(uciMoves, startFen) {
    const sanMoves = convertUciToSan(uciMoves, startFen);
    return formatMovesWithNumbers(sanMoves, startFen);
}

/**
 * Парсит данные анализа в новом формате (с UCI-ходами)
 * @param {Object} rawAnalysisLine - сырые данные анализа от сервера
 * @param {string} currentFen - текущая FEN позиция
 * @returns {Object} - обработанные данные для отображения
 */
export function parseAnalysisLine(rawAnalysisLine, currentFen) {
    if (!rawAnalysisLine || !currentFen) {
        return null;
    }

    try {
        // Если есть uciMoves, конвертируем их
        let formattedMoves = '';
        if (rawAnalysisLine.uciMoves) {
            formattedMoves = convertUciToFormattedMoves(rawAnalysisLine.uciMoves, currentFen);
        } else if (rawAnalysisLine.moves) {
            // Fallback к старому формату
            formattedMoves = rawAnalysisLine.moves;
        }

        return {
            score: rawAnalysisLine.score,
            depth: rawAnalysisLine.depth,
            nodes: rawAnalysisLine.nodes,
            moves: formattedMoves,
            uciMoves: rawAnalysisLine.uciMoves // Сохраняем для отладки
        };
    } catch (error) {
        console.error('Error parsing analysis line:', error);
        return {
            score: rawAnalysisLine.score,
            depth: rawAnalysisLine.depth,
            nodes: rawAnalysisLine.nodes,
            moves: rawAnalysisLine.moves || '',
            uciMoves: rawAnalysisLine.uciMoves
        };
    }
}
