// Navigation button types
export type NavigationDirection = 'first' | 'previous' | 'next' | 'last';

// Navigation button configuration
export interface NavigationButton {
    direction: NavigationDirection;
    symbol: string;
    title: string;
    disabled: boolean;
    onClick: () => void;
}

// Keyboard navigation keys
export type NavigationKey = 'ArrowLeft' | 'ArrowRight' | 'Home' | 'End';

// Key mapping for navigation
export interface KeyNavigationMap {
    [key: string]: NavigationDirection;
}

// Navigation state interface
export interface NavigationState {
    currentMoveIndex: number;
    fullHistoryLength: number;
    isAtStart: boolean;
    isAtEnd: boolean;
    hasHistory: boolean;
}

// Position indicator information
export interface PositionIndicator {
    current: number;
    total: number;
    displayText: string;
}

// Board flip callback
export type FlipBoardCallback = () => void;

// Navigation action handlers
export interface NavigationHandlers {
    handleFirst: () => void;
    handlePrevious: () => void;
    handleNext: () => void;
    handleLast: () => void;
}

// NavigationControls component props
export interface NavigationControlsProps {
    onFlipBoard: FlipBoardCallback;
    isFlipped: boolean;
    className?: string;
    showPositionIndicator?: boolean;
    compact?: boolean;
}

// Keyboard event handler type
export type KeyboardEventHandler = (event: KeyboardEvent) => void;

// Navigation button icon mapping
export interface NavigationIcons {
    first: string;
    previous: string;
    next: string;
    last: string;
    flip: string;
}

// Default navigation icons
export const DEFAULT_NAVIGATION_ICONS: NavigationIcons = {
    first: '⏮',
    previous: '◀',
    next: '▶',
    last: '⏭',
    flip: '🔄'
};

// Key to navigation direction mapping
export const KEY_NAVIGATION_MAP: KeyNavigationMap = {
    'ArrowLeft': 'previous',
    'ArrowRight': 'next',
    'Home': 'first',
    'End': 'last'
};
