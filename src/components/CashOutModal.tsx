import { X } from "lucide-react";

export function CashOutModal({
  label,
  onConfirm,
  onClose,
}: {
  label: string;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <div className="modal-backdrop">
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-label="Confirm large trade"
      >
        <button className="close" onClick={onClose}>
          <X />
        </button>
        <div className="eyebrow">LARGE TRADE</div>
        <h2>Ready to make your move?</h2>
        <p>{label} This order exceeds 25% of your portfolio or $5,000 MC.</p>
        <button className="primary" onClick={onConfirm}>
          Confirm trade
        </button>
        <button className="secondary" onClick={onClose}>
          Keep thinking
        </button>
      </div>
    </div>
  );
}
