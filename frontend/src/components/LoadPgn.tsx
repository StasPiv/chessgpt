import React, { useState, useCallback, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { loadPGNAction } from '../redux/actions.js';
import {
    LoadPgnProps,
    PgnInputState,
    PgnValidationResult,
    PgnKeyboardEventHandler,
    PgnTextareaChangeHandler,
    PgnLoadingState,
    PgnError
} from '../types';
import { 
    DEFAULT_PGN_SHORTCUTS, 
    PGN_PLACEHOLDERS, 
    PGN_ERROR_MESSAGES, 
    PGN_CSS_CLASSES 
} from '../types/PgnConstants';
import './LoadPgn.scss';

const LoadPgn: React.FC<LoadPgnProps> = ({
    onClose,
    onLoad,
    onChange,
    className = '',
    showValidation = true,
    showClearButton = false,
    showValidateButton = false,
    autoValidate = false,
    placeholder = PGN_PLACEHOLDERS.default,
    maxLength = 50000,
    rows = 10,
    cols = 60,
    disabled = false,
    initialValue = '',
    keyboard = DEFAULT_PGN_SHORTCUTS
}) => {
    const dispatch = useDispatch();
    
    // PGN input state
    const [pgnState, setPgnState] = useState<PgnInputState>({
        value: initialValue,
        validation: { isValid: true },
        validationState: 'none',
        hasUnsavedChanges: false
    });

    // Loading state
    const [loadingState, setLoadingState] = useState<PgnLoadingState>({
        isLoading: false
    });

    // Basic PGN validation
    const validatePgn = useCallback((pgn: string): PgnValidationResult => {
        if (!pgn.trim()) {
            return {
                isValid: false,
                error: PGN_ERROR_MESSAGES.empty_pgn
            };
        }

        // Basic format validation
        const hasGameEnd = /\s+(1-0|0-1|1\/2-1\/2|\*)\s*$/.test(pgn);
        const hasHeaders = /\[.*\]/.test(pgn);
        const hasMoves = /\d+\./.test(pgn);

        if (!hasHeaders && !hasMoves) {
            return {
                isValid: false,
                error: PGN_ERROR_MESSAGES.invalid_format
            };
        }

        const warnings: string[] = [];
        
        if (!hasHeaders) {
            warnings.push('No PGN headers found');
        }
        
        if (!hasGameEnd) {
            warnings.push('Game result not found');
        }

        return {
            isValid: true,
            warnings: warnings.length > 0 ? warnings : undefined
        };
    }, []);

    // Handle PGN text change
    const handlePgnChange: PgnTextareaChangeHandler = useCallback((event) => {
        const newValue = event.target.value;
        
        // Update state
        const newState: PgnInputState = {
            value: newValue,
            validation: autoValidate ? validatePgn(newValue) : { isValid: true },
            validationState: autoValidate ? 'validating' : 'none',
            hasUnsavedChanges: newValue !== initialValue
        };
        
        setPgnState(newState);
        
        // Call onChange callback if provided
        if (onChange) {
            onChange(newValue, newState.validation);
        }
    }, [autoValidate, validatePgn, onChange, initialValue]);

    // Handle PGN loading
    const handleLoadPGN = useCallback(() => {
        if (!pgnState.value.trim() || disabled) {
            return;
        }

        setLoadingState({ isLoading: true, status: 'Loading PGN...' });

        try {
            // Validate PGN before loading
            const validation = validatePgn(pgnState.value);
            
            if (!validation.isValid) {
                setPgnState(prev => ({
                    ...prev,
                    validation,
                    validationState: 'invalid'
                }));
                setLoadingState({ isLoading: false });
                return;
            }

            // Dispatch Redux action
            dispatch(loadPGNAction(pgnState.value));
            
            // Call onLoad callback if provided
            if (onLoad) {
                onLoad(pgnState.value);
            }
            
            // Reset state
            setPgnState(prev => ({
                ...prev,
                value: '',
                hasUnsavedChanges: false,
                validation: { isValid: true },
                validationState: 'none'
            }));
            
            // Close dialog if callback provided
            if (onClose) {
                onClose();
            }
            
        } catch (error) {
            console.error('Error loading PGN:', error);
            setPgnState(prev => ({
                ...prev,
                validation: {
                    isValid: false,
                    error: PGN_ERROR_MESSAGES.parsing_error
                },
                validationState: 'invalid'
            }));
        } finally {
            setLoadingState({ isLoading: false });
        }
    }, [pgnState.value, disabled, validatePgn, dispatch, onLoad, onClose]);

    // Handle PGN clearing
    const handleClearPGN = useCallback(() => {
        setPgnState({
            value: '',
            validation: { isValid: true },
            validationState: 'none',
            hasUnsavedChanges: false
        });
        
        if (onChange) {
            onChange('', { isValid: true });
        }
    }, [onChange]);

    // Handle validation
    const handleValidate = useCallback(() => {
        const validation = validatePgn(pgnState.value);
        setPgnState(prev => ({
            ...prev,
            validation,
            validationState: validation.isValid ? 'valid' : 'invalid'
        }));
    }, [pgnState.value, validatePgn]);

    // Handle keyboard shortcuts
    const handleKeyDown: PgnKeyboardEventHandler = useCallback((event) => {
        const isCtrlEnter = event.key === 'Enter' && event.ctrlKey;
        const isCtrlDelete = event.key === 'Delete' && event.ctrlKey;
        
        if (isCtrlEnter) {
            event.preventDefault();
            handleLoadPGN();
        } else if (isCtrlDelete && showClearButton) {
            event.preventDefault();
            handleClearPGN();
        }
    }, [handleLoadPGN, handleClearPGN, showClearButton]);

    // Effect for auto-validation
    useEffect(() => {
        if (autoValidate && pgnState.value.trim()) {
            const timeoutId = setTimeout(() => {
                const validation = validatePgn(pgnState.value);
                setPgnState(prev => ({
                    ...prev,
                    validation,
                    validationState: validation.isValid ? 'valid' : 'invalid'
                }));
            }, 500); // Debounce validation
            
            return () => clearTimeout(timeoutId);
        }
    }, [autoValidate, pgnState.value, validatePgn]);

    // Determine if load button should be disabled
    const isLoadDisabled = !pgnState.value.trim() || disabled || loadingState.isLoading;

    return (
        <div className={`${PGN_CSS_CLASSES.container} ${className}`}>
            <textarea
                className={`${PGN_CSS_CLASSES.textarea} ${
                    pgnState.validationState === 'invalid' ? PGN_CSS_CLASSES.error : ''
                } ${pgnState.validationState === 'valid' ? PGN_CSS_CLASSES.valid : ''}`}
                value={pgnState.value}
                onChange={handlePgnChange}
                onKeyDown={handleKeyDown}
                placeholder={loadingState.isLoading ? PGN_PLACEHOLDERS.loading : placeholder}
                rows={rows}
                cols={cols}
                maxLength={maxLength}
                disabled={disabled || loadingState.isLoading}
                autoFocus
                spellCheck={false}
                autoComplete="off"
                aria-label="PGN input"
                aria-describedby={showValidation ? 'pgn-validation' : undefined}
            />
            
            {/* Validation display */}
            {showValidation && (pgnState.validation.error || pgnState.validation.warnings) && (
                <div id="pgn-validation" className={PGN_CSS_CLASSES.validation}>
                    {pgnState.validation.error && (
                        <div className={PGN_CSS_CLASSES.error}>
                            Error: {pgnState.validation.error}
                        </div>
                    )}
                    {pgnState.validation.warnings && pgnState.validation.warnings.map((warning, index) => (
                        <div key={index} className={PGN_CSS_CLASSES.warning}>
                            Warning: {warning}
                        </div>
                    ))}
                </div>
            )}
            
            {/* Loading indicator */}
            {loadingState.isLoading && (
                <div className={PGN_CSS_CLASSES.loading}>
                    {loadingState.status || 'Loading...'}
                </div>
            )}
            
            {/* Action buttons */}
            <div className={PGN_CSS_CLASSES.actions}>
                <button
                    className={PGN_CSS_CLASSES.loadButton}
                    onClick={handleLoadPGN}
                    disabled={isLoadDisabled}
                    title={`Load PGN (${keyboard.load})`}
                    aria-label="Load PGN"
                >
                    {loadingState.isLoading ? 'Loading...' : 'Load PGN'}
                </button>
                
                {showClearButton && (
                    <button
                        className={PGN_CSS_CLASSES.clearButton}
                        onClick={handleClearPGN}
                        disabled={!pgnState.value.trim() || disabled}
                        title={`Clear PGN (${keyboard.clear})`}
                        aria-label="Clear PGN"
                    >
                        Clear
                    </button>
                )}
                
                {showValidateButton && (
                    <button
                        className={PGN_CSS_CLASSES.validateButton}
                        onClick={handleValidate}
                        disabled={!pgnState.value.trim() || disabled}
                        title="Validate PGN"
                        aria-label="Validate PGN"
                    >
                        Validate
                    </button>
                )}
                
                {onClose && (
                    <button
                        className={PGN_CSS_CLASSES.cancelButton}
                        onClick={onClose}
                        disabled={disabled}
                        title="Cancel"
                        aria-label="Cancel"
                    >
                        Cancel
                    </button>
                )}
            </div>
        </div>
    );
};

export default LoadPgn;