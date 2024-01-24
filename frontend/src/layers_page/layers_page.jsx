import './layers_page.css';
import React, {useEffect, useMemo, useState, useCallback} from 'react';
import {useLocation, useNavigate, useSearchParams} from 'react-router-dom';
import LayerInfoDrawerComponent from '../components/layer_info_drawer_component';
import { useInView } from 'react-intersection-observer';
import Fab from '@mui/material/Fab';
import Typography from '@mui/material/Typography';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ListItemButton from '@mui/material/ListItemButton';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import axios from 'axios';
import api from '../api';
import {Grid, ListItemAvatar} from "@mui/material";
import AppButton from "../ui/button/Button";
import Header from "../components/Header"
import CachedIcon from '@mui/icons-material/Cached';
import AppLoader from "../ui/appLoader/AppLoader";

const renderInView = () => {
  return ({ children }) => {
    const { ref, inView } = useInView({
      /* Optional options */
      threshold: 0.3,
    });
  
    return (
      <div ref={ref}>
        {inView && children}
      </div>
    )
  }
}

const ListWrapper = renderInView()

//нужно чтобы бот находил по id юзера и мог написать ему
const LayerListItem = ({layer, uid, projectId, navigate }) => {
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const toggleDrawer = (open) => (event) => {
        // if (event.type === 'keydown' && (event.key === 'Tab' || event.key === 'Shift')) {
        //     return;
        // }
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
          <ListItem id={`layer-${layer.order}`} disablePadding style={{backgroundColor:'var(--bg-color)', borderRadius:'15px', marginBottom:'10px'}} onClick={() =>{listItemOnClick(uid, projectId, layer.id, navigate)}}>
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

const MemoLayerList = React.memo(LayerListItem);

const loadLayers = (projectId, page, pageSize) => {
  return axios({
    method: 'get',
    url: `${api}/get_all_layers_for_project/${projectId}?page=${page}&limit=${pageSize}`
  }).then(({ data }) => {
    return data;
  })
}

const loadLayersToOrder = async (order, projectId, pageSize) => {
  let page = 1;
  const layers = await loadLayers(projectId, page, pageSize);
  const pages = Math.floor((layers.results[0].order - order) / pageSize);
  const additionalLayers = await Promise.all(Array.from({ length: pages }).map(async (_, index) => {
    const { results } = await loadLayers(projectId, page + index + 1, pageSize)

    return results;
  }))

  return {
    ...layers,
    results: [...layers.results, ...additionalLayers.flat()],
    current_page: layers.current_page + pages,
  }
}

const openLayer = async (order) => {
  let counter = 0;

  while (true) {
    counter ++;
    const el = document.getElementById(`layer-${order}`);

    if (el) {
      el.scrollIntoView();
      el.click();
      return;
    }

    await new Promise((res) => {
      setTimeout(res, 300);
    })

    if (!el && counter === 30) {
      return;
    }
  }
}

const pageSize = 30;


const LayersPage = () => {
    const [project, setProject] = useState({})
    const [layers,setLayers] = useState([])
    const [buttonVisible, setButtonVisible] = useState(false)
    const [page,setPage] = useState(1);
    const [layersCount, setLayersCount] = useState(0);
    const location = useLocation();
    const { pathname } = location;
    const parseUid = () =>{
        const regex = /\/printer\/([^\/]+)\//;
        const match = pathname.match(regex);

        if (match && match[1]) {
            const uid = match[1];
            return uid;
        } else {
            console.log('Не удалось извлечь testPrinterUid');
        }
    }
    const uid = useMemo(() => parseUid(), [pathname]);
    const projectId = useMemo(() => pathname.split('/').pop(), [pathname]);
    const [searchParams] = useSearchParams();
    const [loading, setLoading] = useState(false);

    useEffect(() => {
      if (!!searchParams.get("order")) {
        setLoading(true);
        loadLayersToOrder(searchParams.get("order"), projectId, pageSize)
          .then((response) => {
            setLayers(response.results);
            setPage(response.current_page);
            setLayersCount(response.size);
            if (response.total_pages > response.current_page) {
              setButtonVisible(true);
            }
          })
          .finally(async () => {
            setLoading(false);
            await openLayer(searchParams.get("order"))
          })
      }
    }, [searchParams]);

    const parseProjectData = useCallback(() => {
      axios({
        method: 'get',
        url: `${api}/projects/${projectId}/`
      }).then(response => {
        setProject(response.data)
      }).catch(error => console.error('Ошибка при получении данных проекта: ' + error));
    }, [projectId]);
    
    const parseLayers = useCallback(() => {
      axios({
        method: 'get',
        url: `${api}/get_all_layers_for_project/${projectId}?page=1&limit=${pageSize}`
      }).then(response => {
        setLayersCount(response.data.size);
        setLayers(response.data.results);
        if (response.data.total_pages > 1) {
          setButtonVisible(true);
        }
      }).catch(error => console.error('Ошибка при загрузке слоев: ' + error));
    }, [projectId]); 

    useEffect(() =>{
      parseProjectData();
    },[]);

    useEffect(() =>{ 
        if (Object.keys(project)?.length !== 0 && !searchParams.get('order')) {
            parseLayers();
        }
    },[project])
    

    const navigate = useNavigate();

    const navigateBack = () => {
        navigate(`/printer/${uid}`,)
    }

    const layersUpdateHandle =useCallback(() =>{
        axios({
            method:'get',
            url:`${api}/get_all_layers_for_project/${projectId}?page=${page+1}&limit=${pageSize}`
        }).then(response => {
            setLayers([...layers, ...response.data.results])
            setPage(page +1)
            if (response.data.current_page === response.data.total_pages){
                setButtonVisible(false)
            }
        })
    },[projectId,page,layers])

    return(
      <>
        <AppLoader loading={loading} />
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
              слои: {layersCount} / {project?.layers_len}
            </Typography>
          </Grid>
          <Grid ml='auto'>
            <Fab onClick={() => { window.location.reload() }} size={'medium'} sx={{ background: 'var(--primary-color)', minWidth: '48px',  }}>
              <CachedIcon sx={{color:'var(--bg-color)'}} />
            </Fab>
          </Grid>
        </Header>
        <div className="layers_page">
          <div className="layer_list_wrapper">
            <List>
              {!!layers.length && layers.map((layer) => (
                <Grid mb={'var(--space-sm)'} key={layer.id} height={'80px'}>
                  <ListWrapper>
                    <MemoLayerList navigate={navigate} projectId={projectId} uid={uid} layer={layer}  />
                  </ListWrapper>
                </Grid>
              ))}
            </List>
          </div>
          {buttonVisible ?
            <>
              <AppButton fullWidth variant="contained"   onClick={() => {layersUpdateHandle()}}>
                <Typography
                  color={'#d9d9d9'}
                  fontSize={'var(text-size-sm)'}
                  fontWeight="bold"
                  lineHeight={1.6}
                >
                  Загрузить ещё
                </Typography>
              </AppButton>

              <div style={{height:'40px', width:'100%'}}></div>
            </> : <></>}
        </div>
      </>
    );
}

export default LayersPage;