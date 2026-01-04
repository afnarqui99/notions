// src/extensions/lowlightInstance.js
import { createLowlight } from 'lowlight';
import javascript from 'highlight.js/lib/languages/javascript';
import xml from 'highlight.js/lib/languages/xml';
import bash from 'highlight.js/lib/languages/bash';
import json from 'highlight.js/lib/languages/json';

const lowlight = createLowlight();

lowlight.register('javascript', javascript);
lowlight.register('xml', xml);
lowlight.register('bash', bash);
lowlight.register('json', json);

export default lowlight;







