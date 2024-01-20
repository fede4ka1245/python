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
import {Grid, ListItemAvatar} from "@mui/material";
import AppButton from "../ui/button/Button";
import Header from "../components/Header";

//нужно чтобы бот находил по id юзера и мог написать ему
const LayerListItem = ({layer, uid, projectId, navigate }) => {
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
        <ListItem disablePadding style={{backgroundColor:'var(--bg-color)', borderRadius:'15px', marginBottom:'10px'}} onClick={() =>{listItemOnClick(uid, projectId, layer.id, navigate)}}>
            <ListItemButton >
              <ListItemAvatar>
                <img
                  loading={'lazy'}
                  width={'60px'}
                  height={'60px'}
                  style={{ borderRadius: 'var(--border-radius-sm)'}}
                  src={layer.svg_image}
                />
              </ListItemAvatar>
              <Grid flexDirection={'column'} pl={2} display={'flex'} height={'100%'}>
                <Typography fontWeight={'bold'} color='var(--text-secondary-color)' fontSize={'var(--font-size-md)'}>
                  Слой #{layer.order}
                </Typography>
                {!!layer.warns?.length && <Typography fontWeight={'bold'} color='orange' fontSize={'12px'}>
                  Ошибка печати
                </Typography>}
              </Grid>
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
      <>
        <Header>
          <Fab onClick={navigateBack} size={'medium'} sx={{ background: 'var(--primary-color)', minWidth: '48px' }}>
            <ArrowBackIcon sx={{ color: 'var(--bg-color)', }} />
          </Fab>
          <Grid direction={'column'}>
            <Typography
              flex={1}
              color={'var(--text-secondary-color)'}
              fontSize={'var(--font-size-md)'}
              fontWeight="bold"
              lineHeight={1.1}
              overflow='hidden'
              pl={2}
            >
              {project.name}
            </Typography>
            <Typography
              flex={1}
              color={'var(--hint-color)'}
              fontSize={'var(--font-size-sm)'}
              fontWeight="bold"
              lineHeight={1.1}
              overflow='hidden'
              pl={2}
            >
              слои: {layers?.length} / {project?.layers_len}
            </Typography>
          </Grid>
        </Header>
        <div className="layers_page">
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
              <AppButton variant="contained" style={{ backgroundColor: 'var(--text-color)', color: 'var(--bg-color)',}}  onClick={() => {layersUpdateHandle()}}>
                Загрузить ещё
              </AppButton>

              <div style={{height:'40px', width:'100%'}}></div>
            </> : <></>}

        </div>
      </>
    );
}

export default LayersPage;