import { NextRequest, NextResponse } from 'next/server'

// Proxy para las rutas de plantillas de boletos
// Redirige las peticiones al backend

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://dev1.eventu.co'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const queryString = searchParams.toString()
    
    const response = await fetch(`${API_URL}/api/admin/ticket-templates${queryString ? `?${queryString}` : ''}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const data = await response.json()
    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error('Error fetching ticket templates:', error)
    return NextResponse.json(
      { success: false, error: 'Error al obtener plantillas' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const response = await fetch(`${API_URL}/api/admin/ticket-templates`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    const data = await response.json()
    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error('Error saving ticket template:', error)
    return NextResponse.json(
      { success: false, error: 'Error al guardar plantilla' },
      { status: 500 }
    )
  }
}


