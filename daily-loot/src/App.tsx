import { useEffect, useState } from 'react';
import { format } from 'date-fns';
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
  const deleteItems = useStore(s => s.deleteItems);

  const [selectedItem, setSelectedItem] = useState<ItemRecord | null>(null);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    initialize();
  }, [initialize]);

  const today = format(new Date(), 'yyyy-MM-dd');
  const isToday = selectedDate === today;
  const dayItems = items.filter(item => item.date === selectedDate);
  const dailyTotal = dayItems.reduce((sum, item) => sum + item.happinessValue, 0);

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleDeleteSelected = () => {
    if (selectedIds.size === 0) return;
    const count = selectedIds.size;
    if (confirm(`Delete ${count} item${count > 1 ? 's' : ''}?`)) {
      deleteItems(Array.from(selectedIds));
      setSelectedIds(new Set());
      setSelectMode(false);
    }
  };

  const exitSelectMode = () => {
    setSelectMode(false);
    setSelectedIds(new Set());
  };

  const handleDeleteSingle = (item: ItemRecord) => {
    if (confirm(`Delete "${item.itemName}"?`)) {
      deleteItems([item.id]);
      setSelectedItem(null);
    }
  };

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
                <span className="day-label">{isToday ? "Today's haul" : selectedDate}</span>
                <span className="day-total">{dailyTotal} <small>pts</small></span>
              </div>

              {/* Select / Delete toolbar */}
              {dayItems.length > 0 && (
                <div className="select-toolbar">
                  {selectMode ? (
                    <>
                      <button className="toolbar-btn cancel" onClick={exitSelectMode}>
                        Cancel
                      </button>
                      <span className="toolbar-count">
                        {selectedIds.size} selected
                      </span>
                      <button
                        className="toolbar-btn select-all"
                        onClick={() => {
                          if (selectedIds.size === dayItems.length) {
                            setSelectedIds(new Set());
                          } else {
                            setSelectedIds(new Set(dayItems.map(i => i.id)));
                          }
                        }}
                      >
                        {selectedIds.size === dayItems.length ? 'Deselect all' : 'Select all'}
                      </button>
                      <button
                        className="toolbar-btn delete"
                        onClick={handleDeleteSelected}
                        disabled={selectedIds.size === 0}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        </svg>
                        Delete
                      </button>
                    </>
                  ) : (
                    <button className="toolbar-btn select" onClick={() => setSelectMode(true)}>
                      Select
                    </button>
                  )}
                </div>
              )}

              {dayItems.length === 0 ? (
                <div className="empty-state">
                  <span className="empty-icon">&#127918;</span>
                  <p>No loot logged for this day</p>
                  {isToday && <p className="empty-sub">Tap + to capture your first item!</p>}
                </div>
              ) : (
                <div className="items-list">
                  {dayItems.map(item => (
                    <div key={item.id} className={`card-wrapper ${selectMode ? 'select-mode' : ''} ${selectedIds.has(item.id) ? 'selected' : ''}`}>
                      {selectMode && (
                        <div
                          className="select-checkbox"
                          onClick={() => toggleSelect(item.id)}
                        >
                          {selectedIds.has(item.id) ? (
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="#534AB7">
                              <rect x="2" y="2" width="20" height="20" rx="4" fill="#534AB7"/>
                              <path d="M7 12l3 3 7-7" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                            </svg>
                          ) : (
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                              <rect x="2" y="2" width="20" height="20" rx="4" stroke="#888" strokeWidth="2" fill="none"/>
                            </svg>
                          )}
                        </div>
                      )}
                      <LootCard
                        item={item}
                        compact
                        onClick={() => {
                          if (selectMode) {
                            toggleSelect(item.id);
                          } else {
                            setSelectedItem(item);
                          }
                        }}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <Trends />
          )}
        </div>
      </div>

      {/* FAB — only shown on today's date */}
      {!selectMode && isToday && (
        <button className="fab" onClick={openCapture} aria-label="Add new item">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M12 5V19M5 12H19" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
          </svg>
        </button>
      )}

      {/* Capture Flow */}
      {showCaptureFlow && <CaptureFlow />}

      {/* Item Detail Modal */}
      {selectedItem && (
        <div className="modal-overlay" onClick={() => setSelectedItem(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelectedItem(null)}>&#10005;</button>
            <LootCard item={selectedItem} onImageClick={setLightboxSrc} />
            <button
              className="btn-delete-item"
              onClick={() => handleDeleteSingle(selectedItem)}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
              Delete item
            </button>
          </div>
        </div>
      )}

      {/* Fullscreen Image Lightbox */}
      <ImageLightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />
    </div>
  );
}

export default App;
