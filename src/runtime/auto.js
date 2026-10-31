// Versión «pega y listo»: <script src=".../moki-pet.js" data-juice="mucho"></script>
import { MokiPet } from './pet.js';
import './element.js';
import { MokiPlayer } from './player.js';
const s = document.currentScript;
const d = (s && s.dataset) || {};
window.MokiPixel = { MokiPet, MokiPlayer };
if (d.pet !== 'false') {
  const start = () => { window.MokiPixel.pet = new MokiPet({ juice: d.juice, size: d.size ? +d.size : 64, scale: d.scale ? +d.scale : 2, sound: d.sound !== 'false', greet: d.greet !== 'false', hello: d.hello }); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
}
