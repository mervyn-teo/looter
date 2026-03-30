import type { ItemRecord } from '../../types';
import { getRarityFromPrice } from '../../services/scoring';
import './LootCard.css';

interface LootCardProps {
  item: ItemRecord;
  compact?: boolean;
  onClick?: () => void;
  onImageClick?: (src: string) => void;
}

const CATEGORY_ICONS: Record<string, string> = {
  coffee: '\u2615',
  food: '\uD83C\uDF54',
  snacks: '\uD83C\uDF6A',
  drinks: '\uD83E\uDDC3',
  electronics: '\u26A1',
  clothing: '\uD83D\uDC55',
  accessories: '\uD83D\uDC8D',
  books: '\uD83D\uDCDA',
  health: '\uD83D\uDC8A',
  beauty: '\u2728',
  home: '\uD83C\uDFE0',
  entertainment: '\uD83C\uDFAC',
  transportation: '\uD83D\uDE97',
  groceries: '\uD83D\uDED2',
  sports: '\u26BD',
  toys: '\uD83E\uDDF8',
  office: '\uD83D\uDCCE',
  other: '\uD83D\uDCE6',
};

export function LootCard({ item, compact = false, onClick, onImageClick }: LootCardProps) {
  const rarity = getRarityFromPrice(item.price);
  const categoryIcon = CATEGORY_ICONS[item.category] || '\uD83D\uDCE6';

  if (compact) {
    return (
      <div
        className={`tcg-card compact rarity-${item.rarityTier.toLowerCase()}`}
        style={{ '--rarity-color': rarity.glowColor } as React.CSSProperties}
        onClick={onClick}
      >
        {/* Card border frame */}
        <div className="tcg-card-frame">
          {/* Top bar: name + category */}
          <div className="tcg-card-header">
            <span className="tcg-card-name">{item.itemName}</span>
            <span className="tcg-card-category-icon">{categoryIcon}</span>
          </div>

          {/* Image window */}
          <div className="tcg-card-image-frame">
            {item.styledImageUrl ? (
              <img src={item.styledImageUrl} alt={item.itemName} />
            ) : item.originalImageUrl ? (
              <img src={item.originalImageUrl} alt={item.itemName} />
            ) : (
              <div className="tcg-placeholder">{categoryIcon}</div>
            )}
          </div>

          {/* Type bar */}
          <div className="tcg-card-type-bar">
            <span className="tcg-rarity-badge">{item.rarityTier}</span>
            <span className="tcg-card-category">{item.category}</span>
          </div>

          {/* Description */}
          <div className="tcg-card-description">
            <p>{item.description || 'A mysterious item of unknown origin.'}</p>
          </div>

          {/* Stats footer */}
          <div className="tcg-card-stats">
            <span className="tcg-stat">
              <span className="tcg-stat-label">HP</span>
              <span className="tcg-stat-value">{item.happinessValue}</span>
            </span>
            <span className="tcg-stat">
              <span className="tcg-stat-label">ATK</span>
              <span className="tcg-stat-value">{item.costScore}</span>
            </span>
            <span className="tcg-stat">
              <span className="tcg-stat-label">DEF</span>
              <span className="tcg-stat-value">{item.uniquenessScore}</span>
            </span>
            <span className="tcg-price">${item.price.toFixed(2)}</span>
          </div>
        </div>
      </div>
    );
  }

  // ── Full card (detail / loot drop view) ──
  return (
    <div
      className={`tcg-card full rarity-${item.rarityTier.toLowerCase()}`}
      style={{ '--rarity-color': rarity.glowColor } as React.CSSProperties}
      onClick={onClick}
    >
      <div className="tcg-card-frame">
        {/* Header */}
        <div className="tcg-card-header">
          <span className="tcg-card-name">{item.itemName}</span>
          <span className="tcg-card-category-icon">{categoryIcon}</span>
        </div>

        {/* Image */}
        <div
          className={`tcg-card-image-frame${onImageClick ? ' clickable' : ''}`}
          onClick={(e) => {
            if (onImageClick && (item.styledImageUrl || item.originalImageUrl)) {
              e.stopPropagation();
              onImageClick(item.styledImageUrl || item.originalImageUrl);
            }
          }}
        >
          {item.styledImageUrl ? (
            <img src={item.styledImageUrl} alt={item.itemName} className="styled-image" />
          ) : item.originalImageUrl ? (
            <img src={item.originalImageUrl} alt={item.itemName} />
          ) : (
            <div className="tcg-placeholder large">{categoryIcon}</div>
          )}
        </div>

        {/* Type bar */}
        <div className="tcg-card-type-bar">
          <span className="tcg-rarity-badge">{item.rarityTier}</span>
          <span className="tcg-card-category">{item.category}</span>
        </div>

        {/* Description */}
        <div className="tcg-card-description">
          <p>{item.description || 'A mysterious item of unknown origin.'}</p>
        </div>

        {/* Score breakdown */}
        <div className="tcg-card-stats-full">
          <div className="tcg-stat-row">
            <span className="tcg-stat-icon">&#9876;</span>
            <span>Cost Score</span>
            <span className="tcg-stat-value">{item.costScore}/50</span>
          </div>
          <div className="tcg-stat-row">
            <span className="tcg-stat-icon">&#9733;</span>
            <span>Uniqueness</span>
            <span className="tcg-stat-value">{item.uniquenessScore}/50</span>
          </div>
          <div className="tcg-stat-row total">
            <span className="tcg-stat-icon">&#10084;</span>
            <span>Happiness</span>
            <span className="tcg-stat-value total">{item.happinessValue} pts</span>
          </div>
        </div>
      </div>
    </div>
  );
}
