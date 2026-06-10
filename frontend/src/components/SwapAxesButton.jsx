export default function SwapAxesButton({
  active,
  onClick,
  disabled = false,
  className = "",
  title = "Swap horizontal and vertical axes",
  ariaLabel = "Swap horizontal and vertical axes",
}) {
  return (
    <button
      type="button"
      className={`btn secondary swap-axes-btn${active ? " swap-axes-btn--active" : ""}${className ? ` ${className}` : ""}`}
      onClick={onClick}
      disabled={disabled}
      aria-pressed={active}
      aria-label={ariaLabel}
      title={title}
    >
      Swap axes
    </button>
  );
}
