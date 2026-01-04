import { NextResponse } from 'next/server'
import { getSyncStatus } from '@/lib/sports-sync'

export async function GET() {
  try {
    const status = await getSyncStatus()
    
    return NextResponse.json(status)
  } catch (error) {
    console.error('Error getting sync status:', error)
    return NextResponse.json(
      { error: 'Failed to get sync status' },
      { status: 500 }
    )
  }
}



