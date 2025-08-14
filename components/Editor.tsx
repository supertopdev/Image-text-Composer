import React, { useCallback, useRef, useState, useEffect } from 'react'
import { Stage, Layer, Image as KonvaImage, Text as KonvaText, Rect, Group } from 'react-konva'
import useImage from 'use-image'
import Konva from 'konva'
import axios from 'axios'

type TextLayer = {
  id: string
  x: number
  y: number
  rotation: number
  scale: number
  text: string
  fontSize: number
  fontFamily: string
  fontStyle: 'normal' | 'bold' | 'italic'
  fill: string
  opacity: number
  align: 'left' | 'center' | 'right'
}

const API_KEY = "AIzaSyA37MNosfvzeCIqEAiQxAUMmj6zFFaENyM";
const FONT_API_URL = `https://www.googleapis.com/webfonts/v1/webfonts?key=${API_KEY}`;

function generateId() {
  return Math.random().toString(36).slice(2, 9)
}

function useUploadedImage(file?: File | null) {
  const [img, setImg] = useState<HTMLImageElement | null>(null)

  useEffect(() => {
    if (!file || file.type !== "image/png" ) { setImg(null); return }
    const url = URL.createObjectURL(file)
    const image = new Image()
    image.onload = () => setImg(image)
    image.src = url
    return () => URL.revokeObjectURL(url)
  }, [file])

  return img
}

