<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Laravel\Socialite\Facades\Socialite;

class GoogleController extends Controller
{
    public function redirect()
    {
        // Проверяем конфигурацию перед редиректом
        $clientId = config('services.google.client_id');
        $clientSecret = config('services.google.client_secret');
        $redirectUri = config('services.google.redirect');
        
        Log::info('Google OAuth config check:', [
            'client_id' => $clientId ? 'SET' : 'NOT SET',
            'client_secret' => $clientSecret ? 'SET' : 'NOT SET',
            'redirect_uri' => $redirectUri,
        ]);
        
        if (!$clientId || !$clientSecret) {
            Log::error('Google OAuth not configured properly');
            return redirect(env('FRONTEND_URL', 'http://localhost:9000') . '/login?error=config_error');
        }
        
        return Socialite::driver('google')->redirect();
    }

    public function callback(Request $request)
    {
        try {
            // Логируем параметры запроса
            Log::info('Google callback parameters:', $request->all());
            
            // Проверяем наличие параметра error
            if ($request->has('error')) {
                Log::error('Google OAuth returned error:', [
                    'error' => $request->get('error'),
                    'error_description' => $request->get('error_description')
                ]);
                return redirect(env('FRONTEND_URL', 'http://localhost:9000') . '/login?error=oauth_denied');
            }
            
            $googleUser = Socialite::driver('google')->user();
            
            Log::info('Google user data:', [
                'id' => $googleUser->id,
                'name' => $googleUser->name,
                'email' => $googleUser->email,
                'avatar' => $googleUser->avatar,
            ]);
            
            $user = User::where('email', $googleUser->email)->first();
            
            if ($user) {
                // Обновляем Google ID если его нет
                if (!$user->google_id) {
                    $user->update(['google_id' => $googleUser->id]);
                }
                Auth::login($user);
            } else {
                $user = User::create([
                    'name' => $googleUser->name,
                    'email' => $googleUser->email,
                    'google_id' => $googleUser->id,
                    'avatar' => $googleUser->avatar,
                    'email_verified_at' => now(),
                    'password' => bcrypt(str()->random(32)),
                ]);
                
                Auth::login($user);
            }
            
            Log::info('User authenticated successfully:', ['user_id' => $user->id]);
            
            return redirect(env('FRONTEND_URL', 'http://localhost:9000'));
            
        } catch (\Exception $e) {
            Log::error('Google OAuth error:', [
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return redirect(env('FRONTEND_URL', 'http://localhost:9000') . '/login?error=oauth_failed&message=' . urlencode($e->getMessage()));
        }
    }
}