import './ImageLightbox.css';

interface ImageLightboxProps {
  src: string | null;
  onClose: () => void;
}

export function ImageLightbox({ src, onClose }: ImageLightboxProps) {
  if (!src) return null;

  return (
    <div className="lightbox" onClick={onClose}>
      <button className="lightbox-close" onClick={onClose}>✕</button>
      <img src={src} alt="Full size" className="lightbox-img" onClick={e => e.stopPropagation()} />
    </div>
  );
}
