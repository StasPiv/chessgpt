import { Layout, Layouts } from 'react-grid-layout';

export type BreakpointKey = 'lg';

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
}

export interface CustomLayoutProps {
    className?: string;
}

export interface LayoutChangeCallback {
    (layout: Layout[], allLayouts: Layouts): void;
}