import { useEffect, useState } from 'react';
import { useStore } from './store/useStore';
import { Calendar } from './components/Calendar/Calendar';
import { LootCard } from './components/LootCard/LootCard';
import { CaptureFlow } from './components/CaptureFlow/CaptureFlow';
import { Trends } from './components/Trends/Trends';
import { ImageLightbox } from './components/ImageLightbox/ImageLightbox';
import type { ItemRecord } from './types';
import './App.css';

function App() {
  const initialize = useStore(s => s.initialize);
  const items = useStore(s => s.items);
  const selectedDate = useStore(s => s.selectedDate);
  const activeTab = useStore(s => s.activeTab);
  const setActiveTab = useStore(s => s.setActiveTab);
  const showCaptureFlow = useStore(s => s.showCaptureFlow);
  const openCapture = useStore(s => s.openCapture);

  const [selectedItem, setSelectedItem] = useState<ItemRecord | null>(null);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);

  useEffect(() => {
    initialize();
  }, [initialize]);

  // Derive from items directly so the component re-renders when items change
  const dayItems = items.filter(item => item.date === selectedDate);
  const dailyTotal = dayItems.reduce((sum, item) => sum + item.happinessValue, 0);

  return (
    <div className="app">
      {/* Top half: Calendar */}
      <Calendar />

      {/* Bottom half: Tabs */}
      <div className="bottom-section">
        <div className="tab-bar">
          <button
            className={`tab ${activeTab === 'items' ? 'active' : ''}`}
            onClick={() => setActiveTab('items')}
          >
            Items
          </button>
          <button
            className={`tab ${activeTab === 'trends' ? 'active' : ''}`}
            onClick={() => setActiveTab('trends')}
          >
            Trends
          </button>
        </div>

        <div className="tab-content">
          {activeTab === 'items' ? (
            <div className="items-view">
              <div className="day-header">
                <span className="day-label">Today's haul</span>
                <span className="day-total">{dailyTotal} <small>pts</small></span>
              </div>

              {dayItems.length === 0 ? (
                <div className="empty-state">
                  <span className="empty-icon">🎮</span>
                  <p>No loot logged for this day</p>
                  <p className="empty-sub">Tap + to capture your first item!</p>
                </div>
              ) : (
                <div className="items-list">
                  {dayItems.map(item => (
                    <LootCard
                      key={item.id}
                      item={item}
                      compact
                      onClick={() => setSelectedItem(item)}
                    />
                  ))}
                </div>
              )}
            </div>
          ) : (
            <Trends />
          )}
        </div>
      </div>

      {/* FAB */}
      <button className="fab" onClick={openCapture} aria-label="Add new item">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M12 5V19M5 12H19" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
        </svg>
      </button>

      {/* Capture Flow */}
      {showCaptureFlow && <CaptureFlow />}

      {/* Item Detail Modal */}
      {selectedItem && (
        <div className="modal-overlay" onClick={() => setSelectedItem(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelectedItem(null)}>✕</button>
            <LootCard item={selectedItem} onImageClick={setLightboxSrc} />
            <div className="modal-images">
              <div className="modal-image-pair">
                <div>
                  <p className="image-label">Original</p>
                  <img
                    src={selectedItem.originalImageUrl}
                    alt="Original"
                    className="modal-img clickable"
                    onClick={() => setLightboxSrc(selectedItem.originalImageUrl)}
                  />
                </div>
                {selectedItem.styledImageUrl && (
                  <div>
                    <p className="image-label">Stylized</p>
                    <img
                      src={selectedItem.styledImageUrl}
                      alt="Stylized"
                      className="modal-img styled clickable"
                      onClick={() => setLightboxSrc(selectedItem.styledImageUrl!)}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Fullscreen Image Lightbox */}
      <ImageLightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />
    </div>
  );
}

export default App;
