import { NextResponse } from 'next/server'
import { syncSportsData } from '@/lib/sports-sync'

export async function POST() {
  try {
    const result = await syncSportsData()
    
    if (result.errors.length > 0) {
      return NextResponse.json(
        {
          ...result,
          warning: 'Sync completed with errors',
        },
        { status: 207 } // Multi-Status
      )
    }
    
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error syncing sports data:', error)
    return NextResponse.json(
      { error: 'Failed to sync sports data' },
      { status: 500 }
    )
  }
}


