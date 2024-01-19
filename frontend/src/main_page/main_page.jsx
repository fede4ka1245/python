import './main_page.css';
import React, { useState, useEffect } from 'react';
import {  useNavigate } from 'react-router-dom';
import axios from 'axios';
import api from '../api';
import Button from '@mui/material/Button';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import IconButton from '@mui/material/IconButton';
import MenuOutlinedIcon from '@mui/icons-material/MenuOutlined';
import Typography from '@mui/material/Typography';
import AddIcon from '@mui/icons-material/Add';

import AddPrinterDrawerComponent from '../components/add_printer_drawer_component';
import OptionsPrinterDrawerComponent from '../components/options_printer_drawer_component';
import { usePrinters } from '../context/printer_context';
import { useUser } from '../context/user_context';
const PrintListItem = ({printer, navigateToPrinter,handleDeletedPrinter }) => {
    return (
        <ListItem disablePadding style={{backgroundColor:'#332D41', borderRadius:'15px', marginBottom:'10px'}}>
            <ListItemButton>
                
                <ListItemText onClick={() => {navigateToPrinter(printer)}} primary={`${printer.name},  UID:${printer.uid}`} primaryTypographyProps={{
                    sx: {
                        color: 'var(--text-color)',
                        fontWeight: 'bold',
                        paddingBottom: '10px',
                        fontSize: '20px',
                        '@media screen and (max-width: 768px)': {
                            fontSize: '16px',
                        }
                    }
                }} secondaryTypographyProps={{
                    sx: {
                        color: 'var(--text-color)',
                        '@media screen and (max-width: 768px)': {
                            fontSize: '12px',
                        }
                    }
                }} secondary={printer.description} />
                <IconButton onClick={() => {handleDeletedPrinter(printer.uid)}} >
                    <MenuOutlinedIcon sx={{ color: 'var(--text-color)', fontSize: '30px' }} />
                </IconButton>
            </ListItemButton>
        </ListItem>
    )
}



export default function MainPage() {
    const {printers,setPrinters} = usePrinters();
    const {user} = useUser();
    const [uid, setUid] = useState('');

    useEffect(() =>{
        axios({
            method:'get',
            url:`${api}get_printers_for_user/${user.id}`,

        }).then(response =>{
            setPrinters(response.data.printers)
            user.printers = response.data.printers
            const localUser = JSON.parse(localStorage.getItem('user'))
            localUser.printers = response.data.printers
            localStorage.setItem('user',JSON.stringify(localUser))
        }).catch(error => console.log("Ошибка получения принтеров usera" + error))
    }, [])

    const [isAddPrinterDrawerOpen, setIsAddPrinterDrawerOpen] = useState(false);
    const [isOptionsPrinterDrawerOpen, setIsOptionsPrinterDrawerOpen] = useState(false);


    const [deletePrinterUid,setDeletePrinterUid] = useState(null)

    const handleDeletedPrinter = (printerUid) =>{
        setDeletePrinterUid(printerUid)
        setIsOptionsPrinterDrawerOpen(true)
    }

    const addPrinterToggleDrawer = (open) => (event) => {
        if (event.type === 'keydown' && (event.key === 'Tab' || event.key === 'Shift')) {
            return;
        }
        if (open) {
            setUid('');
        }
        setIsAddPrinterDrawerOpen(open);
    };

    let navigate = useNavigate();
    const navigateToPrinter = (printer) =>{
        navigate(`/printer/${printer.uid}`,)
    }

    const optionsPrinterToggleDrawer = (open) => (event) => {
        if (event.type === 'keydown' && (event.key === 'Tab' || event.key === 'Shift')) {
            return;
        }
        setIsOptionsPrinterDrawerOpen(open);
    }
    
    const deletePrinter = ({deletePrinterUid,printers, setPrinters}) => {
        localStorage.removeItem(deletePrinterUid)
        axios({
            method:'get',
            url: `${api}unsubscribe_from_printer?printer_uid=${deletePrinterUid}&user_id=${user.id}`
        }).then(() => setPrinters(printers.filter(printer => printer.uid !== deletePrinterUid)))
        .catch(error => console.error('Ошибка при удалении принтера' + error))

        setIsOptionsPrinterDrawerOpen(false)
    }

    const handleUserDataChange = (newPrinter) => {
        setIsAddPrinterDrawerOpen(false);
        addPrinterToggleDrawer(false);
        setPrinters([...printers, { id: newPrinter.id, description: newPrinter.description, uid: newPrinter.uid, name:newPrinter.name }]);
    }

    return (
        
        <div className="main_page">
            <div className="add_print" style={{
                width:'100%',
                display:'flex',
                justifyContent:'center',
                alignItems:'center'
            }}>
                <Button onClick={addPrinterToggleDrawer(true)} className='add_print_btn' style={
                    {
                        display:'flex',
                        justifyContent:'space-between',
                        alignItems:'center',
                        width:'150px',
                        height:'60px',
                        color: 'var(--text-color)',
                        borderColor: 'var(--text-color)',
                        borderRadius:'30px'
                    }   
                } variant="outlined"><AddIcon fontSize="large"/> Добавить принтер</Button>

            </div>
            {printers.length ? <div className="print_list_wrapper" style={{padding:'0px 5px'}}>
                <List>
                    {printers.map((printer) => (
                        <PrintListItem 
                        handleDeletedPrinter={handleDeletedPrinter} 
                        navigateToPrinter={navigateToPrinter} 
                        setIsOptionsPrinterDrawerOpen={setIsOptionsPrinterDrawerOpen} 
                        printer={printer}  
                        key={printer.id}  />
                    ))}
                </List>
            </div> : <div style={{width:'100%',height:'90vh'}}> <Typography variant="h6" sx={{color:'var(--text-color)', display:'flex', alignItems:'center', justifyContent:'center', width:'100%',height:'100%'}} gutterBottom>
                        Похоже тут ничего нет
                    </Typography></div>}
            
            <div className="drawers">
                <AddPrinterDrawerComponent
                    uid={uid}
                    setUid={setUid}
                    setIsAddPrinterDrawerOpen={setIsAddPrinterDrawerOpen}
                    addPrinterToggleDrawer={addPrinterToggleDrawer}
                    handleUserDataChange={handleUserDataChange}
                    printers={printers}
                    isDrawerOpen={isAddPrinterDrawerOpen}
                    toggleDrawer={addPrinterToggleDrawer} />
                <OptionsPrinterDrawerComponent 
                    deletePrinterUid={deletePrinterUid}
                    printers={printers} 
                    setPrinters={setPrinters} 
                    toggleDrawer={optionsPrinterToggleDrawer} 
                    deletePrinter={deletePrinter} 
                    isDrawerOpen={isOptionsPrinterDrawerOpen} />
            </div>
        </div>
        
    )
}