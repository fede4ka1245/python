import React from "react"
import Typography from '@mui/material/Typography';
import '../layers_page/layer_page_drawer.css'
import { AppDrawer } from "./Drawer";
const LayerInfoDrawerComponent = ({ layer, isDrawerOpen, toggleDrawer }) => {
    return (
        <>
            <AppDrawer
                anchor="bottom"
                open={isDrawerOpen}
                close={toggleDrawer(false)}
            >
                <div className="drawer_container">
                    <Typography variant="h6" className='img_text'>
                        SVG
                    </Typography>
                    <img
                        className={'img-preview'}
                        src={layer.svg_image}
                        alt=""
                    />
                    <Typography variant="h6" className='img_text'>
                        До плавлния
                    </Typography>
                    <img className={'img-preview'}
                        src={layer.before_melting_image} alt="" />
                    <Typography variant="h6" className='img_text'>
                        После плавления
                    </Typography>
                    <img className={'img-preview'}
                        src={layer.after_melting_image} alt="" />





                </div>
            </AppDrawer>
        </>
    );

}
export default LayerInfoDrawerComponent