import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json({ success: true });
  
  // Elimina i cookie
  response.cookies.delete('admin_access_token');
  response.cookies.delete('admin_refresh_token');
  
  return response;
}