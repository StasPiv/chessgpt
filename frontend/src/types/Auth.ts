export interface User {
    id: number;
    name: string;
    email: string;
    avatar?: string;
}

export interface AuthResponse {
    authenticated: boolean;
    user: User | null;
}

export interface UseAuthReturn {
    user: User | null;
    authenticated: boolean;
    loading: boolean;
    checkAuth: () => Promise<void>;
    logout: () => Promise<void>;
}
