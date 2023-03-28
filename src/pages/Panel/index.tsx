import React from 'react';
import { createRoot } from 'react-dom/client';

import Panel from './Panel';
import './index.css';

// const container = document.getElementById('app-container');
const container = document.createElement('div');
document.body.appendChild(container);
const root = createRoot(container!); // createRoot(container!) if you use TypeScript
root.render(<Panel />);
