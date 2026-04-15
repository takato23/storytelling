"use client";

import { useMemo, useRef, useState } from "react";

type StepStatus = "idle" | "loading" | "success" | "error";
const NATIVE_SUPPORTED_UPLOAD_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

async function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("No se pudo leer la imagen"));
    reader.readAsDataURL(file);
  });
}

async function convertImageFileForUpload(file: File): Promise<File> {
  if (NATIVE_SUPPORTED_UPLOAD_TYPES.has(file.type)) {
    return file;
  }

  const objectUrl = URL.createObjectURL(file);

  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const nextImage = new window.Image();
      nextImage.onload = () => resolve(nextImage);
      nextImage.onerror = () => reject(new Error("No se pudo leer la imagen seleccionada."));
      nextImage.src = objectUrl;
    });

    const canvas = document.createElement("canvas");
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;

    const context = canvas.getContext("2d");
    if (!context) {
      throw new Error("No se pudo preparar la imagen para la prueba.");
    }

    context.drawImage(image, 0, 0, canvas.width, canvas.height);

    const convertedBlob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error("No se pudo convertir la foto a JPG."));
          return;
        }
        resolve(blob);
      }, "image/jpeg", 0.92);
    });

    const normalizedName = file.name.replace(/\.[^.]+$/, "") || "photo";
    return new File([convertedBlob], `${normalizedName}.jpg`, {
      type: "image/jpeg",
      lastModified: file.lastModified,
    });
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export default function DebugPreviewClient() {
  const [file, setFile] = useState<File | null>(null);
  const [childName, setChildName] = useState("Valentín");
  const [analyzeStatus, setAnalyzeStatus] = useState<StepStatus>("idle");
  const [generateStatus, setGenerateStatus] = useState<StepStatus>("idle");
  const [coverTestStatus, setCoverTestStatus] = useState<StepStatus>("idle");
  const [previewSessionId, setPreviewSessionId] = useState<string | null>(null);
  const [responseBody, setResponseBody] = useState<unknown>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedModel, setSelectedModel] = useState("gemini-2.5-flash-image");

  const filePreviewUrl = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFile(event.target.files?.[0] ?? null);
  };

  const runAnalyze = async () => {
    if (!file) return;
    setAnalyzeStatus("loading");
    setGenerateStatus("idle");
    setPreviewSessionId(null);
    setErrorMessage(null);

    try {
      const normalizedFile = await convertImageFileForUpload(file);
      const imageBase64 = await fileToDataUrl(normalizedFile);
      const response = await fetch("/api/personalize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "analyze",
          imageBase64,
        }),
      });
      const payload = await response.json();
      setResponseBody(payload);
      if (!response.ok) {
        throw new Error(payload.message ?? "Analyze failed");
      }
      setAnalyzeStatus("success");
    } catch (error) {
      setAnalyzeStatus("error");
      setErrorMessage(error instanceof Error ? error.message : "Analyze failed");
    }
  };

  const runGenerate = async () => {
    if (!file) return;
    setGenerateStatus("loading");
    setPreviewSessionId(null);
    setErrorMessage(null);

    try {
      const normalizedFile = await convertImageFileForUpload(file);
      const imageBase64 = await fileToDataUrl(normalizedFile);
      const response = await fetch("/api/personalize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "generate",
          bookId: "3",
          childName,
          childFeatures: {
            approximateAge: 6,
            gender: "niño",
          },
          imageBase64,
        }),
      });
      const payload = await response.json();
      setResponseBody(payload);
      if (!response.ok) {
        throw new Error(payload.message ?? "Generate failed");
      }
      setPreviewSessionId(payload.previewSessionId ?? null);
      setGenerateStatus(payload.status === "failed" ? "error" : "success");
      if (payload.status === "failed") {
        setErrorMessage(payload.errorMessage ?? "Preview failed");
      }
    } catch (error) {
      setGenerateStatus("error");
      setErrorMessage(error instanceof Error ? error.message : "Generate failed");
    }
  };

  const pollSession = async () => {
    if (!previewSessionId) return;
    setGenerateStatus("loading");
    setErrorMessage(null);

    try {
      const response = await fetch(`/api/personalize?previewSessionId=${encodeURIComponent(previewSessionId)}`);
      const payload = await response.json();
      setResponseBody(payload);
      if (!response.ok) {
        throw new Error(payload.message ?? "Poll failed");
      }
      setGenerateStatus(payload.status === "failed" ? "error" : "success");
      if (payload.status === "failed") {
        setErrorMessage(payload.errorMessage ?? "Preview failed");
      }
    } catch (error) {
      setGenerateStatus("error");
      setErrorMessage(error instanceof Error ? error.message : "Poll failed");
    }
  };

  const runCoverProbe = async () => {
    if (!file) return;
    setCoverTestStatus("loading");
    setErrorMessage(null);

    try {
      const normalizedFile = await convertImageFileForUpload(file);
      const imageBase64 = await fileToDataUrl(normalizedFile);
      const response = await fetch("/api/debug/gemini-cover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64,
          childName,
          model: selectedModel,
        }),
      });
      const payload = await response.json();
      setResponseBody(payload);
      if (!response.ok || !payload.success) {
        throw new Error(payload.errorMessage ?? payload.message ?? "Gemini cover test failed");
      }
      setCoverTestStatus("success");
    } catch (error) {
      setCoverTestStatus("error");
      setErrorMessage(error instanceof Error ? error.message : "Gemini cover test failed");
    }
  };

  return (
    <main className="min-h-screen bg-[#f6f8fb] px-6 py-10 text-[#10213a]">
      <div className="mx-auto max-w-5xl space-y-6">
        <header className="space-y-2">
          <h1 className="text-3xl font-black">Debug Preview</h1>
          <p className="text-sm text-[#52637f]">
            Sube una foto, prueba `analyze`, `generate` y `poll`, y mira la respuesta cruda del backend.
          </p>
        </header>

        <section className="rounded-3xl border border-[#d7e2f0] bg-[#eaf2ff] px-5 py-4 shadow-sm">
          <p className="text-sm font-black uppercase tracking-[0.14em] text-[#2c4f93]">Cómo usar esta página</p>
          <ol className="mt-3 space-y-2 text-sm font-medium text-[#244069]">
            <li>1. Sube la foto en el botón <strong>Choose File</strong>.</li>
            <li>2. Toca el botón verde grande <strong>Generate Preview</strong>.</li>
            <li>3. Si queda en progreso, toca <strong>Poll Session</strong>.</li>
            <li>4. Mira abajo la <strong>Respuesta cruda</strong> y el campo <strong>Error</strong>.</li>
          </ol>
        </section>

        <section className="grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
          <div className="space-y-4 rounded-3xl border border-[#dbe4f0] bg-white p-5 shadow-sm">
            <label className="block text-sm font-semibold">Foto</label>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex cursor-pointer items-center justify-center rounded-full bg-[#163fa0] px-5 py-3 text-sm font-black text-white shadow-[0_12px_28px_-18px_rgba(22,63,160,0.8)]"
            >
              Subir foto para probar
            </button>
            <input
              id="debug-preview-upload"
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="sr-only"
            />
            <p className="text-xs text-[#5c6c86]">
              {file ? `Archivo cargado: ${file.name}` : "Todavía no hay ninguna imagen cargada."}
            </p>

            {filePreviewUrl ? (
              <img src={filePreviewUrl} alt="Preview" className="aspect-square w-full rounded-2xl object-cover" />
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="grid aspect-square w-full cursor-pointer place-items-center rounded-2xl border border-dashed border-[#c8d4e5] text-sm font-semibold text-[#6f7f97] hover:bg-[#f7faff]"
              >
                Toca aquí para elegir una imagen
              </button>
            )}

            <label className="block text-sm font-semibold">Nombre</label>
            <input
              value={childName}
              onChange={(event) => setChildName(event.target.value)}
              className="w-full rounded-xl border border-[#d5dfec] px-3 py-2 text-sm"
            />

            <label className="block text-sm font-semibold">Modelo Gemini</label>
            <select
              value={selectedModel}
              onChange={(event) => setSelectedModel(event.target.value)}
              className="w-full rounded-xl border border-[#d5dfec] px-3 py-2 text-sm"
            >
              <option value="gemini-2.5-flash-image">gemini-2.5-flash-image</option>
              <option value="gemini-3-pro-image-preview">gemini-3-pro-image-preview</option>
              <option value="gemini-3.1-flash-image-preview">gemini-3.1-flash-image-preview</option>
            </select>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={runAnalyze}
                disabled={!file || analyzeStatus === "loading"}
                className="rounded-full bg-[#163fa0] px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
              >
                {analyzeStatus === "loading" ? "Analizando..." : "Analyze"}
              </button>
              <button
                onClick={runGenerate}
                disabled={!file || generateStatus === "loading"}
                className="rounded-full bg-[#1c7c54] px-5 py-3 text-base font-black text-white shadow-[0_12px_28px_-18px_rgba(28,124,84,0.8)] disabled:opacity-50"
              >
                {generateStatus === "loading" ? "Generando preview..." : "Generate Preview"}
              </button>
              <button
                onClick={pollSession}
                disabled={!previewSessionId || generateStatus === "loading"}
                className="rounded-full bg-[#3e4f68] px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
              >
                Poll Session
              </button>
              <button
                onClick={runCoverProbe}
                disabled={!file || coverTestStatus === "loading"}
                className="rounded-full bg-[#8a2be2] px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
              >
                {coverTestStatus === "loading" ? "Probando cover..." : "Test Gemini Cover"}
              </button>
            </div>

            <div className="rounded-2xl bg-[#f4f7fb] p-4 text-sm">
              <p><strong>Analyze:</strong> {analyzeStatus}</p>
              <p><strong>Generate:</strong> {generateStatus}</p>
              <p><strong>Cover test:</strong> {coverTestStatus}</p>
              <p><strong>previewSessionId:</strong> {previewSessionId ?? "—"}</p>
              <p><strong>Error:</strong> {errorMessage ?? "—"}</p>
            </div>
          </div>

          <div className="rounded-3xl border border-[#dbe4f0] bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-lg font-black">Respuesta cruda</h2>
            <pre className="max-h-[70vh] overflow-auto rounded-2xl bg-[#0b1220] p-4 text-xs leading-6 text-[#dce8ff]">
              {JSON.stringify(responseBody, null, 2)}
            </pre>
          </div>
        </section>
      </div>
    </main>
  );
}
