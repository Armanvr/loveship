// À charger via `node --import ./scripts/register-ts.js` (tests, scripts npm).
import { register } from 'node:module'

register('./ts-resolve-hooks.js', import.meta.url)
