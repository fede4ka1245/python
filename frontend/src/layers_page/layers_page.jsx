import './layers_page.css';
import React, {useEffect, useState} from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import LayerInfoDrawerComponent from '../components/layer_info_drawer_component';
 
import Button from '@mui/material/Button';
import Fab from '@mui/material/Fab';
import useMediaQuery from '@mui/material/useMediaQuery';
import Typography from '@mui/material/Typography';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import axios from 'axios';
import api from '../api';

//нужно чтобы бот находил по id юзера и мог написать ему
const LayerListItem = ({layer,uid, projectId, navigate }) => {
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);

    const toggleDrawer = (open) => (event) => {
        if (event.type === 'keydown' && (event.key === 'Tab' || event.key === 'Shift')) {
            return;
        }
        if (!open){
            navigate(``, { replace: true });
        }
        setIsDrawerOpen(open);
        
    }


    const createParams = (uid, projectId, layerId) =>{ // uid, projectId, layerId
        const params = new URLSearchParams({
            printerUid: uid,
            projectId: projectId,
            layerId: layerId
          }).toString();
        return params
    }
    const updateUrlWithParams =(uid, projectId, layerId, navigate) =>{
        const params = createParams(uid,projectId,layerId)
        navigate(`?${params}`, { replace: true });

    }


    const listItemOnClick =(uid, projectId, layerId, navigate) =>{
        setIsDrawerOpen(true)
        updateUrlWithParams(uid, projectId, layerId, navigate)
    }
    return (
        <>
        <ListItem disablePadding style={{backgroundColor:'#332D41', borderRadius:'15px', marginBottom:'10px'}} onClick={() =>{listItemOnClick(uid, projectId, layer.id, navigate)}}>
            <ListItemButton >
                        <ListItemText primary={`Слой ${layer.order +1}`} secondary={layer.timestamp}   primaryTypographyProps={{
                            sx: {
                                color: 'var(--text-color)',
                                fontWeight: 'bold',
                                paddingBottom: '10px',
                                fontSize: '20px',
                                
                            }
                        }} secondaryTypographyProps={{
                            sx: {
                                color: 'var(--text-color)',
                                '@media screen and (max-width: 768px)': {
                                    fontSize: '12px',
                                }
                            } 
                          }}  >
                        </ListItemText>
                        
                       
                    </ListItemButton>
                
        </ListItem>
        
        <LayerInfoDrawerComponent layer={layer} isDrawerOpen={isDrawerOpen} toggleDrawer={toggleDrawer} />
        </>
    )
}



const LayersPage =() =>{ 
    
    const [project, setProject] = useState({})
    const [layers,setLayers] = useState([])
    const [buttonVisible, setButtonVisible] = useState(false)
    const [page,setPage] = useState(1);
    const [layersCount, setLayersCount] = useState(0);
    const location = useLocation();
    const { pathname } = location;
    const parseUid =() =>{

        const regex = /\/printer\/([^\/]+)\//;
        const match = pathname.match(regex);

        if (match && match[1]) {
            const uid = match[1];
            return uid;
        } else {
            console.log('Не удалось извлечь testPrinterUid');
        }

    }
    const uid = parseUid()
    const projectId = pathname.split('/').pop()

    const parseProjectData =() =>{

        axios({
            method:'get',
            url:`${api}/projects/${projectId}/`
        }).then(response =>{
            setProject(response.data)
        }).catch(error => console.error('Ошибка при получении данных проекта: ' + error))

    }
    
    const parseLayers = () => {
        
        axios({
            method:'get',
            url:`${api}/get_all_layers_for_project/${projectId}?page=1&limit=10`
        }).then(response =>{
            setLayersCount(response.data.size)
            setLayers(response.data.results)
            if (response.data.total_pages > 1){
                setButtonVisible(true)
            }
        }).catch(error => console.error('Ошибка при загрузке слоев: ' + error))

    }

    useEffect(() =>{
        parseProjectData()
    },[])
    useEffect(() =>{ 
        if (Object.keys(project)?.length !== 0) {
            parseLayers();
        }
       
    },[project])
    

    const navigate = useNavigate();

    const navigateBack = () => {
        navigate(`/printer/${uid}`,)
    }

    const layersUpdateHandle =() =>{
        axios({
            method:'get',
            url:`${api}/get_all_layers_for_project/${projectId}?page=${page+1}&limit=10`
        }).then(response => {
            setLayers([...layers, ...response.data.results])
            setPage(page +1)
            if (response.data.current_page === response.data.total_pages){
                setButtonVisible(false)
            }
        })
    }
    const matches = useMediaQuery('(max-width:768px)');
    return(
        <div className="layers_page">
            <div className="layer_top">
                <Fab onClick={() => { navigateBack() }} size={matches ? 'small' : 'large'}
                    sx={{ bgcolor: 'var(--text-color)' }}>
                    <ArrowBackIcon sx={{ color: 'var(--bg-color)', }} />
                </Fab>
                <div className="layer_about">
                <Typography variant="h6" className='printer_about_text' gutterBottom>
                        <p className="about_text"> {layersCount} слоев из {project.layers_len}</p>   
                    </Typography>
                    <Typography variant="h6" className='printer_about_text' gutterBottom>
                        <p className="about_text">{project.name}</p>    
                    </Typography>
                </div>
                    
                
            </div> 
            {layers?.length ? <div className="layer_list_wrapper" style={{padding:'0px 5px'}}>
                        <List>
                            {layers.map((layer) => 
                                <LayerListItem navigate={navigate} projectId={projectId} uid={uid} layer={layer} key={layer.id} />)}
                        </List>
                    </div> : <div style={{width:'100%',height:'90vh'}}> <Typography variant="h6" sx={{color:'var(--text-color)', display:'flex', alignItems:'center', justifyContent:'center', width:'100%',height:'100%'}} gutterBottom>
                        Похоже тут ничего нет
                    </Typography></div>}
            {buttonVisible ? 
            <>
            <Button variant="contained" style={{ backgroundColor: 'var(--text-color)', color: 'var(--bg-color)',}}  onClick={() => {layersUpdateHandle()}}>
                Загрузить ещё
            </Button>
            
            <div style={{height:'40px', width:'100%'}}></div>
            </> : <></>}
            
            
        </div>
    );
}

export default LayersPage;