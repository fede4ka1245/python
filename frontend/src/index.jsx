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
import PageContainer from "./components/PageContainer";
import {UserFeedback} from "./userFeedback";

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <UserProvider>
    <PrinterProvider>
      <PageContainer>
        <Router>
          <Routes>
            <Route path="/" element={<MainPage />} />
            <Route path="/printer/:uid" element={<PrinterPage />} />
            <Route path='/printer/:uid/:project_id' element={<LayersPage />} />
          </Routes>
        </Router>
      </PageContainer>
      <UserFeedback />
    </PrinterProvider>
  </UserProvider>
);


reportWebVitals();
