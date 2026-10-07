import { Radio } from "lucide-react";
import { type Game } from "../engine";

export function NewsFeed({ g }: { g: Game }) {
  return (
    <div className="panel news">
      <div className="section-title">
        <h3>
          <Radio size={16} /> The market wire
        </h3>
        <span className="tiny">FICTIONAL NEWS</span>
      </div>
      {g.news.slice(0, 4).map((n) => (
        <div className="news-item" key={n.id}>
          <span className={`news-dot ${n.impact < 0 ? "red" : ""}`} />
          <div>
            <small>
              {n.asset}{" "}
              <span>
                · {Math.max(0, Math.floor((Date.now() - n.time) / 60000))}m ago
              </span>
            </small>
            <p>{n.headline}</p>
          </div>
          {n.impact !== 0 && (
            <span className={n.impact > 0 ? "positive" : "negative"}>
              {n.impact > 0 ? "↗" : "↘"}
            </span>
          )}
        </div>
      ))}
      <p className="muted">
        Simulated stories. Fictional outcomes. Zero financial advice.
      </p>
    </div>
  );
}
