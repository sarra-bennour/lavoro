import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import'/public/assets/css/styles.css'
import 'remixicon/fonts/remixicon.css';
import Waves from "node-waves";
import "node-waves/dist/waves.css";
Waves.init();

ReactDOM.createRoot(document.getElementById('root')).render(
  <App /> 
);
