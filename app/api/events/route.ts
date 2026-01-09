import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const featured = searchParams.get('featured');
    const limit = searchParams.get('limit');

    // Construir query base
    let query = supabase
      .from('events')
      .select(`
        *,
        categories:category_id(name),
        users:organizer_id(first_name, last_name)
      `)
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    // Filtrar eventos destacados
    if (featured === 'true') {
      query = query.eq('featured', true);
    }

    // Limitar resultados
    if (limit) {
      const limitNum = parseInt(limit);
      query = query.limit(limitNum);
    }

    const { data: events, error } = await query;

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { success: false, message: 'Error al obtener eventos' },
        { status: 500 }
      );
    }

    // Transformar datos para el frontend
    const transformedEvents = events?.map(event => ({
      id: event.id,
      title: event.title,
      slug: event.slug,
      description: event.description,
      date: event.date,
      time: event.time,
      venue: event.venue,
      location: event.location,
      category: event.categories ? { id: event.category_id, name: event.categories.name } : null,
      organizer: event.users ? { id: event.organizer_id, name: `${event.users.first_name} ${event.users.last_name}` } : null,
      total_capacity: event.total_capacity,
      sold: event.sold,
      price: event.price,
      status: event.status,
      featured: event.featured,
      image: event.image_url || '/placeholder.jpg',
      locationDisplay: event.location,
      categoryDisplay: event.categories?.name || 'Sin categoría'
    })) || [];

    return NextResponse.json({
      success: true,
      data: transformedEvents,
      total: transformedEvents.length
    });

  } catch (error) {
    console.error('Events API error:', error);
    return NextResponse.json(
      { success: false, message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const eventData = await request.json();

    // Validar datos requeridos
    if (!eventData.title || !eventData.date || !eventData.venue) {
      return NextResponse.json(
        { success: false, message: 'Datos requeridos faltantes' },
        { status: 400 }
      );
    }

    // Crear slug único
    const slug = eventData.title.toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .trim();

    // Insertar evento
    const { data: newEvent, error } = await supabase
      .from('events')
      .insert({
        title: eventData.title,
        slug: slug,
        description: eventData.description || null,
        date: eventData.date,
        time: eventData.time || '20:00',
        venue: eventData.venue,
        location: eventData.location || '',
        category_id: eventData.category_id || null,
        organizer_id: eventData.organizer_id || 2, // Default organizer
        total_capacity: eventData.total_capacity || 0,
        sold: 0,
        price: eventData.price || 0,
        status: 'active',
        featured: eventData.featured || false,
        image_url: eventData.image_url || null
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { success: false, message: 'Error al crear evento' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Evento creado exitosamente',
      data: newEvent
    }, { status: 201 });

  } catch (error) {
    console.error('Create event error:', error);
    return NextResponse.json(
      { success: false, message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}