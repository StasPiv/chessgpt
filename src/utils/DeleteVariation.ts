
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
 * Добавляет ссылки next и previous для каждого хода в массиве
 * @param moves - массив ходов для связывания
 */
const linkMovesInArray = (moves: any[]): void => {
    for (let i = 0; i < moves.length; i++) {
        moves[i].next = i < moves.length - 1 ? moves[i + 1] : null;
        moves[i].previous = i > 0 ? moves[i - 1] : null;
    }
};

/**
 * Рекурсивно добавляет ссылки next и previous ко всем ходам в истории, включая вариации
 * @param history - история ходов для связывания
 */
const linkAllMovesRecursively = (history: any[]): void => {
    // Связываем основную линию
    linkMovesInArray(history);

    // Рекурсивно обрабатываем вариации
    history.forEach(move => {
        if (move.variations && Array.isArray(move.variations)) {
            move.variations.forEach((variation: any[]) => {
                linkAllMovesRecursively(variation);
            });
        }
    });
};

/**
 * Рекурсивно ищет ход по globalIndex в истории ходов, включая все вариации
 * @param moves - массив ходов для поиска
 * @param targetGlobalIndex - globalIndex искомого хода
 * @returns найденный ход или null если не найден
 */
const searchInHistory = (moves: any[], targetGlobalIndex: number): any | null => {
    for (const move of moves) {
        if (move.globalIndex === targetGlobalIndex) {
            return move;
        }

        // Search in variations
        if (move.variations && move.variations.length > 0) {
            for (const variation of move.variations) {
                const moveInVariation = searchInHistory(variation, targetGlobalIndex);
                if (moveInVariation) {
                    return moveInVariation;
                }
            }
        }
    }
    return null;
};

/**
 * Находит родительский ход для указанного хода в вариации
 * @param history - полная история ходов
 * @param targetMove - ход, для которого нужно найти родителя
 * @returns родительский ход или null если не найден
 */
const findParentMoveOfVariation = (history: any[], targetMove: any): any | null => {
    const searchForParent = (moves: any[]): any | null => {
        for (const move of moves) {
            // Если у хода есть вариации, ищем в них
            if (move.variations && move.variations.length > 0) {
                for (const variation of move.variations) {
                    // Проверяем, есть ли targetMove в этой вариации
                    const foundInVariation = variation.find((varMove: any) => varMove.globalIndex === targetMove.globalIndex);
                    if (foundInVariation) {
                        return move; // Возвращаем родительский ход
                    }

                    // Рекурсивно ищем в подвариациях
                    const foundInDeepVariation = searchForParent(variation);
                    if (foundInDeepVariation) {
                        return foundInDeepVariation;
                    }
                }
            }
        }
        return null;
    };

    return searchForParent(history);
};

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
 * Результат удаления вариации
 */
interface DeleteVariationResult {
    updatedHistory: any[];
    newCurrentMove: any | null;
}

/**
 * Удаляет вариацию, содержащую указанный ход
 * @param currentMove - ход, вариацию которого нужно удалить
 * @param history - история ходов
 * @param withLinks - если true, добавляет ссылки next/previous к ходам
 * @returns объект с обновленной историей и новым текущим ходом
 */
export function deleteVariation(
    currentMove: any,
    history: any[],
    withLinks: boolean = false
): DeleteVariationResult {
    // Безопасно клонируем историю для избежания мутации
    const updatedHistory = safeClone(history);

    // Проверяем, находится ли currentMove в основной линии
    const isInMainLine = updatedHistory.some((move: any) => move.globalIndex === currentMove.globalIndex);

    if (isInMainLine) {
        // Если ход в основной линии, удалять нечего - возвращаем историю без изменений
        return {
            updatedHistory: history,
            newCurrentMove: currentMove
        };
    }

    // Находим родительский ход для currentMove
    const parentMove = findParentMoveOfVariation(updatedHistory, currentMove);

    if (!parentMove) {
        // Если не нашли родительский ход, возвращаем историю без изменений
        return {
            updatedHistory: history,
            newCurrentMove: currentMove
        };
    }

    // Находим первый ход в вариации, содержащей currentMove
    const firstMoveInVariation = findFirstMoveInVariation(updatedHistory, currentMove);

    if (!firstMoveInVariation) {
        // Если не нашли первый ход в вариации, возвращаем историю без изменений
        return {
            updatedHistory: history,
            newCurrentMove: currentMove
        };
    }

    // Удаляем всю вариацию, содержащую этот ход
    const historyWithRemovedVariation = removeVariationContainingMove(updatedHistory, firstMoveInVariation);

    // Добавляем ссылки next/previous ко всем ходам в обновленной истории, если требуется
    if (withLinks) {
        linkAllMovesRecursively(historyWithRemovedVariation);
    }

    // Находим родительский ход в обновленной истории (с учетом возможных изменений после линковки)
    const newCurrentMove = searchInHistory(historyWithRemovedVariation, parentMove.globalIndex);

    return {
        updatedHistory: historyWithRemovedVariation,
        newCurrentMove: newCurrentMove || parentMove
    };
}