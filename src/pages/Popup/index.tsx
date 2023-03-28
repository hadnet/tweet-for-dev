import React from 'react';
import { createRoot } from 'react-dom/client';

import Popup from './Popup';
import './index.css';

const App: React.FC<{}> = () => {
  return (
    <div>
      <Popup />
    </div>
  );
};

// const container = document.getElementById('app');
const container = document.createElement('div');
document.body.appendChild(container);
const root = createRoot(container!); // createRoot(container!) if you use TypeScript
root.render(<App />);
