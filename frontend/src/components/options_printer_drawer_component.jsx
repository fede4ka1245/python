import Button from '@mui/material/Button';
import React from 'react';
import Drawer from '@mui/material/Drawer';

const OptionsPrinterDrawerComponent = ({deletePrinterUid, printers, setPrinters, toggleDrawer, deletePrinter, isDrawerOpen, }) => {



    const drawerContent = () => (
        <div style={{ display: 'flex', alignItems: 'center', flexDirection: 'column', height: '150px', backgroundColor: 'var(--bg-color)', color: 'var(--text-color)' }}>
            <Button style={{ margin: '20px 0 ', }} color='error' variant="outlined" onClick={() =>{deletePrinter({deletePrinterUid,printers, setPrinters})}}>Удалить</Button>
            <Button style={{ borderColor: 'var(--text-color)', color: 'var(--text-color)' }} variant="outlined" onClick={toggleDrawer(false)}>Закрыть</Button>
        </div>
    )

    return (
        <Drawer sx={{
            '& .MuiDrawer-paper': {
                maxWidth: '50%',
                margin: '0 auto',
                bgcolor: 'var(--bg-color)',
                borderRadius: '25px 25px 0 0',
                '@media (max-width: 768px)': {
                    maxWidth: '100%',
                }
            },
        }}
            anchor="bottom"
            open={isDrawerOpen}
            onClose={toggleDrawer(false)}
        >
            {drawerContent()}
        </Drawer>
    )
}
export default OptionsPrinterDrawerComponent