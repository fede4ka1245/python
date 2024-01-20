import React from 'react';
import { BrowserRouter as Router, Routes , Route } from 'react-router-dom';

import ReactDOM from 'react-dom/client';
import './index.css';
import reportWebVitals from './reportWebVitals';
import { PrinterProvider } from './context/printer_context';
import { UserProvider } from './context/user_context';
import MainPage from './main_page/main_page';
import PrinterPage from './printer_page/printer_page'
import LayersPage from './layers_page/layers_page';
import {Grid} from "@mui/material";
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <UserProvider>
    <PrinterProvider>
      <Grid maxWidth='var(--content-width)' width="100vw" ml='auto' mr='auto'>
        <Grid pl={'var(--space-md)'} pr='var(--space-md)'>
          <Router>
            <Routes>
              <Route path="/" element={<MainPage />} />
              <Route path="/printer/:uid" element={<PrinterPage />} />
              <Route path='/printer/:uid/:project_id' element={<LayersPage />} />
            </Routes>
          </Router>
        </Grid>
      </Grid>
    </PrinterProvider>
  </UserProvider>
);


reportWebVitals();
