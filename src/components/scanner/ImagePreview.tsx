import { useState } from 'react'

type Props = {
  imageUrl: string | null
}

export default function ImagePreview({ imageUrl }: Props) {
  const [zoom, setZoom] = useState(1)
  const [rotate, setRotate] = useState(0)

  if (!imageUrl) {
    return <div style={{ padding: 20, textAlign: 'center' }}>Nenhuma imagem selecionada</div>
  }

  return (
    <div style={{ textAlign: 'center' }}>
      {/* CONTROLES */}
      <div style={{ marginBottom: 10 }}>
        <button onClick={() => setZoom(zoom + 0.2)}>Zoom +</button>
        <button onClick={() => setZoom(zoom - 0.2)}>Zoom -</button>
        <button onClick={() => setRotate(rotate + 90)}>Girar</button>
        <button
          onClick={() => {
            setZoom(1)
            setRotate(0)
          }}
        >
          Reset
        </button>
      </div>

      {/* IMAGEM */}
      <div style={{ overflow: 'hidden' }}>
        <img
          src={imageUrl}
          alt="preview"
          style={{
            transform: `scale(${zoom}) rotate(${rotate}deg)`,
            maxWidth: '100%',
          }}
        />
      </div>
    </div>
  )
}
