/** Sorted azimuth rows; rowIndex indexes into matrix rows when labels repeat. */
export function sortedAzimuthSlots(azimuths) {
  return (azimuths ?? [])
    .map((az, rowIndex) => ({ az, rowIndex }))
    .sort((a, b) => a.az - b.az);
}

export function azimuthSlotKey({ az, rowIndex }) {
  return `${az}-${rowIndex}`;
}
