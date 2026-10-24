import { useState, type FormEvent } from 'react'
import { useNavigate } from '@tanstack/react-router'
import searchIcon from '@/assets/figma/search.svg'
import { MaskIcon } from '@/shared/components/mask-icon'
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

interface SearchDialogProps {
  triggerClassName: string
}

export function SearchDialog({ triggerClassName }: SearchDialogProps) {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [term, setTerm] = useState('')

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setOpen(false)
    void navigate({ to: '/', search: { q: term.trim() || undefined }, hash: 'catalogo' })
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (next) setTerm('')
      }}
    >
      <DialogTrigger aria-label="Buscar NFTs" className={triggerClassName}>
        <MaskIcon src={searchIcon} className="size-5" />
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">Buscar NFTs</DialogTitle>
          <DialogDescription>Pesquise por nome, coleção ou atributo.</DialogDescription>
        </DialogHeader>
        <form role="search" onSubmit={handleSubmit} className="flex gap-2">
          <label htmlFor="nft-search" className="sr-only">
            Termo de busca
          </label>
          <Input
            id="nft-search"
            type="search"
            value={term}
            onChange={(event) => setTerm(event.target.value)}
            placeholder="Ex.: Emerald Ape"
            maxLength={80}
            autoComplete="off"
            className="h-10 text-base"
          />
          <Button type="submit" className="h-10 px-4 text-base font-bold">
            Buscar
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
