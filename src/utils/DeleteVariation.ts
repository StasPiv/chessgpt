
/**
 * Безопасное клонирование объекта с циклическими ссылками
 */
function safeClone(obj: any, visited = new WeakMap()): any {
    if (obj === null || typeof obj !== 'object') {
        return obj;
    }

    if (visited.has(obj)) {
        return {}; // Возвращаем пустой объект для разрыва цикла
    }

    visited.set(obj, true);

    if (Array.isArray(obj)) {
        return obj.map(item => safeClone(item, visited));
    }

    const cloned: any = {};
    for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
            // Пропускаем циклические ссылки при клонировании
            if (key === 'next' || key === 'previous') {
                continue;
            }
            cloned[key] = safeClone(obj[key], visited);
        }
    }

    return cloned;
}

/**
 * Находит первый ход в вариации, содержащей указанный ход
 * @param history - полная история ходов
 * @param targetMove - ход, для которого нужно найти первый ход в вариации
 * @returns первый ход в вариации или null если ход не найден в вариации
 */
const findFirstMoveInVariation = (history: any[], targetMove: any): any | null => {
    const searchForFirstMoveInVariation = (moves: any[]): any | null => {
        for (const move of moves) {
            // Если у хода есть вариации, ищем в них
            if (move.variations && move.variations.length > 0) {
                for (const variation of move.variations) {
                    // Проверяем, есть ли targetMove в этой вариации
                    const foundInVariation = variation.find((varMove: any) => varMove.globalIndex === targetMove.globalIndex);
                    if (foundInVariation) {
                        return variation[0]; // Возвращаем первый ход в вариации
                    }

                    // Рекурсивно ищем в подвариациях
                    const foundInDeepVariation = searchForFirstMoveInVariation(variation);
                    if (foundInDeepVariation) {
                        return foundInDeepVariation;
                    }
                }
            }
        }
        return null;
    };

    return searchForFirstMoveInVariation(history);
};

/**
 * Удаляет вариацию, содержащую указанный ход, из истории
 * @param history - история ходов
 * @param targetMove - ход, вариацию которого нужно удалить
 * @returns обновленная история без указанной вариации
 */
const removeVariationContainingMove = (history: any[], targetMove: any): any[] => {
    const processMovesRecursively = (moves: any[]): any[] => {
        return moves.map(move => {
            // Если у хода есть вариации, обрабатываем их
            if (move.variations && move.variations.length > 0) {
                const filteredVariations = move.variations.filter((variation: any[]) => {
                    // Проверяем, содержит ли эта вариация целевой ход
                    const containsTargetMove = variation.some((varMove: any) => varMove.globalIndex === targetMove.globalIndex);
                    return !containsTargetMove; // Оставляем только вариации, которые НЕ содержат целевой ход
                });

                // Рекурсивно обрабатываем оставшиеся вариации
                const processedVariations = filteredVariations.map((variation: any[]) => {
                    return processMovesRecursively(variation);
                });

                // Возвращаем ход с обновленными вариациями
                return {
                    ...move,
                    variations: processedVariations
                };
            }

            return move;
        });
    };

    return processMovesRecursively(history);
};

/**
 * Удаляет вариацию, содержащую указанный ход
 * @param currentMove - ход, вариацию которого нужно удалить
 * @param history - история ходов
 * @returns обновленная история без указанной вариации
 */
export function deleteVariation(
    currentMove: any,
    history: any[]
): any {
    // Безопасно клонируем историю для избежания мутации
    const updatedHistory = safeClone(history);

    // Проверяем, находится ли currentMove в основной линии
    const isInMainLine = updatedHistory.some((move: any) => move.globalIndex === currentMove.globalIndex);
    
    if (isInMainLine) {
        // Если ход в основной линии, удалять нечего - возвращаем историю без изменений
        return history;
    }

    // Находим первый ход в вариации, содержащей currentMove
    const firstMoveInVariation = findFirstMoveInVariation(updatedHistory, currentMove);
    
    if (!firstMoveInVariation) {
        // Если не нашли первый ход в вариации, возвращаем историю без изменений
        return history;
    }

    // Удаляем всю вариацию, содержащую этот ход
    const historyWithRemovedVariation = removeVariationContainingMove(updatedHistory, firstMoveInVariation);

    return historyWithRemovedVariation;
}
