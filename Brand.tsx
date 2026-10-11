const glyphs = [
  ['1111111', '1111111', '1100000', '1100000', '1111100', '1100000', '1100000', '1111111', '1111111'],
  ['1111110', '1111111', '1100011', '1100011', '1111110', '1111100', '1101100', '1100110', '1100011'],
  ['1100011', '1110011', '1110011', '1111011', '1101111', '1101111', '1100111', '1100111', '1100011'],
  ['0011100', '0111110', '1100011', '1100011', '1100011', '1111111', '1111111', '1100011', '1100011'],
  ['0111111', '1111111', '1100000', '1100000', '0111110', '0000011', '0000011', '1111111', '1111110'],
];

export function PixelLogo({ className = '' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 43 9" fill="currentColor" shapeRendering="crispEdges" aria-hidden="true">
      {glyphs.flatMap((glyph, letter) => glyph.flatMap((row, y) => [...row].map((pixel, x) => (
        pixel === '1' ? <rect key={`${letter}-${x}-${y}`} x={letter * 9 + x} y={y} width={1} height={1} /> : null
      ))))}
    </svg>
  );
}

export function MothMark({ className = '' }: { className?: string }) {
  return (
    <svg className={className} width="32" height="28" viewBox="0 0 32 28" fill="none" aria-hidden="true">
      <path d="M14 10h4v13h-4zM15 5h2v4h-2zM11 2h2v3h-2zM19 2h2v3h-2zM13 5h2v2h-2zM17 5h2v2h-2zM2 5h4v2h4v3h3v9H9v-2H6v-3H3v-4H2zM30 5h-4v2h-4v3h-3v9h4v-2h3v-3h3v-4h1zM5 18h4v2h4v3h-3v2H6v-3H5zM27 18h-4v2h-4v3h3v2h4v-3h1z" fill="currentColor" />
    </svg>
  );
}