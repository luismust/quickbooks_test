"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ImageMap } from "@/components/image-map"
import { DrawingToolbar } from "@/components/drawing-toolbar"
import { toast, useToast } from "@/components/ui/use-toast"
import { Link, Square, Pencil } from "lucide-react"

// Mejorar la función generateId para ser más robusta y única
const generateId = (() => {
  let counter = Date.now();
  const prefix = Math.random().toString(36).substring(2, 5);
  return () => {
    counter += 1;
    return `area_${prefix}_${counter}_${Math.random().toString(36).slice(2, 5)}`;
  };
})();

interface Area {
  id: string
  shape: "rect"
  coords: number[]
  isCorrect: boolean
  x?: number
  y?: number
  width?: number
  height?: number
}

interface ImageAreaSelectorProps {
  image: string
  areas: Area[]
  onChange: (data: { image?: string; areas?: Area[]; originalImage?: string }) => void
  isEditMode?: boolean
  onSaveAreas?: (areas: Area[]) => Promise<void>
}

const getGoogleDriveImageUrl = (url: string): string | null => {
  try {
    // Patrones de URL de Google Drive
    const patterns = {
      view: /\/file\/d\/([^/]+)\/view/,
      open: /\/open\?id=([^&]+)/,
      direct: /id=([^&]+)/
    }

    let fileId: string | null = null

    // Buscar el ID en los diferentes formatos
    for (const [key, pattern] of Object.entries(patterns)) {
      const match = url.match(pattern)
      if (match && match[1]) {
        fileId = match[1].split('?')[0]
        break
      }
    }

    if (!fileId) return null

    // Usar un proxy de imágenes para evitar problemas de CORS
    const googleDriveUrl = `https://drive.google.com/uc?export=view&id=${fileId}`
    return `https://images.weserv.nl/?url=${encodeURIComponent(googleDriveUrl)}`
  } catch (error) {
    console.error('Error processing Google Drive URL:', error)
    return null
  }
}

