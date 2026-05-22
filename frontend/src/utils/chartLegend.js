export const LEGEND_IDS = {
  selected: "selected",
  reference: "reference",
};

export function defaultLegendVisibility({ includeReference = true } = {}) {
  return {
    [LEGEND_IDS.selected]: true,
    [LEGEND_IDS.reference]: includeReference,
  };
}

/** Shared legend for selected record vs unaided reference charts. */
export function buildRecordComparisonLegend(visible, { showReference = true } = {}) {
  const items = [
    {
      id: LEGEND_IDS.selected,
      label: "Selected record",
      swatch: "measured",
      active: visible[LEGEND_IDS.selected] !== false,
    },
  ];
  if (showReference) {
    items.push({
      id: LEGEND_IDS.reference,
      label: "Unaided reference",
      swatch: "reference",
      active: visible[LEGEND_IDS.reference] !== false,
    });
  }
  return items;
}
