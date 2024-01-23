import Button from '@mui/material/Button';
import React from 'react';
import Drawer from '@mui/material/Drawer';
import { AppDrawer } from './Drawer';

const OptionsPrinterDrawerComponent = ({deletePrinterUid, printers, setPrinters, toggleDrawer, deletePrinter, isDrawerOpen, }) => {
    return (
        <AppDrawer
            anchor="bottom"
            open={isDrawerOpen}
            close={toggleDrawer(false)}
        >
            <div style={{ display: 'flex', padding: '10px', alignItems: 'center', flexDirection: 'column', height: '150px', backgroundColor: 'var(--bg-color)', color: 'var(--text-color)' }}>
                <Button fullWidth style={{ borderRadius: 'var(border-radius-sm)' }} color='error' variant="outlined" onClick={() =>{deletePrinter({deletePrinterUid,printers, setPrinters})}}>Удалить</Button>
            </div>
        </AppDrawer>
    )
}
export default OptionsPrinterDrawerComponent