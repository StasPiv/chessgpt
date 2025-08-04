<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class HealthController extends Controller
{
    public function index()
    {
        return response()->json([
            'status' => 'ok',
            'message' => 'ChessGPT API is running',
            'timestamp' => now(),
            'version' => '1.0.0'
        ]);
    }
}