
/**
 * Результат поиска хода в истории
 */
interface MoveSearchResult {
    foundMove: any;           // Найденный ход (с перенесенными вариациями + parentLine)
    parentMove: any | null;   // Родительский ход (без вариаций)
    parentLine: any[];        // Вся линия родительского хода (без вариаций)
    foundLine: any[];         // Вся линия найденного хода (без вариаций)
    updatedHistory: any[];    // История с удаленной parentLine
}

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
 * Строит линию ходов, начиная с указанного хода и продолжая до конца его линии
 * @param history - полная история ходов
 * @param startMove - начальный ход, с которого строить линию
 * @returns массив ходов в линии, начиная с startMove
 */
const buildLineFromMove = (history: any[], startMove: any): any[] => {
    const line: any[] = [];

    // Рекурсивно находим ход и строим его линию
    const findAndBuildLine = (moves: any[], currentIndex: number = 0): boolean => {
        for (let i = currentIndex; i < moves.length; i++) {
            const move = moves[i];

            if (move.globalIndex === startMove.globalIndex) {
                // Найден стартовый ход - добавляем все ходы начиная с него
                for (let j = i; j < moves.length; j++) {
                    line.push(moves[j]);
                }
                return true;
            }

            // Ищем в вариациях
            if (move.variations && move.variations.length > 0) {
                for (const variation of move.variations) {
                    if (findAndBuildLine(variation, 0)) {
                        return true;
                    }
                }
            }
        }
        return false;
    };

    // Если не удалось найти в рекурсивном поиске, возвращаем только сам ход
    if (!findAndBuildLine(history)) {
        line.push(startMove);
    }

    return line;
};

/**
 * Строит линию ходов из вариации, начиная с указанного хода и продолжая до конца вариации
 * @param variation - массив ходов вариации
 * @param startMove - начальный ход, с которого строить линию
 * @returns массив ходов в линии, начиная с startMove
 */
const buildLineFromVariation = (variation: any[], startMove: any): any[] => {
    const line: any[] = [];

    // Находим индекс начального хода в вариации
    const startIndex = variation.findIndex(move => move.globalIndex === startMove.globalIndex);

    if (startIndex !== -1) {
        // Добавляем все ходы начиная с найденного
        for (let i = startIndex; i < variation.length; i++) {
            line.push(variation[i]);
        }
    } else {
        // Если не найден в вариации, возвращаем только сам ход
        line.push(startMove);
    }

    return line;
};

/**
 * Создает глубокую копию хода без вариаций
 * @param move - исходный ход
 * @returns копия хода без вариаций
 */
const cloneMoveWithoutVariations = (move: any): any => {
    const clonedMove = safeClone(move);

    if (clonedMove.variations) {
        delete clonedMove.variations;
    }

    return clonedMove;
};

/**
 * Создает глубокую копию хода с перенесенными вариациями и добавленной родительской линией
 * @param move - исходный ход
 * @param variationsToTransfer - массив вариаций для переноса
 * @param parentLineToAdd - родительская линия для добавления как вариация
 * @returns копия хода с новыми вариациями
 */
const cloneMoveWithTransferredVariationsAndParentLine = (move: any, variationsToTransfer: any[], parentLineToAdd: any[]): any => {
    const clonedMove = safeClone(move);

    // Собираем все вариации
    const existingVariations = clonedMove.variations || [];
    const allVariations = [...existingVariations, ...variationsToTransfer];

    // Добавляем родительскую линию как дополнительную вариацию, если она не пустая
    if (parentLineToAdd && parentLineToAdd.length > 0) {
        // Создаем копию родительской линии без вариаций для каждого хода
        const parentLineVariation = updateParentLineWithoutVariations(parentLineToAdd, parentLineToAdd[0]);
        allVariations.push(parentLineVariation);
    }

    if (allVariations.length > 0) {
        clonedMove.variations = allVariations;
    } else {
        delete clonedMove.variations;
    }

    return clonedMove;
};

/**
 * Обновляет линию ходов, заменяя родительский ход на версию без вариаций
 * @param parentLine - исходная линия ходов
 * @param parentMove - родительский ход
 * @returns обновленная линия ходов без вариаций у родительского хода
 */
const updateParentLineWithoutVariations = (parentLine: any[], parentMove: any): any[] => {
    return parentLine.map(move => {
        if (move.globalIndex === parentMove.globalIndex) {
            // Только у parentMove удаляем вариации
            return cloneMoveWithoutVariations(move);
        }
        // У остальных ходов сохраняем вариации
        return safeClone(move);
    });
};

/**
 * Обновляет линию найденного хода, очищая вариации у всех ходов
 * @param foundLine - исходная линия найденного хода
 * @returns обновленная линия без вариаций у всех ходов
 */
const updateFoundLineWithoutVariations = (foundLine: any[]): any[] => {
    return foundLine.map(move => safeClone(move));
};

/**
 * Заменяет ходы из parentLine на ходы из foundLine в истории ходов (включая все вложенные вариации)
 * @param history - история ходов
 * @param parentLine - линия ходов для замены
 * @param foundLine - линия ходов, на которую заменяем
 * @returns история с замененными ходами
 */
