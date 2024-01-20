import React, {useState} from 'react';
import api from '../api';
import Drawer from '@mui/material/Drawer';
import Button from '@mui/material/Button';
import { useUser } from '../context/user_context';
import axios from 'axios';
import { usePrinters } from '../context/printer_context';
import Input from "../ui/input/Input";
import AppButton from "../ui/button/Button";
import Typography from "@mui/material/Typography";
import {Grid} from "@mui/material";
import AppLoader from "../ui/appLoader/AppLoader";

const AddPrinterDrawerComponent = ({setIsAddPrinterDrawerOpen,addPrinterToggleDrawer, uid, setUid, handleUserDataChange, isDrawerOpen, toggleDrawer }) => {
  const { user } = useUser();
  const {printers} = usePrinters();
  const [loading, setIsLoading] = useState(false);

  const handleSubmit = () => {

    if (!uid) {
      return;
    }

    setIsLoading(true);
    axios({
      method: 'get',
      url: `${api}/subscribe_for_printer?printer_uid=${uid}&user_id=${user.id}`
    }).then(function () {
      axios({
        method: 'get',
        url: `${api}/get_printers_for_user/${user.id}`,

      }).then(function (response) {
        const printersData = response.data.printers;
        let newPrinter = null;
        for (let printer of printersData){
          if (printer.uid ===  uid){
            newPrinter = printer
          } 
        }
        
        
        if (!!newPrinter){
          let flag = true
          for (let printer of printers){
            if (printer.id === newPrinter.id){
              flag = false
            }
          }
          if (flag){
            handleUserDataChange(newPrinter);
          }
          flag = true
        }
        setIsAddPrinterDrawerOpen(false);
        addPrinterToggleDrawer(false);
      }).catch(error => console.error("Ошибка получения принтеров usera внутри запроса на подписку:" + error))
        .finally(() => {
          setIsLoading(false);
        })
    }).catch(function (error) {
      console.error('Ошибка при подписке на принтер:' + error)
    })

    
  }


  const drawerContent = () => (

    <Grid p={2}>
      <div className="inputs">
        <Input
          fullWidth
          id="uid-input"
          label="Введите UID"
          variant="outlined"
          margin="normal"
          value={uid}
          onChange={(event) => {setUid(event.target.value)}}
        />
      </div>
      <AppLoader loading={loading} />
      <div style={{ display: 'flex', justifyContent: 'center', margin: '15px 0px' }}>
        <AppButton fullWidth onClick={handleSubmit} variant="filled">
          <Typography
            color={'var(--text-secondary-color)'}
            fontSize={'var(text-size-sm)'}
            fontWeight="bold"
            lineHeight={1.8}
            loading={true}
          >
            Добавить принтер
          </Typography>
        </AppButton>
      </div>
    </Grid>
  );

  return (
    <div>
      <Drawer sx={{
        '& .MuiDrawer-paper': {
          maxWidth: '50%',
          height: 'calc(100vh - 80px)',
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
    </div>
  );
};

export default AddPrinterDrawerComponent;