// Astronomical position for Bucharest. X east, Y up, -Z north in the building.
// Solar coordinates use the standard low-precision SunCalc/astronomy formulas.
export const BUCHAREST = {latitude: 44.4268, longitude: 26.1025, timeZone: 'Europe/Bucharest'};
const rad = Math.PI / 180, dayMs = 86400000, J1970 = 2440588, J2000 = 2451545;
const e = rad * 23.4397;
export function solarPosition(date, latitude = BUCHAREST.latitude, longitude = BUCHAREST.longitude) {
  const d = date.valueOf() / dayMs - .5 + J1970 - J2000;
  const M = rad * (357.5291 + .98560028 * d);
  const C = rad * (1.9148 * Math.sin(M) + .02 * Math.sin(2*M) + .0003 * Math.sin(3*M));
  const L = M + C + rad * 102.9372 + Math.PI;
  const dec = Math.asin(Math.sin(L) * Math.sin(e));
  const ra = Math.atan2(Math.sin(L) * Math.cos(e), Math.cos(L));
  const H = rad * (280.16 + 360.9856235 * d + longitude) - ra;
  const lat = latitude * rad;
  const altitude = Math.asin(Math.sin(lat)*Math.sin(dec) + Math.cos(lat)*Math.cos(dec)*Math.cos(H));
  // Azimuth in radians, measured from south towards west.
  const azimuth = Math.atan2(Math.sin(H), Math.cos(H)*Math.sin(lat) - Math.tan(dec)*Math.cos(lat));
  return {altitude, azimuth, east: -Math.sin(azimuth)*Math.cos(altitude), up: Math.sin(altitude), south: Math.cos(azimuth)*Math.cos(altitude)};
}
const parts = new Intl.DateTimeFormat('en-GB', {timeZone: BUCHAREST.timeZone, year:'numeric', month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit', second:'2-digit', hourCycle:'h23'});
export function bucharestParts(date) {
  return Object.fromEntries(parts.formatToParts(date).filter(p => p.type !== 'literal').map(p => [p.type, Number(p.value)]));
}
// Convert a wall-clock selection to an instant. DST gaps resolve to the nearest
// valid local time; the interface always displays the actual resolved time.
export function bucharestTimeOnSameDay(now, minutes) {
  const p = bucharestParts(now), target = Date.UTC(p.year,p.month-1,p.day,0,minutes);
  let instant = target;
  for (let i=0; i<4; i++) {
    const q = bucharestParts(new Date(instant));
    const local = Date.UTC(q.year,q.month-1,q.day,q.hour,q.minute,q.second);
    const next = instant + target - local;
    if (next === instant) break;
    instant = next;
  }
  return new Date(instant);
}