export default function Editor() {
  const [file, setFile] = useState<File | null>(null)
  const img = useUploadedImage(file)
  const [layers, setLayers] = useState<TextLayer[]>([])
  const stageRef = useRef<Konva.Stage | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 })
  const [googleFonts, setGoogleFonts] = useState<string[]>([]);
  const [customFonts, setCustomFonts] = useState<string[]>([]);

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateSize = () => {
      if (!containerRef.current) return;
      const containerWidth = containerRef.current.offsetWidth;
      const imgAspectRatio = img ? img.height / img.width : 1;
      setCanvasSize({
        width: containerWidth,
        height: containerWidth * imgAspectRatio,
      });
    };
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, [img]);

  useEffect(() => {
    // const key = process.env.NEXT_PUBLIC_GOOGLE_FONTS_API_KEY;
    // const key = "AIzaSyA37MNosfvzeCIqEAiQxAUMmj6zFFaENyM"
    // if (!key) return; // optional
    // fetch(FONT_API_URL)
    //   .then((r) => r.json())
    //   .then((json) => {
    //     if (Array.isArray(json.items)) setGoogleFonts(json.items.map((f: any) => f.family));
    //   })
    //   .catch(() => {});
    const fonts = ['Arial', 'Roboto', 'Lato', 'Open Sans', 'Montserrat', 'Poppins', 'Oswald']
    setGoogleFonts(fonts);
  }, []);

  // Load a Google font dynamically when selected
  const ensureGoogleFontLoaded = useCallback(async (family: string) => {
    // Use CSS @import via WebFont loader alternative: create a stylesheet link for the chosen family
    const id = `gfont-${family.replace(/\s+/g, "-")}`;
    if (document.getElementById(id)) return;
    const link = document.createElement("link");
    link.id = id;
    link.rel = "stylesheet";
    link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:wght@100..900&display=swap`;
    document.head.appendChild(link);
    // FontFaceSet load
    try {
      await (document as any).fonts.load(`16px "${family}"`);
    } catch {}
  }, []);

  // Custom font upload via FontFace API
  const onUploadFontFile = async (file: File) => {
    const supported = ["font/ttf", "font/otf", "font/woff", "font/woff2", "application/font-woff", "application/x-font-ttf", "application/x-font-otf"];
    if (!supported.includes(file.type) && !/[.](ttf|otf|woff2?|TTF|OTF|WOFF2?)$/.test(file.name)) {
      alert("Please upload a font file (TTF/OTF/WOFF/WOFF2).");
      return;
    }
    const buf = await file.arrayBuffer();
    const family = file.name.replace(/\.(ttf|otf|woff2?|TTF|OTF|WOFF2?)$/, "");
    const ff = new FontFace(family, buf);
    await ff.load();
    (document as any).fonts.add(ff);
    setCustomFonts((f) => Array.from(new Set([family, ...f])));
  };

  function addText() {
    const id = generateId()
    const newLayer: TextLayer = {
      id,
      x: canvasSize.width / 2 - 500,
      y: canvasSize.height / 2,
      rotation: 0,
      scale: 1,
      text: 'New text',
      fontSize: 36,
      fontFamily: 'Arial',
      fontStyle: 'normal',
      fill: '#ffffff',
      opacity: 1,
      align: 'center'
    }
    setLayers(prev => [...prev, newLayer])
    setSelectedId(id)
  }

  function updateLayer(id: string, patch: Partial<TextLayer>) {
    setLayers(prev => prev.map(l => l.id === id ? { ...l, ...patch } : l))
  }

  function removeLayer(id: string) {
    setLayers(prev => prev.filter(l => l.id !== id))
    if (selectedId === id) setSelectedId(null)
  }

  function moveLayerForward(id: string) {
    setLayers(prev => {
      const i = prev.findIndex(p => p.id === id)
      if (i === -1 || i === prev.length - 1) return prev
      const copy = [...prev]
      const [item] = copy.splice(i, 1)
      copy.splice(i + 1, 0, item)
      return copy
    })
  }

  function moveLayerBackward(id: string) {
    setLayers(prev => {
      const i = prev.findIndex(p => p.id === id)
      if (i <= 0) return prev
      const copy = [...prev]
      const [item] = copy.splice(i, 1)
      copy.splice(i - 1, 0, item)
      return copy
    })
  }

  async function exportClientPNG() {
    if (!stageRef.current) return
    const dataUrl = stageRef.current.toDataURL({ pixelRatio: 1 })
    const a = document.createElement('a')
    a.href = dataUrl
    a.download = 'export.png'
    document.body.appendChild(a)
    a.click()
    a.remove()
  }

  return (
    <div className="container-fluid">
      <div className="row">
        <div className="col-12 col-lg-8 py-2">
          <div className="card p-3">
            <div className="d-flex flex-wrap align-items-center gap-2 mb-3">
              <input className="form-control" type="file" accept="image/png" onChange={e => setFile(e.target.files?.[0] ?? null)} />
              <button onClick={addText} className="btn btn-primary">Add text</button>
              <button onClick={exportClientPNG} className="btn btn-outline-secondary">Export PNG (client)</button>
            </div>

            <div ref={containerRef} className="rounded-3 border bg-light overflow-hidden" style={{ width: '100%', height: canvasSize.height }}>
              <Stage width={canvasSize.width} height={canvasSize.height} ref={stageRef} onMouseDown={e => {
                // click on empty area -> deselect
                const clickedOnEmpty = e.target === e.target.getStage()
                if (clickedOnEmpty) setSelectedId(null)
              }}>
                <Layer>
                  {/* background rect to show boundaries */}
                  <Rect x={0} y={0} width={canvasSize.width} height={canvasSize.height} fill="#f7f7f7" />
                </Layer>

                <Layer>
                  {/* image */}
                  {img && (
                    <KonvaImage image={img} x={0} y={0} width={canvasSize.width} height={canvasSize.height} />
                  )}
                </Layer>

                <Layer>
                  {/* text layers */}
                  {layers.map((l) => (
                    <Group key={l.id} x={l.x} y={l.y} rotation={l.rotation} draggable onDragEnd={e => updateLayer(l.id, { x: e.target.x(), y: e.target.y() })} onClick={() => setSelectedId(l.id)} onTap={() => setSelectedId(l.id)}>
                      <KonvaText
                        text={l.text}
                        fontSize={l.fontSize}
                        fontFamily={l.fontFamily}
                        fontStyle={l.fontStyle}
                        fill={l.fill}
                        opacity={l.opacity}
                        width={canvasSize.width}
                        align={l.align}
                        scaleX={l.scale}
                        scaleY={l.scale}
                        listening
                      />
                    </Group>
                  ))}
                </Layer>
              </Stage>
            </div>
          </div>
        </div>

        <div className="col-12 col-lg-4 py-2">
          <div className="card p-3 sticky-top" style={{ top: '1rem', maxHeight: 'calc(100vh - 2rem)', overflow: 'auto' }}>
            <h2 className="h6 mb-3">Layers</h2>
            <div className="d-flex flex-column gap-2" style={{ maxHeight: '60vh', overflow: 'auto' }}>
              {layers.map(l => (
                <div key={l.id} className={`p-2 border rounded ${selectedId === l.id ? 'border-primary bg-primary bg-opacity-10' : 'border-secondary'}`}>
                  <div className="d-flex justify-content-between align-items-center">
                    <strong className="text-truncate">{l.text.split('\n')[0] || 'Text'}</strong>
                    <div className="d-flex gap-1">
                      <button onClick={() => moveLayerBackward(l.id)} className="btn btn-sm btn-outline-secondary">◀</button>
                      <button onClick={() => moveLayerForward(l.id)} className="btn btn-sm btn-outline-secondary">▶</button>
                      <button onClick={() => removeLayer(l.id)} className="btn btn-sm btn-danger">🗑</button>
                    </div>
                  </div>

                  <div className="mt-2 d-flex flex-column gap-2">
                    <label className="form-label m-0">Content</label>
                    <textarea className="form-control" value={l.text} onChange={e => updateLayer(l.id, { text: e.target.value })} rows={3} />

                    <div className="row g-2">
                      <div className="col-6">
                        <label className="form-label m-0">Font size</label>
                        <input type="number" value={l.fontSize} onChange={e => updateLayer(l.id, { fontSize: Number(e.target.value) })} className="form-control" />
                      </div>
                      <div className="col-6">
                        <label className="form-label m-0">Font family</label>
                        <select
                          value={l.fontFamily}
                          onChange={async (e) => {
                            const family = e.target.value;
                            if (googleFonts.includes(family)) await ensureGoogleFontLoaded(family);
                            updateLayer(l.id, { fontFamily: family });
                          }}
                          className="form-select"
                        >
                          {[l.fontFamily, ...customFonts, ...googleFonts]
                          .filter((v, i, a) => a.indexOf(v) === i)
                          .map((f) => (
                            <option key={f} value={f}>{f}</option>
                          ))}
                        </select>
                      </div>
                      {/* Custom Font Upload */}
                      <div className="row g-2">
                        <label className="form-label m-0">Upload Font (ttf, otf, woff, woff2)</label>
                        <input
                          className="col-span-2 text-sm"
                          type="file"
                          accept=".ttf,.otf,.woff,.woff2"
                          onChange={async (e) => {
                            const f = e.currentTarget.files?.[0];
                            if (f) await onUploadFontFile(f);
                            e.currentTarget.value = "";
                          }}
                        />
                      </div>
                      <div className="row g-2">
                        <label className="form-label m-0">Font Style</label>
                        <div className="col-4 d-grid"><button onClick={() => updateLayer(l.id, { fontStyle: 'normal' })} className="btn btn-sm btn-outline-secondary w-100">Normal</button></div>
                        <div className="col-4 d-grid"><button onClick={() => updateLayer(l.id, { fontStyle: 'bold' })} className="btn btn-sm btn-outline-secondary w-100">Bold</button></div>
                        <div className="col-4 d-grid"><button onClick={() => updateLayer(l.id, { fontStyle: 'italic' })} className="btn btn-sm btn-outline-secondary w-100">Italic</button></div>
                      </div>
                    </div>

                    <div className="row g-2">
                      <div className="col-6">
                        <label className="form-label m-0">Color</label>
                        <input type="color" value={l.fill} onChange={e => updateLayer(l.id, { fill: e.target.value })} className="form-control form-control-color w-100" />
                      </div>
                      <div className="col-6">
                        <label className="form-label m-0">Opacity</label>
                        <input type="range" min={0} max={1} step={0.05} value={l.opacity} onChange={e => updateLayer(l.id, { opacity: Number(e.target.value) })} className="form-range" />
                      </div>
                    </div>

                    <div className="row g-2">
                      <div className="col-4 d-grid"><button onClick={() => updateLayer(l.id, { align: 'left' })} className="btn btn-sm btn-outline-secondary w-100">Left</button></div>
                      <div className="col-4 d-grid"><button onClick={() => updateLayer(l.id, { align: 'center' })} className="btn btn-sm btn-outline-secondary w-100">Center</button></div>
                      <div className="col-4 d-grid"><button onClick={() => updateLayer(l.id, { align: 'right' })} className="btn btn-sm btn-outline-secondary w-100">Right</button></div>
                    </div>

                    <div className="row g-2">
                      <div className="col-4 d-grid"><button onClick={() => updateLayer(l.id, { rotation: l.rotation - 15 })} className="btn btn-sm btn-outline-secondary w-100">↺</button></div>
                      <div className="col-4 d-grid"><button onClick={() => updateLayer(l.id, { rotation: 0 })} className="btn btn-sm btn-outline-secondary w-100">Reset</button></div>
                      <div className="col-4 d-grid"><button onClick={() => updateLayer(l.id, { rotation: l.rotation + 15 })} className="btn btn-sm btn-outline-secondary w-100">↻</button></div>
                    </div>

                    <div className="d-flex align-items-center gap-2">
                      <label className="form-label m-0">Scale</label>
                      <input type="range" min={0.2} max={3} step={0.05} value={l.scale} onChange={e => updateLayer(l.id, { scale: Number(e.target.value) })} className="form-range flex-grow-1" />
                    </div>

                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}