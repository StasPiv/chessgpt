/**
 * Добавляет новый ход к текущему ходу и обновляет историю ходов
 * @param {Object} newMove - Объект нового хода
 * @param {Object|null} currentMove - Объект текущего хода
 * @param {Array} history - История ходов
 * @returns {Object} Объект с обновленным currentMove и history
 */
export function addMoveToHistory(newMove, currentMove, history) {
    // Функция для добавления хода в нужное место
    function addMoveToCorrectLocation(history, currentMove, newMove) {
        if (!currentMove) {
            // Если нет текущего хода, добавляем в начало главной линии
            return [newMove];
        }

        // Если мы в главной линии (currentMove.globalIndex < 1000), добавляем в конец главной линии
        if (currentMove.globalIndex < 1000) {
            return [...history, newMove];
        }

        // Если мы в варианте, нужно добавить ход в конец этого варианта
        function updateInHistory(moves) {
            return moves.map(move => {
                if (move.globalIndex === currentMove.globalIndex) {
                    return {
                        ...move,
                        next: newMove
                    };
                }

                // Обновляем в вариациях
                if (move.variations && move.variations.length > 0) {
                    return {
                        ...move,
                        variations: move.variations.map(variation => {
                            // Проверяем, содержит ли эта вариация текущий ход
                            const containsCurrentMove = variation.some(varMove => 
                                varMove.globalIndex === currentMove.globalIndex
                            );
                            
                            if (containsCurrentMove) {
                                // Добавляем новый ход в конец этой вариации
                                return [...variation, newMove];
                            }
                            
                            return updateInHistory(variation);
                        })
                    };
                }

                return move;
            });
        }

        return updateInHistory(history);
    }

    // Функция для обновления ссылки next в предыдущем ходе
    function updatePreviousMoveNext(history, currentMove, newMove) {
        if (!currentMove) return history;

        function updateInHistory(moves) {
            return moves.map(move => {
                if (move.globalIndex === currentMove.globalIndex) {
                    return {
                        ...move,
                        next: newMove
                    };
                }

                // Обновляем в вариациях
                if (move.variations && move.variations.length > 0) {
                    return {
                        ...move,
                        variations: move.variations.map(variation => updateInHistory(variation))
                    };
                }

                return move;
            });
        }

        return updateInHistory(history);
    }

    // Добавляем ход в нужное место
    const newHistory = addMoveToCorrectLocation(history, currentMove, newMove);
    const updatedHistory = updatePreviousMoveNext(newHistory, currentMove, newMove);

    return {
        updatedCurrentMove: newMove,
        updatedHistory: updatedHistory
    };
}

/**
 * Добавляет новый ход как вариацию к следующему ходу после текущего
 * @param {Object} newMove - Объект нового хода (вариации)
 * @param {Object} currentMove - Объект текущего хода (должен иметь next)
 * @param {Array} history - История ходов
 * @returns {Object} Объект с обновленной историей
 */
export function addVariationToHistory(newMove, currentMove, history) {
    // Функция для добавления хода в variations следующего хода
    function addMoveToVariations(history, currentMove, newMove) {
        function updateInHistory(moves) {
            return moves.map(move => {
                if (move.globalIndex === currentMove.next.globalIndex) {
                    // Инициализируем variations если не существует
                    const variations = move.variations || [];
                    return {
                        ...move,
                        variations: [...variations, [newMove]]
                    };
                }
                
                // Обновляем в вариациях
                if (move.variations && move.variations.length > 0) {
                    return {
                        ...move,
                        variations: move.variations.map(variation => updateInHistory(variation))
                    };
                }
                
                return move;
            });
        }

        return updateInHistory(history);
    }

    const updatedHistory = addMoveToVariations(history, currentMove, newMove);
    
    return {
        updatedHistory: updatedHistory
    };
}