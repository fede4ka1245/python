import { createContext, useContext, useEffect, useState } from 'react';
import axios from 'axios';
import api from '../api';
import AppLoader from "../ui/appLoader/AppLoader";
import {Grid} from "@mui/material";
const UserContext = createContext();


const getUser = (telegramUserId) => {
    return axios({
        method:'get',
        url:`${api}/get_user/telegram_id/${telegramUserId}`
    }).then(res =>{
        console.log(res)
        console.log('ok')
        return res.data
    }).catch(() => {
         return null;
    })
}

export const UserProvider =({children}) =>{
    const [user,setUser] = useState()

    useEffect(() => {
        // <script src="https://telegram.org/js/telegram-web-app.js"></script>
        const script = document.createElement("script");
        script.src = 'https://telegram.org/js/telegram-web-app.js'
        script.onload = async () => {
            const user = await getUser(window.Telegram.WebApp.initDataUnsafe.user.id);
            setUser(user);
        }
        document.head.append(script)
    }, [])

    // useEffect(() => {
    //     console.log(user)
    //     if (!user){
    //         const telegramChatId = 0;
        
    //         axios({
    //             method: 'post',
    //             url: `${api}users/`,
    //             data:{
    //                 telegram_chat_id:telegramChatId,
    //                 printers:[]
    //             }
    //         }).then(function (response) {
    //             console.log(response)
    //             setUser(response.data);
    //             localStorage.setItem('user', JSON.stringify(response.data));

    //         }).catch(function (error) {
    //             console.error("Ошибка сети при создании пользователя: ", error);
    //         });
            
    //     }
    //     // console.log(window.Telegram.WebApp)
    // }, [user]);


    if (!user) {
      return <Grid p={2}>
        <AppLoader loading={true} />
      </Grid>
    }


    return (
        
        <UserContext.Provider value={{ user, setUser,  }}>
          {children}
        </UserContext.Provider>
    );
}
export const useUser = () => {
    const context = useContext(UserContext);
    
    if (context === undefined) {
        throw new Error('useUser must be used within a PrinterProvider');
    }

    return context;
};

