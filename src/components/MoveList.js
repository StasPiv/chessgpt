import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { gotoMoveAction } from '../redux/actions.js';
import './MoveList.css';
import GameHeader from "./GameHeader.js";

const MoveList = () => {
    const dispatch = useDispatch();
    const history = useSelector(state => state.chess.history);
    const currentMoveIndex = useSelector(state => state.chess.currentMoveIndex);
    const currentVariationPath = useSelector(state => state.chess.currentVariationPath);

    // New block-based indexing algorithm
    const createBlockBasedIndex = () => {
        const BLOCK_SIZE = 1000;
        const moveMap = new Map(); // globalIndex -> moveInfo
        const reverseMap = new Map(); // pathKey -> globalIndex
        let currentBlockIndex = 0;
        
        // Индексация основной линии (блок 0: 0-999)
        const indexMainLine = () => {
            const mainLineIndexes = [];
            const blockStart = currentBlockIndex * BLOCK_SIZE;
            
            for (let i = 0; i < history.length; i++) {
                const globalIndex = blockStart + i;
                mainLineIndexes.push(globalIndex);
                
                moveMap.set(globalIndex, {
                    type: 'main',
                    moveIndex: i,
                    move: history[i],
                    san: history[i].san,
                    fen: history[i].fen,
                    globalIndex: globalIndex,
                    block: currentBlockIndex,
                    variationPath: [] // Пустой путь для основной линии
                });
                
                reverseMap.set(`main-${i}`, globalIndex);
            }
            
            return mainLineIndexes;
        };
        
        // Индексация ветки (каждая ветка получает свой блок)
        const indexBranch = (moves, pathToParent, parentMoveIndex, variationIndex) => {
            currentBlockIndex++; // Переходим к следующему блоку
            const blockStart = currentBlockIndex * BLOCK_SIZE;
            const branchIndexes = [];
            
            moves.forEach((move, moveIndex) => {
                const globalIndex = blockStart + moveIndex;
                branchIndexes.push(globalIndex);
                
                // Создаем путь для этого хода варианта
                const variationPath = [
                    { type: 'main', index: parentMoveIndex },
                    { type: 'variation', variationIndex: variationIndex },
                    { type: 'move', moveIndex: moveIndex }
                ];
                
                moveMap.set(globalIndex, {
                    type: 'variation',
                    moveIndex: moveIndex,
                    move: move,
                    san: move.san,
                    fen: move.fen,
                    pathToParent: pathToParent,
                    globalIndex: globalIndex,
                    block: currentBlockIndex,
                    variationPath: variationPath,
                    parentMoveIndex: parentMoveIndex,
                    variationIndex: variationIndex
                });
                
                // Создаем уникальный ключ для этого хода в ветке
                const pathKey = `${pathToParent}-${moveIndex}`;
                reverseMap.set(pathKey, globalIndex);
                
                console.log(`Indexed variation move: ${move.san} with pathKey: ${pathKey} and globalIndex: ${globalIndex}`);
            });
            
            return branchIndexes;
        };
        
        // Рекурсивная функция для обработки всех веток
        const processVariations = (moves, currentPath = 'main', parentMoveIndexInPath = 0) => {
            moves.forEach((move, moveIndex) => {
                if (move.variations && move.variations.length > 0) {
                    move.variations.forEach((variation, varIndex) => {
                        // Создаем путь для этой ветки
                        const branchPath = `${currentPath}-${moveIndex}-${varIndex}`;
                        
                        console.log(`Processing variation at path: ${branchPath}`);
                        
                        // Определяем правильный parentMoveIndex для Redux
                        const actualParentMoveIndex = currentPath === 'main' ? moveIndex : parentMoveIndexInPath;
                        
                        // Индексируем текущую ветку
                        const branchIndexes = indexBranch(variation, branchPath, actualParentMoveIndex, varIndex);
                        
                        // Рекурсивно обрабатываем вложенные варианты
                        processVariations(variation, branchPath, actualParentMoveIndex);
                    });
                }
            });
        };
        
        // Выполняем индексацию
        const mainLineIndexes = indexMainLine();
        processVariations(history);
        
        console.log('Block-based indexing completed:');
        console.log('Main line indexes:', mainLineIndexes);
        console.log('Total blocks used:', currentBlockIndex + 1);
        console.log('Full move map:', moveMap);
        console.log('Reverse map:', reverseMap);
        
        return { moveMap, mainLineIndexes, reverseMap };
    };

    const { moveMap: globalMoveMap, mainLineIndexes, reverseMap } = createBlockBasedIndex();

    const handleMoveClick = (globalIndex) => {
        const moveInfo = globalMoveMap.get(globalIndex);
        
        if (!moveInfo) {
            console.error('Move not found for globalIndex:', globalIndex);
            return;
        }
        
        // Отправляем глобальный индекс и FEN позицию
        dispatch(gotoMoveAction({
            globalIndex: globalIndex,
            fen: moveInfo.fen,
            variationPath: moveInfo.variationPath
        }));
    };

    // Упрощенная функция проверки текущего хода
    const isCurrentMove = (globalIndex) => {
        return globalIndex === currentMoveIndex;
    };

    // Function to render variations with nested support
    const renderVariations = (variations, parentMoveIndex, currentPath = 'main') => {
        if (!variations || variations.length === 0) return null;
        
        return variations.map((variation, varIndex) => (
            <span key={`var-${varIndex}`} className="variation">
                <span className="variation-bracket">(</span>
                {renderVariationSequence(variation, parentMoveIndex, varIndex, currentPath)}
                <span className="variation-bracket">)</span>
            </span>
        ));
    };

    // Function to render move sequence in variation with nested support
    const renderVariationSequence = (moves, parentMoveIndex, variationIndex, currentPath = 'main') => {
        const branchPath = `${currentPath}-${parentMoveIndex}-${variationIndex}`;
        
        return moves.map((move, moveIndex) => {
            // Fix logic for move number determination
            const parentMoveNumber = Math.floor(parentMoveIndex / 2) + 1;
            const isParentWhiteMove = parentMoveIndex % 2 === 0;
            
            const isFirstMoveInVariation = moveIndex === 0;
            
            let moveNumber, isWhiteMove, display;
            
            if (isFirstMoveInVariation) {
                // First move in variation - alternative to parent move
                if (isParentWhiteMove) {
                    // If parent move is white's move, variation offers alternative white move
                    moveNumber = parentMoveNumber;
                    display = `${moveNumber}.${move.san}`;
                } else {
                    // If parent move is black's move, variation offers alternative black move
                    moveNumber = parentMoveNumber;
                    display = `${moveNumber}...${move.san}`;
                }
            } else {
                // For subsequent moves in variation
                const movesFromStart = moveIndex;
                if (isParentWhiteMove) {
                    // Started with alternative white move, now moves alternate
                    isWhiteMove = movesFromStart % 2 === 0;
                    if (isWhiteMove) {
                        moveNumber = parentMoveNumber + Math.floor(movesFromStart / 2);
                        display = `${moveNumber}.${move.san}`;
                    } else {
                        display = move.san;
                    }
                } else {
                    // Started with alternative black move, now moves alternate
                    isWhiteMove = movesFromStart % 2 === 1;
                    if (isWhiteMove) {
                        moveNumber = parentMoveNumber + Math.floor((movesFromStart + 1) / 2);
                        display = `${moveNumber}.${move.san}`;
                    } else {
                        display = move.san;
                    }
                }
            }
            
            // Получаем глобальный индекс для этого хода варианта
            const pathKey = `${branchPath}-${moveIndex}`;
            const globalIndex = reverseMap.get(pathKey);
            
            console.log(`Looking for pathKey: ${pathKey}, found globalIndex: ${globalIndex}`);
            
            return (
                <span key={globalIndex || `var-move-${moveIndex}`}>
                    <span 
                        className={`move-item variation-move ${isCurrentMove(globalIndex) ? 'current' : ''}`}
                        onClick={() => handleMoveClick(globalIndex)}
                        title={`Variation move: ${display} (Global index: ${globalIndex})`}
                    >
                        {display}
                    </span>
                    {/* Рекурсивно обрабатываем вложенные варианты */}
                    {move.variations && renderVariations(move.variations, 
                        moveIndex, branchPath)}
                    {moveIndex < moves.length - 1 ? ' ' : ''}
                </span>
            );
        });
    };

    // Main render of move list
    const renderMovesList = () => {
        const result = [];
        
        for (let i = 0; i < history.length; i++) {
            const move = history[i];
            const moveNumber = Math.floor(i / 2) + 1;
            const isWhiteMove = i % 2 === 0;
            
            let display = '';
            if (isWhiteMove) {
                display = `${moveNumber}.${move.san}`;
            } else {
                display = move.san;
            }
            
            // Используем глобальный индекс для основной линии
            const globalIndex = mainLineIndexes[i];
            
            result.push(
                <span 
                    key={globalIndex} 
                    className={`move-item ${isCurrentMove(globalIndex) ? 'current' : ''}`}
                    onClick={() => handleMoveClick(globalIndex)}
                    title={`Move ${i + 1}: ${display} (Global index: ${globalIndex})`}
                >
                    {display}
                </span>
            );
            
            // Add variations after move
            if (move.variations && move.variations.length > 0) {
                result.push(
                    <span key={`variations-${i}`} className="variations-container">
                        {' '}
                        {renderVariations(move.variations, i, 'main')}
                    </span>
                );
            }
            
            // Add space between moves
            if (i < history.length - 1) {
                result.push(' ');
            }
        }
        
        return result;
    };

    return (
        <div className="move-list-container">
            <div className="moves-container">
                {history.length === 0 ? (
                    <div className="no-moves">No moves yet</div>
                ) : (
                    <div className="moves-list">
                        <GameHeader />
                        {renderMovesList()}
                    </div>
                )}
            </div>
        </div>
    );
};

export default MoveList;