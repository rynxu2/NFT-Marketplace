'use client';

import React, { useState } from 'react';
import { Tag, AlertTriangle } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import type { Collection } from '@/types/collection';

interface SellCollectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  collection: Collection;
  onSell: (price: number) => Promise<boolean>;
  loading?: boolean;
}

export default function SellCollectionModal({
  isOpen,
  onClose,
  collection,
  onSell,
  loading = false,
}: SellCollectionModalProps) {
  const [price, setPrice] = useState('');
  const currency = collection.chain === 'polygon' ? 'POL' : 'SOL';

  const handleSell = async () => {
    const numPrice = parseFloat(price);
    if (isNaN(numPrice) || numPrice <= 0) return;
    const success = await onSell(numPrice);
    if (success) {
      setPrice('');
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Sell Collection">
      <div className="space-y-5">
        {/* Collection info */}
        <div className="p-4 bg-[var(--bg-primary)] border border-[var(--border-color)]">
          <p className="text-sm font-semibold text-[var(--text-primary)] font-[family-name:var(--font-display)]">
            {collection.name}
          </p>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            {collection.stats.items} items · {collection.category}
          </p>
        </div>

        {/* Price input */}
        <Input
          label={`Price (${currency})`}
          type="number"
          step="0.01"
          min="0"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          placeholder={`Enter price in ${currency}`}
          icon={<Tag size={16} />}
        />

        {/* Warning */}
        <div className="flex items-start gap-3 p-3 bg-[var(--color-crimson)]/10 border border-[var(--color-crimson)]/20">
          <AlertTriangle size={16} className="text-[var(--color-crimson)] shrink-0 mt-0.5" />
          <p className="text-xs text-[var(--color-crimson)]">
            This will sell ALL {collection.stats.items} NFTs and the collection ownership to the buyer.
            Active listings will be cancelled.
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 pt-2">
          <Button variant="ghost" size="sm" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleSell}
            loading={loading}
            disabled={!price || parseFloat(price) <= 0}
            className="flex-1"
          >
            Sell Collection
          </Button>
        </div>
      </div>
    </Modal>
  );
}
