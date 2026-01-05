import { MediaLibraryClient } from "./MediaLibraryClient"

export default function MediaLibraryPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Biblioteca de Medios</h1>
        <p className="text-muted-foreground">Gestiona todas las imágenes y archivos multimedia de tu sitio web.</p>
      </div>
      <MediaLibraryClient />
    </div>
  )
}
