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

const ProjectListItem = ({navigateToProject, project }) => {
    return (
        <ListItem disablePadding  style={{backgroundColor:'#332D41', borderRadius:'15px', marginBottom:'10px'}}>
            <ListItemButton >
                <div className='content' onClick={() => {navigateToProject({project}) }}>
                        <ListItemText primary={project.name}   primaryTypographyProps={{
                            sx: {
                                color: 'var(--text-color)',
                                fontWeight: 'bold',
                                paddingBottom: '10px',
                                fontSize: '20px',
                                
                            }
                        }}   >
                        </ListItemText>
                        
                        <ListItemText primaryTypographyProps={{sx: {
                                color: 'var(--text-color)',
                                fontWeight: 'bold',
                                paddingBottom: '10px',
                                fontSize: '20px',
                                display: 'flex',
                                justifyContent:'flex-end',                        
                            }}}  primary={`${project.layers_len} слоёв`}></ListItemText>
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
        for (let i = 0;i<printers.length;i++){
            if (printers[i].uid === uid){
                return printers[i]
            }
        }        
    }
    const printer = parsePrinter(printers)
    
    const name = printer.name 

    const navigateToProject =({project}) =>{
        navigate(`/printer/${uid}/${project.id}`,)
    }

    const [projects, setProjects] = useState([]);
    const [page,setPage] = useState(1);
    const [buttonVisible, setButtonVisible] = useState(false)
    const parseProjects = () => {
        
        axios({
            method:'get',
            url:`${api}get_all_projects_for_printer/${uid}?page=1&limit=10`
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
            url:`${api}get_all_projects_for_printer/${uid}?page=${page+1}&limit=10`
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
            <div className="printer_top">
                <Fab onClick={() => { navigateBack() }} size={media ? 'small' : 'large'}
                    sx={{ bgcolor: 'var(--text-color)' }}>
                    <ArrowBackIcon sx={{ color: 'var(--bg-color)', }} />
                </Fab>
                <div className="printer_about">
                    <Typography variant="h6" className='printer_about_text' gutterBottom>
                        {printer.description}
                    </Typography>
                    <Typography variant="h6" className='printer_about_text' gutterBottom>
                        {name}
                    </Typography>

                </div>
            </div>
            {projects.length ?<div className="task_list" style={{padding:'0px 5px'}}>
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
            <Button variant="contained" style={{ backgroundColor: 'var(--text-color)', color: 'var(--bg-color)' }} onClick={() => {projectsUpdateHandle()}}>
                Загрузить ещё
            </Button>
            <div style={{height:'40px', width:'100%'}}></div>
            </> : <></>}
            
        </div>
    )
}
export default PrinterPage