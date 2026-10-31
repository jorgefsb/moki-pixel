// Copia integraciones a dist/engines (Unity, Phaser)
import { cpSync, mkdirSync } from 'node:fs';
mkdirSync('dist/engines/unity', { recursive: true });
mkdirSync('dist/engines/phaser', { recursive: true });
cpSync('integrations/unity/MokiAtlasImporter.cs', 'dist/engines/unity/MokiAtlasImporter.cs');
cpSync('integrations/phaser/index.html', 'dist/engines/phaser/index.html');
console.log('Integraciones → dist/engines');
