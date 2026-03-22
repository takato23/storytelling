function escapeXml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

export function addPreviewWatermark(imageDataUrl: string) {
  const safeImage = escapeXml(imageDataUrl);
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 840" width="1200" height="840">
      <defs>
        <pattern id="wm" width="380" height="190" patternUnits="userSpaceOnUse" patternTransform="rotate(-24)">
          <text
            x="0"
            y="96"
            fill="rgba(255,255,255,0.28)"
            font-family="Arial, Helvetica, sans-serif"
            font-size="40"
            font-weight="700"
            letter-spacing="2"
          >
            STORYMAGIC PREVIEW
          </text>
        </pattern>
        <linearGradient id="fade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="rgba(14,21,36,0.02)" />
          <stop offset="100%" stop-color="rgba(14,21,36,0.28)" />
        </linearGradient>
      </defs>

      <image href="${safeImage}" x="0" y="0" width="1200" height="840" preserveAspectRatio="xMidYMid slice" />
      <rect x="0" y="0" width="1200" height="840" fill="url(#fade)" />
      <rect x="0" y="0" width="1200" height="840" fill="url(#wm)" />

      <g transform="translate(46 710)">
        <rect x="0" y="0" rx="24" ry="24" width="500" height="86" fill="rgba(255,255,255,0.92)" />
        <text
          x="30"
          y="38"
          fill="#172033"
          font-family="Arial, Helvetica, sans-serif"
          font-size="28"
          font-weight="700"
        >
          Vista previa con marca de agua
        </text>
        <text
          x="30"
          y="64"
          fill="#43506b"
          font-family="Arial, Helvetica, sans-serif"
          font-size="18"
        >
          La versión final en alta calidad se entrega después del pago.
        </text>
      </g>
    </svg>
  `.trim();

  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}
