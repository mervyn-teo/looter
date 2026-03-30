import type { ItemRecord } from '../../types';
import { getRarityFromPrice } from '../../services/scoring';
import './LootCard.css';

interface LootCardProps {
  item: ItemRecord;
  compact?: boolean;
  onClick?: () => void;
  onImageClick?: (src: string) => void;
}

export function LootCard({ item, compact = false, onClick, onImageClick }: LootCardProps) {
  const rarity = getRarityFromPrice(item.price);

  if (compact) {
    return (
      <div
        className="loot-card compact"
        style={{ borderLeftColor: rarity.glowColor }}
        onClick={onClick}
      >
        <div className="loot-card-image-compact">
          {item.styledImageUrl ? (
            <img src={item.styledImageUrl} alt={item.itemName} />
          ) : (
            <div className="loot-placeholder">🎁</div>
          )}
        </div>
        <div className="loot-card-info">
          <h3 className="loot-card-name">{item.itemName}</h3>
          <div className="loot-card-meta">
            <span
              className="rarity-badge"
              style={{ backgroundColor: rarity.glowColor }}
            >
              {item.rarityTier}
            </span>
            <span className="loot-card-price">${item.price.toFixed(2)}</span>
          </div>
        </div>
        <div className="loot-card-score" style={{ color: rarity.glowColor }}>
          {item.happinessValue} pts
        </div>
      </div>
    );
  }

  return (
    <div className="loot-card full" onClick={onClick}>
      <div
        className={`loot-card-image-full${onImageClick ? ' clickable' : ''}`}
        style={{
          boxShadow: `0 0 30px ${rarity.glowColor}40`,
          borderColor: rarity.glowColor,
        }}
        onClick={(e) => {
          if (onImageClick && item.styledImageUrl) {
            e.stopPropagation();
            onImageClick(item.styledImageUrl);
          }
        }}
      >
        {item.styledImageUrl ? (
          <img src={item.styledImageUrl} alt={item.itemName} className="styled-image" />
        ) : (
          <div className="loot-placeholder large">🎁</div>
        )}
        <span
          className="rarity-badge overlay"
          style={{ backgroundColor: rarity.glowColor }}
        >
          {item.rarityTier}
        </span>
      </div>

      <div className="loot-card-details">
        <h2 className="loot-card-title">{item.itemName}</h2>
        <div className="score-breakdown">
          <div className="score-row">
            <span>Cost score</span>
            <span className="score-value">{item.costScore} / 50</span>
          </div>
          <div className="score-row">
            <span>Uniqueness score</span>
            <span className="score-value">{item.uniquenessScore} / 50</span>
          </div>
          <div className="score-row total">
            <span>Total happiness</span>
            <span className="score-value total" style={{ color: rarity.glowColor }}>
              {item.happinessValue} pts
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
