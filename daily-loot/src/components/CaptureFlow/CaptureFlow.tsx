import { useRef, useState } from 'react';
import { useStore } from '../../store/useStore';
import { CATEGORIES } from '../../types';
import { LootCard } from '../LootCard/LootCard';
import { ImageLightbox } from '../ImageLightbox/ImageLightbox';
import './CaptureFlow.css';

export function CaptureFlow() {
  const capture = useStore(s => s.capture);
  const closeCapture = useStore(s => s.closeCapture);
  const setPhoto = useStore(s => s.setPhoto);
  const startIdentification = useStore(s => s.startIdentification);
  const updateConfirmation = useStore(s => s.updateConfirmation);
  const generateLootCard = useStore(s => s.generateLootCard);
  const retryImage = useStore(s => s.retryImage);
  const saveItem = useStore(s => s.saveItem);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [identifying, setIdentifying] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);

  const rotateImageCCW = () => {
    const newRotation = (rotation - 90 + 360) % 360;
    setRotation(newRotation);

    // Apply rotation to the actual image data so the AI gets the correct orientation
    if (!capture.photoDataUrl) return;
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      // For 90/270 degree rotations, swap width and height
      if (newRotation % 180 !== 0) {
        canvas.width = img.height;
        canvas.height = img.width;
      } else {
        canvas.width = img.width;
        canvas.height = img.height;
      }
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((-90 * Math.PI) / 180); // always rotate -90 from current
      ctx.drawImage(img, -img.width / 2, -img.height / 2);
      const rotatedDataUrl = canvas.toDataURL('image/jpeg', 0.9);
      setPhoto(rotatedDataUrl);
      setRotation(0); // reset visual rotation since we baked it in
    };
    img.src = capture.photoDataUrl;
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      setPhoto(dataUrl);
      setIdentifying(true);
      await startIdentification();
      setIdentifying(false);
    };
    reader.readAsDataURL(file);
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setCameraActive(true);
      }
    } catch (err) {
      console.error('Camera access denied:', err);
      alert('Camera access denied. Please use the gallery option instead.');
    }
  };

  const captureFromCamera = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(videoRef.current, 0, 0);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);

    // Stop camera stream
    const stream = videoRef.current.srcObject as MediaStream;
    stream?.getTracks().forEach(t => t.stop());
    setCameraActive(false);

    setPhoto(dataUrl);
    setIdentifying(true);
    startIdentification().then(() => setIdentifying(false));
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream?.getTracks().forEach(t => t.stop());
    }
    setCameraActive(false);
  };

  // ── Screen 1: Capture ──
  if (capture.step === 'capture') {
    return (
      <div className="capture-overlay">
        <div className="capture-screen">
          <div className="capture-header">
            <button className="back-btn" onClick={() => { stopCamera(); closeCapture(); }}>
              Cancel
            </button>
            <h2>New item</h2>
            <div style={{ width: 60 }} />
          </div>

          {identifying ? (
            <div className="capture-loading">
              <div className="spinner" />
              <p>Identifying item...</p>
            </div>
          ) : cameraActive ? (
            <div className="camera-view">
              <video ref={videoRef} autoPlay playsInline className="camera-video" />
              <button className="capture-btn" onClick={captureFromCamera}>
                <div className="capture-btn-inner" />
              </button>
            </div>
          ) : (
            <div className="capture-options">
              <div className="camera-placeholder">
                <span className="camera-icon">📷</span>
                <p>Take a photo of your purchase</p>
              </div>
              <div className="capture-buttons">
                <button className="btn btn-primary" onClick={startCamera}>
                  Take photo
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Gallery
                </button>
              </div>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleFileSelect}
          />
        </div>
      </div>
    );
  }

  // ── Screen 2: Confirm Details ──
  if (capture.step === 'confirm') {
    return (
      <div className="capture-overlay">
        <div className="capture-screen">
          <div className="capture-header">
            <button className="back-btn" onClick={closeCapture}>Back</button>
            <h2>Confirm item</h2>
            <div style={{ width: 60 }} />
          </div>

          <div className="confirm-content">
            {capture.photoDataUrl && (
              <div className="photo-preview-wrapper">
                <div className="photo-preview">
                  <img src={capture.photoDataUrl} alt="Captured item" />
                </div>
                <button
                  className="rotate-btn"
                  onClick={rotateImageCCW}
                  title="Rotate image left"
                  type="button"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M2.5 2v6h6" />
                    <path d="M2.5 8a10 10 0 1 1 3.07-4.53" />
                  </svg>
                </button>
              </div>
            )}

            <div className="form-group">
              <label>Item name</label>
              <input
                type="text"
                value={capture.confirmedName}
                onChange={e => updateConfirmation('name', e.target.value)}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label>Category</label>
              <select
                value={capture.confirmedCategory}
                onChange={e => updateConfirmation('category', e.target.value)}
                className="form-input"
              >
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Price</label>
              <div className="price-input-wrapper">
                <span className="price-prefix">$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={capture.confirmedPrice}
                  onChange={e => updateConfirmation('price', parseFloat(e.target.value) || 0)}
                  className="form-input price-input"
                />
              </div>
            </div>

            <button className="btn btn-primary full-width" onClick={generateLootCard}>
              Generate loot card
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Generating state ──
  if (capture.step === 'generating') {
    return (
      <div className="capture-overlay">
        <div className="capture-screen">
          <div className="capture-header">
            <div style={{ width: 60 }} />
            <h2>Generating...</h2>
            <div style={{ width: 60 }} />
          </div>
          <div className="capture-loading">
            <div className="spinner large" />
            <p>Creating your loot card...</p>
            <p className="loading-sub">Applying cinematic bokeh and game-style effects</p>
          </div>
        </div>
      </div>
    );
  }

  // ── Screen 3: Loot Drop ──
  if (capture.step === 'lootdrop' && capture.currentItem) {
    return (
      <div className="capture-overlay">
        <div className="capture-screen loot-drop-screen">
          <div className="capture-header">
            <div style={{ width: 60 }} />
            <h2>Item acquired!</h2>
            <div style={{ width: 60 }} />
          </div>

          <div className="loot-drop-content">
            <LootCard item={capture.currentItem} onImageClick={setLightboxSrc} />

            <div className="loot-drop-actions">
              <button className="btn btn-secondary" onClick={retryImage}>
                Retry image
              </button>
              <button className="btn btn-primary" onClick={saveItem}>
                Save
              </button>
            </div>
          </div>
          <ImageLightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />
        </div>
      </div>
    );
  }

  return null;
}
