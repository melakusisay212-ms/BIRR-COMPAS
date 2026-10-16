// Lets `node --experimental-strip-types` resolve the extensionless imports used by Metro/TypeScript.
import { register } from 'node:module';
register('./ts-resolve.mjs', import.meta.url);
