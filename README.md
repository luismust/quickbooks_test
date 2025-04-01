# Quickbook - Aplicación de Tests Estáticos

## Descripción

Quickbook es una aplicación para crear y administrar tests interactivos con soporte para diferentes tipos de preguntas, incluyendo preguntas con imágenes.

## Características

- Creación de tests con diferentes tipos de preguntas
- Soporte para imágenes en las preguntas
- Exportación estática para usar en cualquier servidor
- Interfaz de usuario intuitiva y responsiva

## Configuración

### Variables de Entorno

Para el correcto funcionamiento de la aplicación, configura las siguientes variables de entorno en un archivo `.env.local`:

```
# Airtable (Backend)
AIRTABLE_API_KEY=tu_api_key
AIRTABLE_BASE_ID=tu_base_id
AIRTABLE_TABLE_NAME=Tests
AIRTABLE_TABLE_IMAGES=Images

# URL del Backend
NEXT_PUBLIC_BACKEND_URL=https://tu-backend-url.vercel.app
```

### Estructura de Airtable

Esta aplicación requiere dos tablas en Airtable:

1. **Tests** - Para almacenar los tests creados
   - Campos: id, name, description, questions, max_score, min_score, created_at, passing_message, failing_message

2. **Images** - Para almacenar imágenes (requerido para referencias de imágenes)
   - Campos: ID, Image, Created, Description

## Desarrollo Local

```bash
# Instalar dependencias
pnpm install

# Iniciar servidor de desarrollo
pnpm dev

# Construir para producción
pnpm build

# Servir archivos estáticos
npx serve out
```

## Gestión de Imágenes

La aplicación maneja las imágenes de dos formas:

1. **Directamente en el test**: Las imágenes se almacenan como base64 o URLs dentro del test.
2. **Referencias**: Las imágenes se almacenan en Airtable y se referencian con el formato `image_reference_ID`.

### Para utilizar referencias de imágenes:

1. Configura la tabla `Images` en Airtable.
2. Asegúrate de que el backend esté configurado con los endpoints para imágenes:
   - `GET /api/images/[id]` - Para obtener una imagen por ID
   - `POST /api/images/upload` - Para subir una nueva imagen

3. En el frontend, utiliza los hooks y utilidades proporcionados para manejar las referencias:
   - `useImageReference` - Hook para cargar imágenes a partir de referencias
   - `loadImageFromReference` - Función para cargar imágenes desde el backend

## Documentación

Consulta la documentación detallada en la carpeta `docs/`:

- [Configuración del Backend](docs/backend-setup.md)
- [Integración del Frontend](docs/frontend-integration.md)
- [Ejemplos de Endpoints](docs/example-endpoints.md)

## Licencia

MIT 