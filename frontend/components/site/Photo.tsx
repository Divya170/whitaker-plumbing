/**
 * Image slot: the uploaded photo when there is one, otherwise the design's striped
 * placeholder with its monospace caption.
 */
export function Photo({
  src,
  alt,
  label,
  className = '',
  zoom,
  hover,
  style,
}: {
  src?: string | null;
  alt: string;
  label?: string;
  className?: string;
  zoom?: boolean;
  hover?: boolean;
  style?: React.CSSProperties;
}) {
  const cls = ['ph', zoom && 'ph--zoom', hover && 'ph--hover', className].filter(Boolean).join(' ');
  if (src) {
    return (
      <div className={cls} style={style}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={alt} loading="lazy" />
      </div>
    );
  }
  return (
    <div className={cls} role="img" aria-label={alt} style={style}>
      <div className="ph__stripes" />
      {label && <span className="ph__label">{label}</span>}
    </div>
  );
}
