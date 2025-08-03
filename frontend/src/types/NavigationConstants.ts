import { NavigationIcons, KeyNavigationMap } from './NavigationControls';

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
