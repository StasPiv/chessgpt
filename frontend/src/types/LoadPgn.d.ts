// PGN validation result
export interface PgnValidationResult {
    isValid: boolean;
    error?: string;
    warnings?: string[];
}

// PGN parsing result
export interface PgnParseResult {
    isValid: boolean;
    games?: PgnGame[];
    error?: string;
}

// PGN game structure
export interface PgnGame {
    headers: PgnHeaders;
    moves: string;
    result: GameResult;
}

// PGN validation states
export type PgnValidationState = 'none' | 'validating' | 'valid' | 'invalid';

// PGN input state
export interface PgnInputState {
    value: string;
    validation: PgnValidationResult;
    validationState: PgnValidationState;
    hasUnsavedChanges: boolean;
}

// PGN textarea configuration
export interface PgnTextareaConfig {
    placeholder: string;
    rows?: number;
    cols?: number;
    maxLength?: number;
    spellCheck?: boolean;
    autoComplete?: 'off' | 'on';
}

// PGN keyboard shortcuts
export interface PgnKeyboardShortcuts {
    load: string; // "Ctrl+Enter"
    clear: string; // "Ctrl+Delete"
    selectAll: string; // "Ctrl+A"
}

// PGN action buttons configuration
export interface PgnActionButton {
    label: string;
    action: () => void;
    disabled?: boolean;
    className?: string;
    title?: string;
    shortcut?: string;
}

// PGN buttons configuration
export interface PgnButtonsConfig {
    load: PgnActionButton;
    cancel?: PgnActionButton;
    clear?: PgnActionButton;
    validate?: PgnActionButton;
}

// Close callback type
export type PgnCloseCallback = () => void;

// PGN load callback type
export type PgnLoadCallback = (pgn: string) => void;

// PGN change callback type
export type PgnChangeCallback = (pgn: string, validation: PgnValidationResult) => void;

// Keyboard event handler for PGN
export type PgnKeyboardEventHandler = (event: React.KeyboardEvent<HTMLTextAreaElement>) => void;

// Text area change handler
export type PgnTextareaChangeHandler = (event: React.ChangeEvent<HTMLTextAreaElement>) => void;

// LoadPgn component props
export interface LoadPgnProps {
    onClose?: PgnCloseCallback;
    onLoad?: PgnLoadCallback;
    onChange?: PgnChangeCallback;
    className?: string;
    showValidation?: boolean;
    showClearButton?: boolean;
    showValidateButton?: boolean;
    autoValidate?: boolean;
    placeholder?: string;
    maxLength?: number;
    rows?: number;
    cols?: number;
    disabled?: boolean;
    initialValue?: string;
    keyboard?: PgnKeyboardShortcuts;
}

// PGN loading state
export interface PgnLoadingState {
    isLoading: boolean;
    progress?: number;
    status?: string;
}

// PGN error types
export type PgnErrorType = 
    | 'invalid_format'
    | 'missing_headers'
    | 'invalid_moves'
    | 'parsing_error'
    | 'network_error'
    | 'file_error';

// PGN error interface
export interface PgnError {
    type: PgnErrorType;
    message: string;
    line?: number;
    column?: number;
    details?: any;
}

// PGN validation options
export interface PgnValidationOptions {
    strictMode?: boolean;
    validateMoves?: boolean;
    validateHeaders?: boolean;
    allowMultipleGames?: boolean;
    maxFileSize?: number;
}

// Default PGN configuration
export const DEFAULT_PGN_CONFIG: Required<Omit<LoadPgnProps, 'onClose' | 'onLoad' | 'onChange'>> = {
    className: '',
    showValidation: true,
    showClearButton: false,
    showValidateButton: false,
    autoValidate: false,
    placeholder: 'Paste PGN text here... (Ctrl+Enter to load)',
    maxLength: 50000,
    rows: 10,
    cols: 60,
    disabled: false,
    initialValue: '',
    keyboard: {
        load: 'Ctrl+Enter',
        clear: 'Ctrl+Delete',
        selectAll: 'Ctrl+A'
    }
};
