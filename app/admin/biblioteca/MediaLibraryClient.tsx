"use client"

import type React from "react"

import { useState, useRef, useCallback, useEffect } from "react"
import { getAdminMedia, getAdminMediaFolders, updateAdminMedia, deleteAdminMedia, createAdminMedia, createAdminMediaFolder, deleteAdminMediaFolder } from "@/app/admin/actions"
import { apiClient } from "@/lib/api-client"
import {
  Upload,
  Search,
  Grid,
  List,
  Trash2,
  Edit,
  Download,
  ImageIcon,
  File,
  Video,
  Music,
  AlertCircle,
  FolderPlus,
  Copy,
  Move,
  MoreHorizontal,
  CheckSquare,
  Square,
  HardDrive,
  BarChart3,
  Clock,
  Folder,
  ArrowRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { trackFileUpload, trackAdminAction } from "@/lib/analytics"

interface MediaFile {
  id: string
  name: string
  originalName?: string
  type: "image" | "video" | "audio" | "document"
  size: number
  url: string
  uploadDate: string
  alt?: string
  description?: string
  tags: string[]
  folder?: string
  lastUsed?: string
  usageCount?: number
}

interface MediaFolder {
  id: string
  name: string
  parentId?: string
  createdDate: string
  fileCount: number
}

// Función para obtener archivos de medios reales de la base de datos
const fetchRealMediaFiles = async (): Promise<MediaFile[]> => {
  try {
    const response = await fetch('/api/admin/media', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
      },
    });

    if (!response.ok) {
      throw new Error('Error al obtener archivos de medios');
    }

    const data = await response.json();
    
    if (data.success && data.data) {
      return data.data.map((file: any) => ({
        id: file.id.toString(),
        name: file.name,
        type: file.type,
        size: file.size,
        url: file.url,
        uploadDate: file.created_at,
        alt: file.alt || file.name,
        description: file.description || '',
        tags: file.tags || [],
        folder: file.folder || 'general',
        lastUsed: file.last_used || file.created_at,
        usageCount: file.usage_count || 0,
      }));
    }

    return [];
  } catch (error) {
    console.error('Error obteniendo archivos de medios reales:', error);
    return [];
  }
};

// Función para obtener carpetas reales de la base de datos
const fetchRealFolders = async (): Promise<MediaFolder[]> => {
  try {
    const response = await fetch('/api/admin/media/folders', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
      },
    });

    if (!response.ok) {
      throw new Error('Error al obtener carpetas');
    }

    const data = await response.json();
    
    if (data.success && data.data) {
      return data.data.map((folder: any) => ({
        id: folder.id.toString(),
        name: folder.name,
        createdDate: folder.created_at,
        fileCount: folder.file_count || 0,
      }));
    }

    return [];
  } catch (error) {
    console.error('Error obteniendo carpetas reales:', error);
    return [];
  }
};

const mockMediaFiles: MediaFile[] = [
  {
    id: "1",
    name: "eventu-logo.svg",
    type: "image",
    size: 15420,
    url: "/images/eventu-logo.svg",
    uploadDate: "2024-08-15",
    alt: "Logo de Eventu",
    description: "Logo principal de la plataforma",
    tags: ["logo", "branding"],
    folder: "branding",
    lastUsed: "2024-08-15",
    usageCount: 25,
  },
  {
    id: "2",
    name: "panaca-poster.jpg",
    type: "image",
    size: 245680,
    url: "/placeholder.jpg",
    uploadDate: "2024-08-14",
    alt: "Poster del evento Panaca",
    description: "Imagen promocional del evento Panaca",
    tags: ["evento", "poster", "panaca"],
    folder: "eventos",
    lastUsed: "2024-08-14",
    usageCount: 12,
  },
  {
    id: "3",
    name: "seat-map-example-1.png",
    type: "image",
    size: 89340,
    url: "/images/seat-map-example-1.png",
    uploadDate: "2024-08-13",
    alt: "Ejemplo de mapa de asientos",
    description: "Plantilla de mapa de asientos para eventos",
    tags: ["mapa", "asientos", "plantilla"],
    folder: "templates",
    lastUsed: "2024-08-13",
    usageCount: 8,
  },
]

