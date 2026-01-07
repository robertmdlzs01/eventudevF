import { NextRequest, NextResponse } from 'next/server'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://dev1.eventu.co'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const response = await fetch(`${API_URL}/api/admin/ticket-templates/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const data = await response.json()
    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error('Error fetching ticket template:', error)
    return NextResponse.json(
      { success: false, error: 'Error al obtener plantilla' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const response = await fetch(`${API_URL}/api/admin/ticket-templates/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const data = await response.json()
    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error('Error deleting ticket template:', error)
    return NextResponse.json(
      { success: false, error: 'Error al eliminar plantilla' },
      { status: 500 }
    )
  }
}


