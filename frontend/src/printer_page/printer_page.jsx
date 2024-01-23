import React, {useCallback, useEffect,  useState} from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
 
import Typography from '@mui/material/Typography';
import Fab from '@mui/material/Fab';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

import './printer_page.css';
import axios from 'axios';
import api from '../api';
import {Grid} from "@mui/material";
import Header from "../components/Header";
import AppButton from "../ui/button/Button";
import { useUser } from '../context/user_context';

const ProjectListItem = ({navigateToProject, project }) => {
    return (
        <ListItem disablePadding  style={{backgroundColor:'var(--bg-color)', borderRadius:'15px', marginBottom:'10px'}}>
            <ListItemButton >
                <div className='content' onClick={() => {navigateToProject({project}) }}>
                  <Grid>
                    <ListItemText primary={'Проект: ' + project?.name}   primaryTypographyProps={{
                      sx: {
                        color: 'var(--text-secondary-color)',
                        fontWeight: 'bold',
                        fontSize: 'var(--font-size-sm)'
                      }
                    }}>
                    </ListItemText>
                    <ListItemText primaryTypographyProps={{sx: {
                        color: 'var(--hint-color)',
                        fontWeight: 'bold',
                        paddingBottom: '10px',
                        fontSize: '16px',
                        display: 'flex',
                      }}}  primary={`${project.layers_len} слоёв`}>
                    </ListItemText>
                  </Grid>
                  </div>
                    </ListItemButton>
                
        </ListItem>
    )
}

const PrinterPage = () => {
    const location = useLocation();
    const { pathname } = location;
    const parseUid =useCallback(() =>{
        const uid = pathname.split('/').pop();
        return uid
    }, [pathname])
    const uid = parseUid()
    const {user} = useUser()
    const [printer, setPrinter] = useState(null)
    useEffect(() =>{
      axios({
        method:'get',
        url:`${api}get_printers_for_user/${user.id}`
      }).then(res=>{
        const printers = res.data.printers
        for (let i =0; i< printers.length; i++){
          if (uid === printers[i].uid){
             setPrinter(printers[i])
             
          }
        }
      }).catch(err =>{
        console.error(err)
      })
    }, [uid, user])
   const navigate = useNavigate();
    const navigateToProject =useCallback(({project}) =>{
        navigate(`/printer/${uid}/${project.id}`,)
    }, [uid, navigate]);

    const [projects, setProjects] = useState([]);
    const [page,setPage] = useState(1);
    const [buttonVisible, setButtonVisible] = useState(false)
    const parseProjects = useCallback(() => {
        
        axios({
            method:'get',
            url:`${api}/get_all_projects_for_printer/${uid}?page=1&limit=10`
        }).then(response => {
            setProjects(response.data.results)
            if (response.data.total_pages > 1){
                setButtonVisible(true)
            }
        })
        .catch(error => console.error('Ошибка при получении проектов принтера с uid:' + uid + ':' + error))

        

        
    }, [uid])
    useEffect(() => {
         parseProjects()
        
    },[uid])
    
    const projectsUpdateHandle =useCallback(() =>{
        axios({
            method:'get',
            url:`${api}/get_all_projects_for_printer/${uid}?page=${page+1}&limit=10`
        }).then(response =>{
            setProjects([...projects, ...response.data.results])
            setPage(page +1)
            if (response.data.current_page === response.data.total_pages){
                setButtonVisible(false)
            }
        }).catch(error => console.error('Ошибка при загрузке дополнительеый проектов: ' + error))
    }, [page, uid, projects])
   

    
    const navigateBack = useCallback(() => {
        navigate(`/`,)
    }, [navigate])
    return (
        <div className='printer_page'>
          <Header>
            <Fab onClick={navigateBack} size={'medium'} sx={{ background: 'var(--primary-color)', minWidth: '48px' }}>
              <ArrowBackIcon sx={{ color: 'var(--bg-color)', }} />
            </Fab>
            <Typography
              flex={1}
              color={'var(--text-secondary-color)'}
              fontSize={'var(--font-size-md)'}
              fontWeight="bold"
              lineHeight={1.1}
              overflow='hidden'
              pl={2}
            >
              {printer?.name}
            </Typography>
          </Header>
            {projects?.length ?<div className="task_list">
                <List>
                    {projects.map((project) => (
                        <ProjectListItem navigateToProject={navigateToProject} project={project} key={project.id} />
                    ))}
                </List>
            </div> : <></>}
            {buttonVisible  ? 
            <>
              <AppButton fullWidth onClick={projectsUpdateHandle} variant="filled">
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
    )
}
export default PrinterPage