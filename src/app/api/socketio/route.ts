import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  return NextResponse.json({ message: 'Socket.io endpoint - use WebSocket connection' });
}

export async function POST(request: NextRequest) {
  return NextResponse.json({ message: 'Socket.io endpoint - use WebSocket connection' });
}

