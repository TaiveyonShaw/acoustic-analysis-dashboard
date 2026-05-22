/** MAT azimuth 180° = front; display 0° = front. */
export function remapAzimuth(deg) {
  let a = deg - 180;
  while (a > 180) a -= 360;
  while (a <= -180) a += 360;
  return a;
}

export function remapAzimuthList(azimuths) {
  return azimuths?.map(remapAzimuth) ?? [];
}
