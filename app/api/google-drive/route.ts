import { google } from 'googleapis'
import { Readable } from 'stream'
import { NextResponse } from 'next/server'

// Configuración de la API de Google Drive
const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: process.env.GOOGLE_DRIVE_CLIENT_EMAIL,
    private_key: process.env.GOOGLE_DRIVE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  },
  scopes: ['https://www.googleapis.com/auth/drive.file'],
})

const drive = google.drive({ version: 'v3', auth })

// IDs de las carpetas
const TESTS_FOLDER_ID = process.env.NEXT_PUBLIC_GOOGLE_DRIVE_TESTS_FOLDER_ID
const IMAGES_FOLDER_ID = process.env.NEXT_PUBLIC_GOOGLE_DRIVE_FOLDER_ID

export async function POST(req: Request) {
  try {
    // Detectar el tipo de contenido
    const contentType = req.headers.get('content-type') || '';
    
    // Variables para almacenar datos de la solicitud
    let file: File | null = null;
    let action: string | null = null;
    let data: any = null;

    // Manejar formData (para subidas de archivos)
    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      file = formData.get('file') as File || null;
      action = formData.get('action') as string || null;
      const dataStr = formData.get('data') as string;
      if (dataStr) {
        try {
          data = JSON.parse(dataStr);
        } catch (e) {
          console.error('Error parsing form data JSON:', e);
        }
      }
    } 
    // Manejar x-www-form-urlencoded (para datos del test)
    else if (contentType.includes('application/x-www-form-urlencoded')) {
      const formData = await req.formData();
      action = formData.get('action') as string || null;
      const dataStr = formData.get('data') as string;
      if (dataStr) {
        try {
          data = JSON.parse(dataStr);
        } catch (e) {
          console.error('Error parsing form data JSON:', e);
        }
      }
    } 
    // Manejar application/json (para compatibilidad)
    else if (contentType.includes('application/json')) {
      const jsonData = await req.json();
      action = jsonData.action || null;
      data = jsonData.data || null;
    }
    else {
      return NextResponse.json({ error: 'Unsupported content type' }, { status: 415 });
    }

    console.log('Request processed:', { action, hasFile: !!file, hasData: !!data });

    // Procesar subida de archivo
    if (file) {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const stream = Readable.from(buffer);

      const response = await drive.files.create({
        requestBody: {
          name: file.name,
          mimeType: file.type,
          parents: [IMAGES_FOLDER_ID!],
        },
        media: {
          mimeType: file.type,
          body: stream,
        },
        fields: 'id',
      });

      if (!response.data.id) {
        throw new Error('No file ID returned from Google Drive');
      }

      // Hacer el archivo público
      await drive.permissions.create({
        fileId: response.data.id,
        requestBody: {
          role: 'reader',
          type: 'anyone',
        },
      });

      return NextResponse.json({ url: `https://drive.google.com/uc?id=${response.data.id}` });
    }

    // Procesar otras operaciones basadas en action
    if (!action) {
      return NextResponse.json({ error: 'No action specified' }, { status: 400 });
    }

    switch (action) {
      case 'uploadTest':
        if (!TESTS_FOLDER_ID) {
          throw new Error('Tests folder ID not configured');
        }

        if (!data) {
          return NextResponse.json({ error: 'No test data provided' }, { status: 400 });
        }

        console.log('Uploading test:', data.id);
        const testData = data;
        const response = await drive.files.list({
          q: `name = 'test_${testData.id}.json' and '${TESTS_FOLDER_ID}' in parents`,
          fields: 'files(id, name)',
        });

        const existingFile = response.data.files?.[0];
        const jsonContent = JSON.stringify(testData, null, 2);
        const jsonBuffer = Buffer.from(jsonContent);
        const jsonStream = Readable.from(jsonBuffer);

        if (existingFile) {
          await drive.files.update({
            fileId: existingFile.id!,
            requestBody: { name: `test_${testData.id}.json` },
            media: { mimeType: 'application/json', body: jsonStream },
          });
        } else {
          await drive.files.create({
            requestBody: {
              name: `test_${testData.id}.json`,
              mimeType: 'application/json',
              parents: [TESTS_FOLDER_ID],
            },
            media: { mimeType: 'application/json', body: jsonStream },
          });
        }

        return NextResponse.json({ success: true });

      case 'getTest':
        const testId = data.testId
        const testResponse = await drive.files.list({
          q: `name = 'test_${testId}.json' and '${TESTS_FOLDER_ID}' in parents`,
          fields: 'files(id, name)',
        })

        const testFile = testResponse.data.files?.[0]
        if (!testFile) {
          return NextResponse.json({ error: 'Test not found' }, { status: 404 })
        }

        const testContent = await drive.files.get({
          fileId: testFile.id!,
          alt: 'media',
        })

        return NextResponse.json(testContent.data)

      case 'getImage':
        const fileId = data.fileId
        const fileResponse = await drive.files.get({
          fileId,
          fields: 'id, name, mimeType',
        })

        if (fileResponse.data.mimeType?.startsWith('image/')) {
          return NextResponse.json({ url: `https://drive.google.com/uc?id=${fileId}` })
        }

        return NextResponse.json({ error: 'File is not an image' }, { status: 400 })

      case 'deleteImage':
        const imageId = data.fileId
        await drive.files.delete({
          fileId: imageId,
        })

        return NextResponse.json({ success: true })

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('Error in Google Drive API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 