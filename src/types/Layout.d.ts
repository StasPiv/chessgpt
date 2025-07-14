import { Layout, Layouts } from 'react-grid-layout';

export type BreakpointKey = 'lg' | 'md' | 'sm' | 'xs' | 'xxs';

export interface LayoutItem {
    i: string;
    x: number;
    y: number;
    w: number;
    h: number;
    minW: number;
    minH: number;
}

export interface CustomLayouts {
    lg: LayoutItem[];
    md: LayoutItem[];
    sm: LayoutItem[];
}

export interface CustomLayoutProps {
    className?: string;
}

export interface LayoutChangeCallback {
    (layout: Layout[], allLayouts: Layouts): void;
}