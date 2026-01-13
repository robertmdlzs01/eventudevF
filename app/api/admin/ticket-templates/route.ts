import { NextRequest, NextResponse } from 'next/server'

// Proxy para las rutas de plantillas de boletos
// Redirige las peticiones al backend

// Asegurar que la URL del backend incluya el protocolo y no termine con /
const getBackendUrl = () => {
  const url = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002'
  return url.endsWith('/') ? url.slice(0, -1) : url
}

const API_URL = getBackendUrl()

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const queryString = searchParams.toString()
    
    // Obtener token de autenticación si está disponible
    const authHeader = request.headers.get('authorization')
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    }
    if (authHeader) {
      headers['Authorization'] = authHeader
    }
    
    const response = await fetch(`${API_URL}/api/admin/ticket-templates${queryString ? `?${queryString}` : ''}`, {
      method: 'GET',
      headers,
    })

    // Verificar si la respuesta es JSON antes de parsear
    const contentType = response.headers.get('content-type')
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text()
      console.error('Backend returned non-JSON response:', text.substring(0, 200))
      return NextResponse.json(
        { success: false, error: 'El servidor devolvió una respuesta no válida', details: text.substring(0, 100) },
        { status: response.status || 500 }
      )
    }

    const data = await response.json()
    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error('Error fetching ticket templates:', error)
    return NextResponse.json(
      { success: false, error: 'Error al obtener plantillas', details: error instanceof Error ? error.message : 'Error desconocido' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Obtener token de autenticación si está disponible
    const authHeader = request.headers.get('authorization')
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    }
    if (authHeader) {
      headers['Authorization'] = authHeader
    }
    
    const response = await fetch(`${API_URL}/api/admin/ticket-templates`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    })

    // Verificar si la respuesta es JSON antes de parsear
    const contentType = response.headers.get('content-type')
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text()
      console.error('Backend returned non-JSON response:', text.substring(0, 200))
      return NextResponse.json(
        { success: false, error: 'El servidor devolvió una respuesta no válida', details: text.substring(0, 100) },
        { status: response.status || 500 }
      )
    }

    const data = await response.json()
    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error('Error saving ticket template:', error)
    return NextResponse.json(
      { success: false, error: 'Error al guardar plantilla', details: error instanceof Error ? error.message : 'Error desconocido' },
      { status: 500 }
    )
  }
}



