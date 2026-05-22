/** Clickable legend — toggle series visibility on charts. */
export default function ChartLegend({ items, onToggle }) {
  if (!items?.length) return null;

  return (
    <div className="chart-legend" role="group" aria-label="Chart series">
      {items.map((item) => {
        const active = item.active !== false;
        return (
          <button
            key={item.id}
            type="button"
            className={`chart-legend-item${active ? "" : " is-off"}`}
            aria-pressed={active}
            onClick={() => onToggle(item.id)}
          >
            <span className={`swatch ${item.swatch}`} aria-hidden />
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
