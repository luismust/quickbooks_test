import { NextResponse } from 'next/server';

// Ruta dinámica para obtener imágenes por ID desde Airtable
export async function GET(request: Request, { params }: { params: { id: string } }) {
  const id = params.id;
  
  try {
    console.log('Received request for image ID:', id);

    // Verificar si tenemos las variables de entorno necesarias
    const apiKey = process.env.AIRTABLE_API_KEY;
    const baseId = process.env.AIRTABLE_BASE_ID;
    const tableImages = process.env.AIRTABLE_TABLE_IMAGES || 'Images';

    if (!apiKey || !baseId) {
      console.warn('Airtable credentials not found in environment variables');
      
      // Para desarrollo, devolver una imagen de prueba
      const testImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAMAAABHPGVmAAAA21BMVEUAAAD///+/v7+ZmZmqqqqZmZmfn5+dnZ2ampqcnJycnJybm5ubm5uampqampqampqampqbm5uampqampqbm5uampqampqampqampqampqampqampqampqampqampqampqampqampqampqampqampqamp///+YmJiZmZmampqbm5ucnJydnZ2enp6fnp6fn5+gn5+gn6CgoKChoKChoaGioaGioqKjoqKjo6Ojo6SkpKSlpaWmpqanp6eoqKiqqqpTU1MAAAB8A5ZEAAAARnRSTlMAAQIEBQUGBwcLDBMUFRYaGxwdNjxRVVhdYGRnaWptcXV2eHp7fX5/gISGiImKjI2OkJKTlZebnKCio6Slqq+2uL6/xdDfsgWO3gAAAWhJREFUeNrt1sdSwzAUBVAlkRJaGi33il2CYNvpvZP//6OEBVmWM+PIGlbhncWTcbzwNNb1ZwC8mqDZMaENiXBJVGsCE5KUKbE1GZNURlvLjfUTjC17JNvbgYzUW3qpKxJllJYwKyIw0mSsCRlWBkLhDGTJGE3WEF3KEnGdJYRGlrqKtJEn1A0hWp4w1xBNnlA3kFg5wlzD2o0M4a4j0jJEXEciZQh3A9HkCHMD0fOEuI7IyhGxhojyhLiG6HlCXUdYOcLdRER5Qt1AJDnC3MQ6ZQhxHWvJEu4GIsoR6jrWljKEu4VlP9eMeS5wt5CWpV2WNKqUlPMdKo7oa4jEd2qoqM1DpwVGWp0jmqd+7JQYa/oqsnQ4EfWdSsea8O/yCTgc/3FMSLnUwA8xJhQq44HQB1zySOBCZx8Y3H4mJF8XOJTEBELr8IfzXECYf+fQJ0LO16JvRA5PCK92GMP/FIB3YUC2pHrS/6AAAAAASUVORK5CYII=';
      return NextResponse.json({
        id,
        url: testImage,
        message: 'Using test image (Airtable credentials not configured)'
      });
    }

    // Construir la URL para la API de Airtable
    // Primero intentamos buscar el registro con ese ID
    const url = `https://api.airtable.com/v0/${baseId}/${tableImages}`;
    
    // Hacer solicitud a Airtable para obtener la imagen
    const response = await fetch(`${url}?filterByFormula={ID}="${id}"`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Error fetching from Airtable: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Airtable response:', data);

    // Verificar si encontró algún registro
    if (!data.records || data.records.length === 0) {
      console.warn(`No image found with ID: ${id}`);
      throw new Error('Image not found');
    }

    // Obtener la URL de la imagen del primer registro encontrado
    const record = data.records[0];
    const fields = record.fields;
    
    // Verificar si el registro tiene un campo 'Image' o 'Attachment' con la imagen
    if (fields.Image && fields.Image.length > 0 && fields.Image[0].url) {
      // Si tenemos la URL directa de la imagen
      return NextResponse.json({
        id,
        url: fields.Image[0].url,
        message: 'Image loaded successfully from Airtable'
      });
    } else if (fields.Attachment && fields.Attachment.length > 0 && fields.Attachment[0].url) {
      // Alternativa si el campo se llama 'Attachment'
      return NextResponse.json({
        id,
        url: fields.Attachment[0].url,
        message: 'Image loaded successfully from Airtable'
      });
    } else if (fields.imageData) {
      // Si la imagen está almacenada como datos base64
      return NextResponse.json({
        id,
        url: fields.imageData,
        message: 'Image loaded successfully from Airtable (base64)'
      });
    } else {
      console.warn('Found record but no image field present:', fields);
      throw new Error('Image record found but no image data available');
    }
  } catch (error) {
    console.error('Error loading image from Airtable:', error);
    
    // Para desarrollo/pruebas, devolver una imagen de respaldo en caso de error
    const fallbackImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAMAAABHPGVmAAAA21BMVEUAAAD///+/v7+ZmZmqqqqZmZmfn5+dnZ2ampqcnJycnJybm5ubm5uampqampqampqampqbm5uampqampqbm5uampqampqampqampqampqampqampqampqampqampqampqampqampqampqampqampqamp///+YmJiZmZmampqbm5ucnJydnZ2enp6fnp6fn5+gn5+gn6CgoKChoKChoaGioaGioqKjoqKjo6Ojo6SkpKSlpaWmpqanp6eoqKiqqqpTU1MAAAB8A5ZEAAAARnRSTlMAAQIEBQUGBwcLDBMUFRYaGxwdNjxRVVhdYGRnaWptcXV2eHp7fX5/gISGiImKjI2OkJKTlZebnKCio6Slqq+2uL6/xdDfsgWO3gAAAWhJREFUeNrt1sdSwzAUBVAlkRJaGi33il2CYNvpvZP//6OEBVmWM+PIGlbhncWTcbzwNNb1ZwC8mqDZMaENiXBJVGsCE5KUKbE1GZNURlvLjfUTjC17JNvbgYzUW3qpKxJllJYwKyIw0mSsCRlWBkLhDGTJGE3WEF3KEnGdJYRGlrqKtJEn1A0hWp4w1xBNnlA3kFg5wlzD2o0M4a4j0jJEXEciZQh3A9HkCHMD0fOEuI7IyhGxhojyhLiG6HlCXUdYOcLdRER5Qt1AJDnC3MQ6ZQhxHWvJEu4GIsoR6jrWljKEu4VlP9eMeS5wt5CWpV2WNKqUlPMdKo7oa4jEd2qoqM1DpwVGWp0jmqd+7JQYa/oqsnQ4EfWdSsea8O/yCTgc/3FMSLnUwA8xJhQq44HQB1zySOBCZx8Y3H4mJF8XOJTEBELr8IfzXECYf+fQJ0LO16JvRA5PCK92GMP/FIB3YUC2pHrS/6AAAAAASUVORK5CYII=';
    
    return NextResponse.json({
      id,
      url: fallbackImage,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Error occurred, using fallback image'
    }, { status: 200 }); // Devolvemos 200 con imagen de respaldo en lugar de error
  }
}

// Necesario para Next.js App Router en modo estático
export const dynamic = 'force-dynamic'; 