import { Button } from '@/shared/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/shared/ui/dialog'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { Skeleton } from '@/shared/ui/skeleton'

function App() {
  return (
    <main className="min-h-screen space-y-8 bg-bg p-8 text-fg">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold text-fg">Kurio</h1>
        <p className="text-fg-muted">Marketplace de arte digital</p>
      </header>

      <section aria-label="Variantes de botão" className="flex flex-wrap gap-3">
        <Button>Primário</Button>
        <Button variant="outline">Outline</Button>
        <Button variant="secondary">Secundário</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="destructive">Destrutivo</Button>
        <Button variant="link">Link</Button>
      </section>

      <section className="max-w-sm space-y-2">
        <Label htmlFor="collector-name">Nome do colecionador</Label>
        <Input id="collector-name" placeholder="Digite seu nome" />
      </section>

      <Skeleton className="h-20 w-72" />

      <Dialog>
        <DialogTrigger asChild>
          <Button>Abrir diálogo</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Kurio</DialogTitle>
            <DialogDescription>Prévia do diálogo com o tema do marketplace.</DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </main>
  )
}

export default App
