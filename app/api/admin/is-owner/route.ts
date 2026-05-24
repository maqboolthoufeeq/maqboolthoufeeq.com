import { NextResponse } from 'next/server'
import { isOwnerSession } from '@/lib/admin-guard'

export async function GET() {
  const isOwner = await isOwnerSession()
  return NextResponse.json({ isOwner })
}