const mockFolders: MediaFolder[] = [
  { id: "branding", name: "Branding", createdDate: "2024-08-01", fileCount: 5 },
  { id: "eventos", name: "Eventos", createdDate: "2024-08-02", fileCount: 12 },
  { id: "templates", name: "Plantillas", createdDate: "2024-08-03", fileCount: 8 },
]

export function MediaLibraryClient() {
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([])
  const [folders, setFolders] = useState<MediaFolder[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()
  const [currentFolder, setCurrentFolder] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedType, setSelectedType] = useState<string>("all")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [selectedFile, setSelectedFile] = useState<MediaFile | null>(null)
  const [selectedFiles, setSelectedFiles] = useState<string[]>([])
  const [showNewFolderDialog, setShowNewFolderDialog] = useState(false)
  const [newFolderName, setNewFolderName] = useState("")
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Cargar datos del backend
  const fetchData = async () => {
    setLoading(true)
    try {
      const [mediaData, foldersData] = await Promise.all([
        getAdminMedia(),
        getAdminMediaFolders()
      ])
      setMediaFiles(mediaData)
      setFolders(foldersData)
    } catch (error) {
      console.error('Error fetching media data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const filteredFiles = mediaFiles.filter((file) => {
    const matchesSearch =
      file.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (file.originalName && file.originalName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      file.tags.some((tag) => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesType = selectedType === "all" || file.type === selectedType
    const matchesFolder = currentFolder === null || file.folder === currentFolder
    return matchesSearch && matchesType && matchesFolder
  })

  const totalSize = mediaFiles.reduce((acc, file) => acc + file.size, 0)
  const folderSizes = folders.map((folder) => ({
    ...folder,
    size: mediaFiles.filter((file) => file.folder === folder.id).reduce((acc, file) => acc + file.size, 0),
  }))

  const handleFileUpload = useCallback(
    async (files: FileList) => {
      setIsUploading(true)
      setUploadProgress(0)
      setUploadError(null)
      setUploadSuccess(null)

      try {
        const formData = new FormData()

        for (let i = 0; i < files.length; i++) {
          formData.append("file", files[i])
        }
        
        // Agregar campos adicionales
        formData.append("folder", currentFolder?.toString() || "1")
        formData.append("alt", "Archivo subido")
        formData.append("description", "Archivo subido desde la biblioteca de medios")
        formData.append("tags", JSON.stringify([]))

        const progressInterval = setInterval(() => {
          setUploadProgress((prev) => Math.min(prev + 10, 90))
        }, 200)

        // Use API client directly instead of Server Action
        const response = await apiClient.uploadMedia(formData)

        clearInterval(progressInterval)
        setUploadProgress(100)

        if (response.success && response.data && response.data.length > 0) {
          const uploadedFiles = response.data.map((media: any) => ({
            id: media.id.toString(),
            name: media.name,
            originalName: media.original_name,
            type: media.type,
            size: media.size,
            url: media.url,
            uploadDate: media.upload_date,
            alt: media.alt,
            description: media.description,
            tags: media.tags || [],
            folder: media.folder,
            lastUsed: media.last_used,
            usageCount: media.usage_count || 0,
          }))
          
          // Track file uploads
          uploadedFiles.forEach((file: any) => {
            trackFileUpload(file.type, file.size)
          })
          trackAdminAction('upload', 'media_files')
          
          setMediaFiles((prev) => [...uploadedFiles, ...prev])
          setUploadSuccess(`Se subieron exitosamente ${uploadedFiles.length} archivo(s)`)
          fetchData() // Recargar datos
          setTimeout(() => setUploadSuccess(null), 3000)
        } else {
          throw new Error('No se pudieron subir los archivos')
        }
      } catch (error) {
        console.error("Upload error:", error)
        setUploadError(error instanceof Error ? error.message : "Error al subir archivos")
      } finally {
        setIsUploading(false)
        setUploadProgress(0)
      }
    },
    [currentFolder],
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      const files = e.dataTransfer.files
      if (files.length > 0) {
        handleFileUpload(files)
      }
    },
    [handleFileUpload],
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
  }, [])

  const deleteFile = async (id: string) => {
    try {
      const success = await deleteAdminMedia(id)
      if (success) {
        setMediaFiles((prev) => prev.filter((file) => file.id !== id))
        setSelectedFiles((prev) => prev.filter((fileId) => fileId !== id))
        toast({
          title: "Archivo eliminado",
          description: "El archivo ha sido eliminado exitosamente",
        })
      } else {
        toast({
          title: "Error",
          description: "No se pudo eliminar el archivo",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al eliminar el archivo",
        variant: "destructive"
      })
    }
  }

  const handleBulkDelete = async () => {
    if (!confirm(`¿Estás seguro de que quieres eliminar ${selectedFiles.length} archivo(s)?`)) return

    try {
      const deletePromises = selectedFiles.map(id => deleteAdminMedia(id))
      const results = await Promise.all(deletePromises)
      
      if (results.every(result => result)) {
        setMediaFiles((prev) => prev.filter((file) => !selectedFiles.includes(file.id)))
        setSelectedFiles([])
        toast({
          title: "Archivos eliminados",
          description: `${selectedFiles.length} archivo(s) eliminado(s) exitosamente`,
        })
      } else {
        toast({
          title: "Error",
          description: "Algunos archivos no pudieron ser eliminados",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al eliminar los archivos",
        variant: "destructive"
      })
    }
  }

  const handleBulkMove = async (targetFolder: string) => {
    try {
      const movePromises = selectedFiles.map(id => {
        const file = mediaFiles.find(f => f.id === id)
        if (file) {
          return updateAdminMedia(id, { ...file, folder: targetFolder })
        }
        return Promise.resolve(false)
      })
      
      const results = await Promise.all(movePromises)
      
      if (results.every(result => result)) {
        setMediaFiles((prev) =>
          prev.map((file) => (selectedFiles.includes(file.id) ? { ...file, folder: targetFolder } : file)),
        )
        setSelectedFiles([])
        toast({
          title: "Archivos movidos",
          description: `${selectedFiles.length} archivo(s) movido(s) a ${targetFolder}`,
        })
      } else {
        toast({
          title: "Error",
          description: "Algunos archivos no pudieron ser movidos",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al mover los archivos",
        variant: "destructive"
      })
    }
  }

  const duplicateFile = async (file: MediaFile) => {
    try {
      const duplicatedFile: MediaFile = {
        ...file,
        id: Date.now().toString(),
        name: `${file.name.split(".")[0]}_copy.${file.name.split(".").pop()}`,
        originalName: file.originalName
          ? `${file.originalName.split(".")[0]}_copy.${file.originalName.split(".").pop()}`
          : undefined,
        uploadDate: new Date().toISOString().split("T")[0],
        usageCount: 0,
      }
      
      const success = await createAdminMedia(duplicatedFile as any)
      if (success) {
        setMediaFiles((prev) => [duplicatedFile, ...prev])
        toast({
          title: "Archivo duplicado",
          description: "El archivo ha sido duplicado exitosamente",
        })
      } else {
        toast({
          title: "Error",
          description: "No se pudo duplicar el archivo",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al duplicar el archivo",
        variant: "destructive"
      })
    }
  }

  const createFolder = async () => {
    if (!newFolderName.trim()) return

    try {
      const newFolder: MediaFolder = {
        id: newFolderName.toLowerCase().replace(/\s+/g, "-"),
        name: newFolderName,
        createdDate: new Date().toISOString().split("T")[0],
        fileCount: 0,
      }

      const success = await createAdminMediaFolder(newFolder)
      if (success) {
        setFolders((prev) => [...prev, newFolder])
        setNewFolderName("")
        setShowNewFolderDialog(false)
        toast({
          title: "Carpeta creada",
          description: "La carpeta ha sido creada exitosamente",
        })
      } else {
        toast({
          title: "Error",
          description: "No se pudo crear la carpeta",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al crear la carpeta",
        variant: "destructive"
      })
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const getFileIcon = (type: string) => {
    switch (type) {
      case "image":
        return <ImageIcon className="h-4 w-4" />
      case "video":
        return <Video className="h-4 w-4" />
      case "audio":
        return <Music className="h-4 w-4" />
      default:
        return <File className="h-4 w-4" />
    }
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="files" className="w-full">
        <TabsList>
          <TabsTrigger value="files">Archivos</TabsTrigger>
          <TabsTrigger value="stats">Estadísticas</TabsTrigger>
        </TabsList>

        <TabsContent value="stats" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <HardDrive className="h-4 w-4" />
                  Almacenamiento Total
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatFileSize(totalSize)}</div>
                <p className="text-xs text-muted-foreground">{mediaFiles.length} archivos</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Más Usado
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-lg font-bold">
                  {mediaFiles.sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0))[0]?.originalName || "N/A"}
                </div>
                <p className="text-xs text-muted-foreground">
                  {mediaFiles.sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0))[0]?.usageCount || 0} usos
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Subido Recientemente
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-lg font-bold">
                  {mediaFiles.sort((a, b) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime())[0]
                    ?.originalName || "N/A"}
                </div>
                <p className="text-xs text-muted-foreground">
                  {mediaFiles.sort((a, b) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime())[0]
                    ?.uploadDate || "N/A"}
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Uso por Carpeta</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {folderSizes.map((folder) => (
                  <div key={folder.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Folder className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{folder.name}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{formatFileSize(folder.size)}</div>
                      <div className="text-xs text-muted-foreground">{folder.fileCount} archivos</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="files" className="space-y-6">
          <div className="flex items-center justify-between">
            {currentFolder && (
              <Button variant="ghost" size="sm" onClick={() => setCurrentFolder(null)}>
                <ArrowRight className="h-4 w-4 rotate-180 mr-1" />
                Volver
              </Button>
            )}
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <span>Biblioteca</span>
              {currentFolder && (
                <>
                  <ArrowRight className="h-3 w-3" />
                  <span>{folders.find((f) => f.id === currentFolder)?.name}</span>
                </>
              )}
            </div>

            <Dialog open={showNewFolderDialog} onOpenChange={setShowNewFolderDialog}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <FolderPlus className="h-4 w-4 mr-2" />
                  Nueva Carpeta
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Crear Nueva Carpeta</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="folderName">Nombre de la carpeta</Label>
                    <Input
                      id="folderName"
                      value={newFolderName}
                      onChange={(e) => setNewFolderName(e.target.value)}
                      placeholder="Nombre de la carpeta"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setShowNewFolderDialog(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={createFolder}>Crear</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {!currentFolder && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {folders.map((folder) => (
                <Card
                  key={folder.id}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => setCurrentFolder(folder.id)}
                >
                  <CardContent className="p-4 text-center">
                    <Folder className="h-8 w-8 mx-auto mb-2 text-primary" />
                    <p className="font-medium text-sm">{folder.name}</p>
                    <p className="text-xs text-muted-foreground">{folder.fileCount} archivos</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          <Card>
            <CardContent className="p-6">
              <div
                className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center hover:border-primary/50 transition-colors"
                onDrop={handleDrop}
                onDragOver={handleDragOver}
              >
                <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Subir archivos</h3>
                <p className="text-muted-foreground mb-4">
                  Arrastra y suelta archivos aquí o haz clic para seleccionar
                </p>
                {currentFolder && (
                  <p className="text-sm text-primary mb-2">
                    Se subirán a la carpeta: {folders.find((f) => f.id === currentFolder)?.name}
                  </p>
                )}
                <p className="text-sm text-muted-foreground mb-4">
                  Formatos soportados: PNG, JPG, SVG, WebP, GIF (máx. 5MB)
                </p>
                <Button onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
                  {isUploading ? "Subiendo..." : "Seleccionar archivos"}
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
                />
              </div>

              {isUploading && (
                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Subiendo archivos...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <Progress value={uploadProgress} className="w-full" />
                </div>
              )}

              {uploadError && (
                <Alert className="mt-4" variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{uploadError}</AlertDescription>
                </Alert>
              )}

              {uploadSuccess && (
                <Alert className="mt-4">
                  <AlertDescription>{uploadSuccess}</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {selectedFiles.length > 0 && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">
                    {selectedFiles.length} archivo{selectedFiles.length !== 1 ? "s" : ""} seleccionado
                    {selectedFiles.length !== 1 ? "s" : ""}
                  </span>
                  <div className="flex items-center gap-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Move className="h-4 w-4 mr-2" />
                          Mover a
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => handleBulkMove("")}>Sin carpeta</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {folders.map((folder) => (
                          <DropdownMenuItem key={folder.id} onClick={() => handleBulkMove(folder.id)}>
                            {folder.name}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <Button variant="destructive" size="sm" onClick={handleBulkDelete}>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Eliminar
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setSelectedFiles([])}>
                      Cancelar
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar archivos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full sm:w-64"
                />
              </div>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Tipo de archivo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="image">Imágenes</SelectItem>
                  <SelectItem value="video">Videos</SelectItem>
                  <SelectItem value="audio">Audio</SelectItem>
                  <SelectItem value="document">Documentos</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === "grid" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("grid")}
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("list")}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {filteredFiles.length} archivo{filteredFiles.length !== 1 ? "s" : ""} encontrado
                {filteredFiles.length !== 1 ? "s" : ""}
              </p>
              {filteredFiles.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const allSelected = filteredFiles.every((file) => selectedFiles.includes(file.id))
                    if (allSelected) {
                      setSelectedFiles([])
                    } else {
                      setSelectedFiles(filteredFiles.map((file) => file.id))
                    }
                  }}
                >
                  {filteredFiles.every((file) => selectedFiles.includes(file.id)) ? (
                    <CheckSquare className="h-4 w-4 mr-2" />
                  ) : (
                    <Square className="h-4 w-4 mr-2" />
                  )}
                  Seleccionar todo
                </Button>
              )}
            </div>

            {viewMode === "grid" ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                {filteredFiles.map((file) => (
                  <Card key={file.id} className="group hover:shadow-md transition-shadow">
                    <CardContent className="p-3">
                      <div className="aspect-square bg-muted rounded-lg mb-3 overflow-hidden relative">
                        <div className="absolute top-2 left-2 z-10">
                          <Checkbox
                            checked={selectedFiles.includes(file.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedFiles((prev) => [...prev, file.id])
                              } else {
                                setSelectedFiles((prev) => prev.filter((id) => id !== file.id))
                              }
                            }}
                            className="bg-white/90 border-2"
                          />
                        </div>

                        {file.type === "image" ? (
                          <img
                            src={file.url || "/placeholder.svg"}
                            alt={file.alt || file.originalName || file.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">{getFileIcon(file.type)}</div>
                        )}
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button size="sm" variant="secondary" onClick={() => setSelectedFile(file)}>
                                <Edit className="h-3 w-3" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                              <DialogHeader>
                                <DialogTitle>Editar archivo</DialogTitle>
                              </DialogHeader>
                              <FileEditForm
                                file={file}
                                onSave={(updatedFile) => {
                                  setMediaFiles((prev) => prev.map((f) => (f.id === updatedFile.id ? updatedFile : f)))
                                  setSelectedFile(null)
                                }}
                              />
                            </DialogContent>
                          </Dialog>
                          <Button size="sm" variant="secondary" asChild>
                            <a href={file.url} download={file.originalName || file.name}>
                              <Download className="h-3 w-3" />
                            </a>
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button size="sm" variant="secondary">
                                <MoreHorizontal className="h-3 w-3" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              <DropdownMenuItem onClick={() => duplicateFile(file)}>
                                <Copy className="h-4 w-4 mr-2" />
                                Duplicar
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => deleteFile(file.id)} className="text-destructive">
                                <Trash2 className="h-4 w-4 mr-2" />
                                Eliminar
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-medium truncate" title={file.originalName || file.name}>
                          {file.originalName || file.name}
                        </p>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-xs">
                            {file.type}
                          </Badge>
                          <span className="text-xs text-muted-foreground">{formatFileSize(file.size)}</span>
                        </div>
                        {file.usageCount !== undefined && file.usageCount > 0 && (
                          <p className="text-xs text-muted-foreground">Usado {file.usageCount} veces</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {filteredFiles.map((file) => (
                  <Card key={file.id} className="hover:shadow-sm transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        <Checkbox
                          checked={selectedFiles.includes(file.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedFiles((prev) => [...prev, file.id])
                            } else {
                              setSelectedFiles((prev) => prev.filter((id) => id !== file.id))
                            }
                          }}
                        />

                        <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
                          {file.type === "image" ? (
                            <img
                              src={file.url || "/placeholder.svg"}
                              alt={file.alt || file.originalName || file.name}
                              className="w-full h-full object-cover rounded-lg"
                            />
                          ) : (
                            getFileIcon(file.type)
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{file.originalName || file.name}</p>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span>{formatFileSize(file.size)}</span>
                            <span>{file.uploadDate}</span>
                            <Badge variant="secondary" className="text-xs">
                              {file.type}
                            </Badge>
                            {file.usageCount !== undefined && file.usageCount > 0 && (
                              <span>{file.usageCount} usos</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button size="sm" variant="outline" onClick={() => setSelectedFile(file)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                              <DialogHeader>
                                <DialogTitle>Editar archivo</DialogTitle>
                              </DialogHeader>
                              <FileEditForm
                                file={file}
                                onSave={(updatedFile) => {
                                  setMediaFiles((prev) => prev.map((f) => (f.id === updatedFile.id ? updatedFile : f)))
                                  setSelectedFile(null)
                                }}
                              />
                            </DialogContent>
                          </Dialog>
                          <Button size="sm" variant="outline" asChild>
                            <a href={file.url} download={file.originalName || file.name}>
                              <Download className="h-4 w-4" />
                            </a>
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button size="sm" variant="outline">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              <DropdownMenuItem onClick={() => duplicateFile(file)}>
                                <Copy className="h-4 w-4 mr-2" />
                                Duplicar
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => deleteFile(file.id)} className="text-destructive">
                                <Trash2 className="h-4 w-4 mr-2" />
                                Eliminar
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

interface FileEditFormProps {
  file: MediaFile
  onSave: (file: MediaFile) => void
}

function FileEditForm({ file, onSave }: FileEditFormProps) {
  const [formData, setFormData] = useState({
    name: file.originalName || file.name,
    alt: file.alt || "",
    description: file.description || "",
    tags: file.tags.join(", "),
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({
      ...file,
      originalName: formData.name,
      alt: formData.alt,
      description: formData.description,
      tags: formData.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Nombre del archivo</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="alt">Texto alternativo</Label>
          <Input
            id="alt"
            value={formData.alt}
            onChange={(e) => setFormData((prev) => ({ ...prev, alt: e.target.value }))}
            placeholder="Descripción para accesibilidad"
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">Descripción</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
          placeholder="Descripción del archivo"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="tags">Etiquetas</Label>
        <Input
          id="tags"
          value={formData.tags}
          onChange={(e) => setFormData((prev) => ({ ...prev, tags: e.target.value }))}
          placeholder="Separadas por comas"
        />
      </div>
      <div className="flex justify-end gap-2">
        <Button type="submit">Guardar cambios</Button>
      </div>
    </form>
  )
}
