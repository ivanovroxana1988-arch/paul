// The former basement is now at street grade. Keep the entire Bucharest scene
// on the same vertical datum as the lower-level photographic GLB.
import {PIT} from './levels.js';
export const CITY_GRADE_Y=-PIT.depth;
// All city layers share this origin to keep streets, roofs and trees aligned.
export const CITY_OFFSET_Z=-92;
export const CITY_SCALE_XZ=.07;
// Match horizontal and vertical scales to preserve building and window proportions.
export const CITY_SCALE_Y=CITY_SCALE_XZ;
