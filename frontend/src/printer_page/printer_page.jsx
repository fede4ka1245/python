import React, {useEffect,  useState} from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { usePrinters } from '../context/printer_context';
 
import useMediaQuery from '@mui/material/useMediaQuery';
import Typography from '@mui/material/Typography';
import Fab from '@mui/material/Fab';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import Button from '@mui/material/Button';

import './printer_page.css';
import axios from 'axios';
import api from '../api';
import {Grid} from "@mui/material";
import Header from "../components/Header";
import AppButton from "../ui/button/Button";

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
    const parseUid =() =>{
        const uid = pathname.split('/').pop();
        return uid
    }
    const uid = parseUid()

    const {printers} = usePrinters();
    const parsePrinter =(printers) =>{
        for (let i = 0;i<printers?.length;i++){
            if (printers[i].uid === uid){
                return printers[i]
            }
        }        
    }
    const printer = parsePrinter(printers)
    
    const name = printer?.name

    const navigateToProject =({project}) =>{
        navigate(`/printer/${uid}/${project.id}`,)
    }

    const [projects, setProjects] = useState([]);
    const [page,setPage] = useState(1);
    const [buttonVisible, setButtonVisible] = useState(false)
    const parseProjects = () => {
        
        axios({
            method:'get',
            url:`${api}/get_all_projects_for_printer/${uid}?page=1&limit=10`
        }).then(response => {
            setProjects(response.data.results)
            console.log(response)
            if (response.data.total_pages > 1){
                setButtonVisible(true)
            }
        })
        .catch(error => console.error('Ошибка при получении проектов принтера с uid:' + uid + ':' + error))

        

        
    }
    useEffect(() => {
         parseProjects()
        
    },[uid])
    
    const projectsUpdateHandle =() =>{
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
    }
   

    const media = useMediaQuery('(max-width:768px)'); // MUI хук медиа запрос
    let navigate = useNavigate();
    const navigateBack = () => {
        navigate(`/`,)
    }
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
              {name}
            </Typography>
          </Header>
            {projects?.length ?<div className="task_list">
                <List>
                    {projects.map((project) => (
                        <ProjectListItem navigateToProject={navigateToProject} project={project} key={project.id} />
                    ))}
                </List>
            </div> : <div style={{width:'100%',height:'90vh'}}> <Typography variant="h6" sx={{color:'var(--text-color)', display:'flex', alignItems:'center', justifyContent:'center', width:'100%',height:'100%'}} gutterBottom>
                        Похоже тут ничего нет
                    </Typography></div>}
            {buttonVisible  ? 
            <>
              <AppButton fullWidth onClick={projectsUpdateHandle} variant="filled">
                <Typography
                  color={'var(--text-secondary-color)'}
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