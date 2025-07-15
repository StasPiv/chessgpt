import { PgnKeyboardShortcuts, PgnValidationOptions } from './LoadPgn';

// Default keyboard shortcuts
export const DEFAULT_PGN_SHORTCUTS: PgnKeyboardShortcuts = {
    load: 'Ctrl+Enter',
    clear: 'Ctrl+Delete',
    selectAll: 'Ctrl+A'
};

// Default validation options
export const DEFAULT_VALIDATION_OPTIONS: PgnValidationOptions = {
    strictMode: false,
    validateMoves: true,
    validateHeaders: true,
    allowMultipleGames: false,
    maxFileSize: 1024 * 1024 // 1MB
};

// Common PGN placeholders
export const PGN_PLACEHOLDERS = {
    default: 'Paste PGN text here... (Ctrl+Enter to load)',
    loading: 'Loading PGN...',
    error: 'PGN contains errors. Please check and try again.',
    empty: 'Enter PGN notation here',
    multiGame: 'Paste multiple PGN games here...'
};

// PGN error messages
export const PGN_ERROR_MESSAGES = {
    invalid_format: 'Invalid PGN format',
    missing_headers: 'Required PGN headers are missing',
    invalid_moves: 'Invalid move notation detected',
    parsing_error: 'Error parsing PGN text',
    network_error: 'Network error while loading PGN',
    file_error: 'Error reading PGN file',
    too_large: 'PGN file is too large',
    empty_pgn: 'PGN text is empty'
};

// Common CSS classes
export const PGN_CSS_CLASSES = {
    container: 'pgn-container',
    textarea: 'pgn-textarea',
    actions: 'pgn-actions',
    loadButton: 'pgn-load-button',
    cancelButton: 'pgn-cancel-button',
    clearButton: 'pgn-clear-button',
    validateButton: 'pgn-validate-button',
    validation: 'pgn-validation',
    error: 'pgn-error',
    warning: 'pgn-warning',
    valid: 'pgn-valid',
    loading: 'pgn-loading'
};
