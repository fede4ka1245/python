import { createContext, useContext, useEffect, useState } from 'react';

const PrinterContext = createContext();

export const PrinterProvider = ({ children }) => {
    const [printers, setPrinters] = useState([]);

    return (
        <PrinterContext.Provider value={{ printers, setPrinters,  }}>
            {children}
        </PrinterContext.Provider>
    );
};

export const usePrinters = () => {
    const context = useContext(PrinterContext);
    
    if (context === undefined) {
        throw new Error('usePrinters must be used within a PrinterProvider');
    }

    return context;
};

