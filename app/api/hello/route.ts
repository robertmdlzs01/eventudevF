import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    message: 'Hello from Vercel API!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
}