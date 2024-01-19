import { createContext, useContext, useEffect, useState } from 'react';
import axios from 'axios';
import api from '../api';
const UserContext = createContext();


const getUser = (telegramUserId) => {
    return axios({
        method:'get',
        url:`${api}/get_user/telegram_id/${telegramUserId}`
    }).then(res =>{
        console.log(res)
        console.log('ok')
        return res.data
    }).catch(error => {
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
            console.log('here', window.Telegram.WebApp.initDataUnsafe)
            const user = await getUser(window.Telegram.WebApp.initDataUnsafe.user.id)
            //const user = await getUser(0)
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


    return (
        
        <UserContext.Provider value={{ user, setUser,  }}>
            {user ? children : <></>}
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