const replaceParentLineWithFoundLine = (history: any[], parentLine: any[], foundLine: any[]): any[] => {
    if (parentLine.length === 0) {
        return foundLine.length > 0 ? [...foundLine, ...history] : history;
    }

    if (foundLine.length === 0) {
        // Если foundLine пустая, просто удаляем parentLine
        const parentLineIndices = new Set(parentLine.map(move => move.globalIndex));

        const filterMovesRecursively = (moves: any[]): any[] => {
            return moves
                .filter(move => !parentLineIndices.has(move.globalIndex))
                .map(move => {
                    if (move.variations && move.variations.length > 0) {
                        const filteredVariations = move.variations
                            .map((variation: any[]) => filterMovesRecursively(variation))
                            .filter((variation: any[]) => variation.length > 0);

                        return {
                            ...move,
                            variations: filteredVariations.length > 0 ? filteredVariations : undefined
                        };
                    }

                    return move;
                });
        };

        return filterMovesRecursively(history);
    }

    // Создаем Set из globalIndex ходов в parentLine для быстрого поиска
    const parentLineIndices = new Set(parentLine.map(move => move.globalIndex));

    /**
     * Рекурсивно обрабатывает массив ходов, заменяя parentLine на foundLine
     * @param moves - массив ходов для обработки
     * @param shouldInsertFoundLine - нужно ли вставить foundLine в этом месте
     * @returns обработанный массив ходов
     */
    const processMovesRecursively = (moves: any[], shouldInsertFoundLine: boolean = false): any[] => {
        const result: any[] = [];
        let foundLineInserted = false;

        for (let i = 0; i < moves.length; i++) {
            const move = moves[i];

            // Если это ход из parentLine
            if (parentLineIndices.has(move.globalIndex)) {
                // Вставляем foundLine только один раз и только на месте первого хода parentLine
                if (!foundLineInserted && shouldInsertFoundLine) {
                    result.push(...foundLine);
                    foundLineInserted = true;
                }
                // Пропускаем все остальные ходы из parentLine
                continue;
            }

            // Если у хода есть вариации, рекурсивно обрабатываем их
            if (move.variations && move.variations.length > 0) {
                const processedVariations: any[][] = [];

                for (const variation of move.variations) {
                    // Проверяем, есть ли в этой вариации ходы из parentLine
                    const hasParentLineMoves = variation.some((varMove: any) =>
                        parentLineIndices.has(varMove.globalIndex)
                    );

                    const processedVariation = processMovesRecursively(variation, hasParentLineMoves);

                    // Добавляем вариацию только если она не пустая
                    if (processedVariation.length > 0) {
                        processedVariations.push(processedVariation);
                    }
                }

                // Обновляем ход с обработанными вариациями
                result.push({
                    ...move,
                    variations: processedVariations.length > 0 ? processedVariations : undefined
                });
            } else {
                // Обычный ход без вариаций
                result.push(move);
            }
        }

        // Если foundLine не была вставлена, но должна быть (например, parentLine была в конце)
        if (!foundLineInserted && shouldInsertFoundLine) {
            result.push(...foundLine);
        }

        return result;
    };

    // Находим позицию первого хода из parentLine
    let isInMainLine = false;

    // Проверяем, находится ли первый ход parentLine в основной линии
    for (let i = 0; i < history.length; i++) {
        if (parentLineIndices.has(history[i].globalIndex)) {
            isInMainLine = true;
            break;
        }
    }

    // Если parentLine находится в основной линии
    if (isInMainLine) {
        return processMovesRecursively(history, true);
    } else {
        // parentLine находится в вариациях, обрабатываем рекурсивно
        return processMovesRecursively(history, false);
    }
};

/**
 * Расширенный поиск хода с информацией о родителе и его линии
 * @param moves - массив ходов для поиска
 * @param targetGlobalIndex - globalIndex искомого хода
 * @param fullHistory - полная история для построения линии родителя
 * @returns результат поиска с найденным ходом, его родителем и линией родителя, или null если не найден
 */
