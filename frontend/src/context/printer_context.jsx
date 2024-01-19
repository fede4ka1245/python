import { createContext, useContext, useEffect, useState } from 'react';

const PrinterContext = createContext();

export const PrinterProvider = ({ children }) => {
   
    const [printers, setPrinters] = useState(() => {
        // Пытаемся получить принтеры из локального хранилища
        const localData = localStorage.getItem('printers');
        // Если данные есть, то парсим и возвращаем, иначе возвращаем начальный массив
        if (!localData){
            return [];
        }
        return  JSON.parse(localData) 
    });

    // Сохраняем принтеры в локальное хранилище каждый раз, когда они обновляются
    useEffect(() => {
        localStorage.setItem('printers', JSON.stringify(printers));
    }, [printers]);
    
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

