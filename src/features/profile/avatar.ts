import { AVATAR_MAX_BYTES, avatarTypes } from '@/features/profile/types/profile'

const AVATAR_SIZE = 160

export class AvatarError extends Error {}

function isAvatarType(type: string): type is (typeof avatarTypes)[number] {
  return avatarTypes.some((accepted) => accepted === type)
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new AvatarError('Não foi possível ler esta imagem.'))
    image.src = url
  })
}

/**
 * Checks the picked file and turns it into a small square data URL (center crop), so the
 * upload stays light whatever the size of the original picture.
 */
export async function prepareAvatar(file: File): Promise<string> {
  if (!isAvatarType(file.type)) throw new AvatarError('Use uma imagem PNG, JPG ou WebP.')
  if (file.size > AVATAR_MAX_BYTES) throw new AvatarError('A imagem precisa ter até 2 MB.')

  const url = URL.createObjectURL(file)
  try {
    const image = await loadImage(url)
    const side = Math.min(image.naturalWidth, image.naturalHeight)
    const canvas = document.createElement('canvas')
    canvas.width = AVATAR_SIZE
    canvas.height = AVATAR_SIZE
    const context = canvas.getContext('2d')
    if (!context) throw new AvatarError('Não foi possível preparar a imagem.')
    context.drawImage(
      image,
      (image.naturalWidth - side) / 2,
      (image.naturalHeight - side) / 2,
      side,
      side,
      0,
      0,
      AVATAR_SIZE,
      AVATAR_SIZE,
    )
    return canvas.toDataURL('image/png')
  } finally {
    URL.revokeObjectURL(url)
  }
}