export function ImageAreaSelector({ image, areas = [], onChange, isEditMode = true, onSaveAreas }: ImageAreaSelectorProps) {
  const [isDrawingMode, setIsDrawingMode] = useState(false)
  const [currentImage, setCurrentImage] = useState(image)
  const [isLoading, setIsLoading] = useState(false)
  const [imageError, setImageError] = useState(false)
  const [selectedTool, setSelectedTool] = useState<"rect" | "circle" | "poly">("rect")
  const imageRef = useRef<HTMLImageElement>(null)
  const [drawingArea, setDrawingArea] = useState<Area | null>(null)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [isConfirming, setIsConfirming] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [drawingHistory, setDrawingHistory] = useState<Area[]>([])
  const { toast } = useToast()

  // Mantener el estado de la imagen original
  const [originalImage, setOriginalImage] = useState(image);

  // Sincronizar historial con áreas
  useEffect(() => {
    if (!areas.some(area => !area.id)) {
      setDrawingHistory(areas);
    }
  }, [areas]);

  useEffect(() => {
    // Detectar cambios comparando las áreas actuales con el historial
    if (JSON.stringify(areas) !== JSON.stringify(drawingHistory)) {
      setHasUnsavedChanges(true);
    }
  }, [areas, drawingHistory]);

  const handleImageUrlChange = async (url: string) => {
    console.log('🔵 handleImageUrlChange - URL recibida:', url);
    try {
      setIsLoading(true);
      setImageError(false);
      
      if (!url.trim()) {
        console.log('❌ URL vacía, limpiando imagen');
        setCurrentImage('');
        setOriginalImage('');
        onChange({ 
          image: '',
          originalImage: '',
          areas: []
        });
        return;
      }

      // Procesar URL de Google Drive
      if (url.includes('drive.google.com')) {
        console.log('🔄 Procesando URL de Google Drive');
        const processedUrl = getGoogleDriveImageUrl(url);
        if (!processedUrl) {
          throw new Error('Invalid Google Drive URL format');
        }

        console.log('📝 URLs:', {
          original: url,
          processed: processedUrl
        });

        await new Promise((resolve, reject) => {
          const img = new Image();
          img.onload = resolve;
          img.onerror = () => reject(new Error('Unable to load image'));
          img.src = processedUrl;
        });

        setCurrentImage(processedUrl);
        setOriginalImage(url);
        console.log('✅ Actualizando estado con URLs:', {
          current: processedUrl,
          original: url
        });
        
        onChange({ 
          image: processedUrl,
          originalImage: url,
          areas: areas
        });
      } else {
        // Para URLs normales
        await new Promise((resolve, reject) => {
          const img = new Image();
          img.onload = resolve;
          img.onerror = () => reject(new Error('Unable to load image'));
          img.src = url;
        });

        setCurrentImage(url);
        setOriginalImage(url);
        onChange({ 
          image: url,
          originalImage: url,
          areas: areas
        });
      }
    } catch (error) {
      console.error('❌ Error procesando URL:', error);
      setImageError(true);
      toast({
        title: "Error loading image",
        description: error instanceof Error ? error.message : "Failed to load image",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDrawStart = (x: number, y: number) => {
    if (!isDrawingMode) return;
    
    const newArea: Area = {
      id: generateId(),
      shape: selectedTool,
      isCorrect: true,
      coords: [x, y, x, y],
      x,
      y,
      width: 0,
      height: 0
    };
    
    setDrawingArea(newArea);
  };

  const handleDrawMove = (x: number, y: number) => {
    if (!drawingArea || !isDrawingMode) return;

    const startX = drawingArea.x!;
    const startY = drawingArea.y!;
    
    // Calcular dimensiones manteniendo proporciones positivas
    const width = x - startX;
    const height = y - startY;
    
    const coords = [
      startX,
      startY,
      startX + width,
      startY + height
    ];

    setDrawingArea({
      ...drawingArea,
      coords,
      width: Math.abs(width),
      height: Math.abs(height)
    });
  };

  const handleDrawEnd = () => {
    if (!drawingArea || !isDrawingMode) return;

    onChange({
      areas: [...areas, drawingArea]
    });
    setDrawingArea(null);
  };

  const handleAreaClick = (areaId: string) => {
    if (!isEditMode) return
    
    const updatedAreas = areas.filter(area => area.id !== areaId)
    setDrawingHistory(updatedAreas)
    onChange({ areas: updatedAreas })
    toast({
      title: "Area deleted",
      description: "The selected area has been deleted"
    })
  }

  const handleClearAllAreas = () => {
    setDrawingHistory([]);
    onChange({ areas: [] });
    setDrawingArea(null);
    setHasUnsavedChanges(true);
    
    toast({
      title: "All areas cleared",
      description: "All marked areas have been removed",
      variant: "info"
    });
  };

  const handleConfirmArea = async () => {
    if (!drawingArea) return;
    
    setIsConfirming(true);
    try {
      const updatedAreas = [...areas, drawingArea];
      onChange({ 
        areas: updatedAreas,
        image: currentImage,
        originalImage: originalImage // Incluir la URL original
      });
      setDrawingArea(null);
      setDrawingHistory(updatedAreas);
      setHasUnsavedChanges(true);
      
      toast({
        title: "Area confirmed",
        description: "Area has been added successfully",
        variant: "success"
      });
    } catch (error) {
      toast({
        title: "Error confirming area",
        description: "Please try again",
        variant: "destructive"
      });
    } finally {
      setIsConfirming(false);
    }
  };

  const handleCancelDrawing = () => {
    setDrawingArea(null);
    setIsDrawingMode(false);
    toast({
      title: "Drawing cancelled",
      description: "Start a new drawing when ready"
    });
  };

  const handleSave = async () => {
    console.log('🔵 handleSave - Estado actual:', {
      currentImage,
      originalImage,
      areas
    });
    
    if (!onSaveAreas) return;
    
    setIsSaving(true);
    try {
      await onSaveAreas(areas);
      console.log('✅ Guardando cambios con:', {
        areas,
        image: currentImage,
        originalImage
      });
      
      onChange({
        areas,
        image: currentImage,
        originalImage
      });
      
      setHasUnsavedChanges(false);
      setDrawingHistory(areas);
      
      toast({
        title: "Changes saved",
        description: `${areas.length} areas saved successfully`,
        variant: "success"
      });
    } catch (error) {
      console.error('❌ Error guardando:', error);
      toast({
        title: "Error saving areas",
        description: "Please try again",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleClearCurrentArea = () => {
    setDrawingArea(null);
    toast({
      title: "Current area cleared",
      description: "Start drawing a new area",
      variant: "info"
    });
  };

  const handleUndo = () => {
    if (drawingHistory.length === 0) return;
    
    const newHistory = [...drawingHistory];
    newHistory.pop();
    setDrawingHistory(newHistory);
    onChange({ areas: newHistory });
    setHasUnsavedChanges(true);
    
    toast({
      title: "Undo",
      description: "Last area removed"
    });
  };

  const toggleDrawingMode = () => {
    if (isDrawingMode) {
      setDrawingArea(null);
    }
    setIsDrawingMode(!isDrawingMode);
  };

  return (
    <div className="space-y-4">
      {isEditMode && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Image URL (Google Drive)
            </label>
            <div className="flex gap-2">
              <Input
                placeholder="https://drive.google.com/file/d/..."
                value={originalImage}
                onChange={(e) => handleImageUrlChange(e.target.value)}
                type="url"
                disabled={isLoading}
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => window.open('https://drive.google.com', '_blank')}
                title="Open Google Drive"
                disabled={isLoading}
              >
                <Link className="h-4 w-4" />
              </Button>
            </div>
            <div className="text-xs text-muted-foreground mt-1 space-y-1">
              <p>Ensure the image is public in Google Drive</p>
              <p>Supported URL formats:</p>
              <ul className="list-disc pl-4">
                <li>https://drive.google.com/file/d/ID_ARCHIVO/view</li>
                <li>https://drive.google.com/open?id=ID_ARCHIVO</li>
              </ul>
            </div>
          </div>

          {currentImage && !imageError && (
            <div className="flex items-center gap-2">
              <Button
                variant={isDrawingMode ? "secondary" : "outline"}
                onClick={toggleDrawingMode}
                disabled={!currentImage || isLoading}
                className="flex items-center gap-2"
              >
                <Pencil className="h-4 w-4" />
                {isDrawingMode ? "Cancel drawing" : "Draw area"}
              </Button>

              {isDrawingMode && (
                <DrawingToolbar
                  hasDrawing={!!drawingArea}
                  onClear={handleClearCurrentArea}
                  onConfirm={handleConfirmArea}
                  onCancel={handleCancelDrawing}
                  onUndo={handleUndo}
                  canUndo={drawingHistory.length > 0}
                  hasUnsavedChanges={hasUnsavedChanges}
                  onSave={handleSave}
                  onClearAllAreas={handleClearAllAreas}
                  hasMarkedAreas={areas.length > 0}
                  isConfirming={isConfirming}
                  isSaving={isSaving}
                />
              )}
            </div>
          )}
        </div>
      )}

      {currentImage && !imageError && (
        <Card className="p-4">
          <div className="relative">
            <ImageMap
              ref={imageRef}
              src={currentImage}
              areas={areas}
              drawingArea={drawingArea}
              onAreaClick={handleAreaClick}
              alt="Image to mark areas"
              className="w-full h-auto border rounded-md"
              isDrawingMode={isDrawingMode}
              isEditMode={isEditMode}
              onDrawStart={handleDrawStart}
              onDrawMove={handleDrawMove}
              onDrawEnd={handleDrawEnd}
              onError={() => setImageError(true)}
            />
          </div>
        </Card>
      )}

      {isLoading && (
        <div className="text-center p-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-sm text-muted-foreground mt-2">Loading image...</p>
        </div>
      )}

      {imageError && (
        <div className="text-center p-4 border rounded-md bg-destructive/10 text-destructive">
          <p>Error loading image. Please verify the URL and try again.</p>
        </div>
      )}
    </div>
  )
} 