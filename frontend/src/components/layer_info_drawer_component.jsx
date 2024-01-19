import React from "react"
import { Drawer } from "@mui/material"
import Typography from '@mui/material/Typography';
import '../layers_page/layer_page_drawer.css'

const LayerInfoDrawerComponent =({layer,isDrawerOpen,toggleDrawer}) =>{



    const drawerContent =(layer) =>{
       
         return(
            
            <div  className="drawer_container">
                
                
                    <hr />
                    <Typography variant="h6" className='img_text' gutterBottom>
                        svg_image:
                    </Typography>
                    <img src={layer.svg_image} alt="" />
                    <hr />
                    <Typography variant="h6" className='img_text' gutterBottom>
                        before_melting_image:
                    </Typography>
                    <img src={layer.before_melting_image} alt="" />
                    <hr />
                    <Typography variant="h6" className='img_text' gutterBottom>
                        after_melting_image:
                    </Typography>
                    <img src={layer.after_melting_image} alt="" />  
                
                
                 
                
                
            </div> 
        )
       

       
        
    }

    return (
        <>
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
            {drawerContent(layer)}
        </Drawer>
        </>
    );

}
export default LayerInfoDrawerComponent