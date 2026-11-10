// Current modelled conditions for central Bucharest; updated independently of the solar time preview.
const URL = 'https://api.open-meteo.com/v1/forecast?latitude=44.4268&longitude=26.1025&current=temperature_2m,weather_code,cloud_cover,rain,showers,snowfall,wind_speed_10m,wind_direction_10m&timezone=Europe%2FBucharest';
const INTERVAL = 15 * 60 * 1000, MAX_AGE = 60 * 60 * 1000;
export function describeWeather(code) {
  if (code === 0) return 'Senin';
  if (code <= 3) return ['Senin','Mai mult senin','Parțial înnorat','Înnorat'][code];
  if ([45,48].includes(code)) return 'Ceață';
  if ([51,53,55,56,57].includes(code)) return 'Burniță';
  if ([61,63,65,66,67,80,81,82].includes(code)) return 'Ploaie';
  if ([71,73,75,77,85,86].includes(code)) return 'Ninsoare';
  if (code >= 95 && code <= 99) return 'Furtună';
  return 'Condiții variabile';
}
export function parseWeather(data) {
  const c = data?.current;
  if (!c || !Number.isFinite(c.weather_code) || !Number.isFinite(c.cloud_cover) || !Number.isFinite(c.temperature_2m) || typeof c.time !== 'string') throw new Error('Date meteo incomplete');
  const code=c.weather_code;
  const snowCodes=[71,73,75,77,85,86], rainCodes=[51,53,55,56,57,61,63,65,66,67,80,81,82,95,96,99];
  return {code, label:describeWeather(code), temperature:c.temperature_2m, clouds:Math.max(0,Math.min(1,c.cloud_cover/100)),
    rain:Math.max(0,Number(c.rain)||0)+Math.max(0,Number(c.showers)||0), snow:Math.max(0,Number(c.snowfall)||0),
    hasRain:rainCodes.includes(code), hasSnow:snowCodes.includes(code), wind:Math.max(0,Number(c.wind_speed_10m)||0), windDirection:Number(c.wind_direction_10m)||0, time:c.time};
}
export function createBucharestWeather({onUpdate, onStatus}) {
  let timer, latest=null, lastSuccess=0, busy=false, stopped=false;
  async function refresh() {
    if (busy || stopped) return;
    busy=true;
    const controller=new AbortController(), timeout=setTimeout(()=>controller.abort(),12000);
    try {
      const response=await fetch(URL,{signal:controller.signal,cache:'no-store'});
      if (!response.ok) throw new Error('Serviciul meteo nu răspunde');
      const next=parseWeather(await response.json());
      if(stopped) return;
      latest=next; lastSuccess=Date.now(); onUpdate(latest); onStatus({state:'live',weather:latest});
    } catch(error) {
      if(stopped) return;
      if(latest && Date.now()-lastSuccess<MAX_AGE) onStatus({state:'cached',weather:latest});
      else {latest=null; onUpdate(null); onStatus({state:'unavailable'});}
    } finally {clearTimeout(timeout); busy=false;}
  }
  const onVisible=()=>{if(!document.hidden && Date.now()-lastSuccess>=INTERVAL) refresh();};
  return {start(){refresh();timer=setInterval(refresh,INTERVAL);document.addEventListener('visibilitychange',onVisible);},refresh,dispose(){stopped=true;clearInterval(timer);document.removeEventListener('visibilitychange',onVisible);}};
}