const searchMoveWithParentInfo = (moves: any[], targetGlobalIndex: number, fullHistory: any[]): MoveSearchResult | null => {
    // Проходим по всем ходам в текущем массиве
    for (const move of moves) {
        // Проверяем, является ли текущий ход искомым
        if (move.globalIndex === targetGlobalIndex) {
            // Ход найден в основной линии, у него нет родителя
            // Строим линию найденного хода из основной линии
            const originalFoundLine = buildLineFromMove(fullHistory, move);
            const updatedFoundLine = updateFoundLineWithoutVariations(originalFoundLine);

            // Заменяем первый элемент foundLine на найденный ход (с вариациями)
            if (updatedFoundLine.length > 0) {
                updatedFoundLine[0] = move;
            }

            return {
                foundMove: move,
                parentMove: null,
                parentLine: [],
                foundLine: updatedFoundLine,
                updatedHistory: fullHistory // История не изменяется, так как нет parentLine для замены
            };
        }

        // Если у хода есть вариации, ищем в них рекурсивно
        if (move.variations && move.variations.length > 0) {
            for (let variationIndex = 0; variationIndex < move.variations.length; variationIndex++) {
                const variation = move.variations[variationIndex];

                // Ищем в данной вариации
                for (const varMove of variation) {
                    if (varMove.globalIndex === targetGlobalIndex) {
                        // Ход найден в вариации

                        // Получаем все остальные вариации (кроме текущей с найденным ходом)
                        const otherVariations = move.variations.filter((_: any, index: number) => index !== variationIndex);

                        // Создаем родительский ход без вариаций
                        const parentMoveWithoutVariations = cloneMoveWithoutVariations(move);

                        // Строим линию родительского хода без вариаций
                        const originalParentLine = buildLineFromMove(fullHistory, move);
                        const updatedParentLine = updateParentLineWithoutVariations(originalParentLine, move);

                        // Строим линию найденного хода из его вариации
                        const originalFoundLine = buildLineFromVariation(variation, varMove);
                        const updatedFoundLine = updateFoundLineWithoutVariations(originalFoundLine);

                        // Создаем копию найденного хода с перенесенными вариациями И добавленной родительской линией
                        const foundMoveWithTransferredVariationsAndParentLine = cloneMoveWithTransferredVariationsAndParentLine(
                            varMove,
                            otherVariations,
                            updatedParentLine
                        );

                        // Заменяем первый элемент foundLine на найденный ход (с вариациями)
                        if (updatedFoundLine.length > 0) {
                            updatedFoundLine[0] = foundMoveWithTransferredVariationsAndParentLine;
                        }

                        // Заменяем parentLine на foundLine в истории
                        const historyWithReplacedLine = replaceParentLineWithFoundLine(fullHistory, updatedParentLine, updatedFoundLine);

                        return {
                            foundMove: foundMoveWithTransferredVariationsAndParentLine,
                            parentMove: parentMoveWithoutVariations,
                            parentLine: updatedParentLine,
                            foundLine: updatedFoundLine,
                            updatedHistory: historyWithReplacedLine
                        };
                    }
                }

                // Рекурсивно ищем глубже в вариации
                const foundInDeepVariation = searchMoveWithParentInfo(variation, targetGlobalIndex, fullHistory);
                if (foundInDeepVariation) {
                    return foundInDeepVariation;
                }
            }
        }
    }

    // Ход не найден
    return null;
};

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
 * Находит первый ход в линии, содержащей указанный ход
 * @param history - полная история ходов
 * @param targetMove - ход, для которого нужно найти первый ход в линии
 * @returns первый ход в линии или null если не найден
 */
const findFirstMoveInLine = (history: any[], targetMove: any): any | null => {
    // Рекурсивно ищем targetMove и определяем первый ход его линии
    const searchForFirstMoveInLine = (moves: any[]): any | null => {
        for (let i = 0; i < moves.length; i++) {
            const move = moves[i];

            // Если это искомый ход и он в основной линии - он и есть первый в своей линии
            if (move.globalIndex === targetMove.globalIndex) {
                return moves[0]; // Возвращаем первый ход основной линии
            }

            // Если у хода есть вариации, ищем в них
            if (move.variations && move.variations.length > 0) {
                for (const variation of move.variations) {
                    // Проверяем, есть ли targetMove в этой вариации
                    const foundInVariation = variation.find((varMove: any) => varMove.globalIndex === targetMove.globalIndex);
                    if (foundInVariation) {
                        return variation[0]; // Возвращаем первый ход в вариации
                    }

                    // Рекурсивно ищем в подвариациях
                    const foundInDeepVariation = searchForFirstMoveInLine(variation);
                    if (foundInDeepVariation) {
                        return foundInDeepVariation;
                    }
                }
            }
        }
        return null;
    };

    return searchForFirstMoveInLine(history);
};

/**
 * Продвигает вариацию в основную линию
 * @param currentMove - текущий ход для продвижения
 * @param history - история ходов
 * @param withLinks - если true, добавляет ссылки next/previous к ходам
 * @returns обновленная история ходов
 */
export function promoteVariationLink(
    currentMove: any,
    history: any[],
    withLinks: boolean = false
): any {
    // Безопасно клонируем историю для избежания мутации
    const updatedHistory = safeClone(history);

    // Находим первый ход в линии currentMove
    const firstMoveInCurrentLine = findFirstMoveInLine(updatedHistory, currentMove);

    // Ищем currentMove в истории
    const searchResult = searchMoveWithParentInfo(updatedHistory, firstMoveInCurrentLine.globalIndex, updatedHistory);

    // Если ход не найден, возвращаем историю без изменений
    if (!searchResult) {
        return history;
    }

    // Если ход найден в основной линии (нет родителя), то продвигать нечего
    if (!searchResult.parentMove) {
        return history;
    }

    // Добавляем ссылки next/previous ко всем ходам в обновленной истории, если требуется
    if (withLinks) {
        linkAllMovesRecursively(searchResult.updatedHistory);
    }

    return searchResult.updatedHistory;
}