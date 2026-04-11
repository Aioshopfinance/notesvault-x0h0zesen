import { useState } from "react";

type Props = {
  imageUrl: string | null;
};

export default function ImagePreview({ imageUrl }: Props) {
  const [zoom, setZoom] = useState(1);
  const [rotate, setRotate] = useState(0);

  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [start, setStart] = useState({ x: 0, y: 0 });

  if (!imageUrl) {
    return (
      <div style={{ padding: 20, textAlign: "center" }}>
        Nenhuma imagem selecionada
      </div>
    );
  }

  const handleMouseDown = (e: any) => {
    setDragging(true);
    setStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
  };

  const handleMouseMove = (e: any) => {
    if (!dragging) return;
    setPosition({
      x: e.clientX - start.x,
      y: e.clientY - start.y,
    });
  };

  const handleMouseUp = () => {
    setDragging(false);
  };

  return (
    <div style={{ textAlign: "center" }}>
      
      {/* CONTROLES */}
      <div style={{ marginBottom: 10 }}>
        <button onClick={() => setZoom(zoom + 0.2)}>Zoom +</button>
        <button onClick={() => setZoom(zoom - 0.2)}>Zoom -</button>
        <button onClick={() => setRotate(rotate + 90)}>Girar</button>
        <button onClick={() => {
          setZoom(1);
          setRotate(0);
          setPosition({ x: 0, y: 0 });
        }}>
          Reset
        </button>
      </div>

      {/* ÁREA DA IMAGEM */}
      <div
        style={{
          overflow: "hidden",
          border: "1px solid #ccc",
          height: 300,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: dragging ? "grabbing" : "grab",
        }}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <img
          src={imageUrl}
          alt="preview"
          onMouseDown={handleMouseDown}
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${zoom}) rotate(${rotate}deg)`,
            maxWidth: "100%",
            userSelect: "none",
          }}
          draggable={false}
        />
      </div>

    </div>
  );
}
