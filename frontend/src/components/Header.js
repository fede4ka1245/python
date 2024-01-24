import React, {useEffect} from 'react';
import {Grid} from "@mui/material";
import Fab from "@mui/material/Fab";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import Typography from "@mui/material/Typography";
import {createPortal} from "react-dom";

const Header = ({ children }) => {
  return (
    <>
      <Grid
        left={0}
        top={0}
        sx={{ background: 'var(--bg-color)', position: 'sticky'}}
        zIndex={100}
        display={'flex'}
        justifyContent={'center'}
        alignItems={'center'}
        borderRadius={'0 0 var(--border-radius-lg) var(--border-radius-lg)'}
        overflow={'hidden'}
        pl={'10px'}
        pr={'10px'}
      >
        <Grid
          ml={'auto'}
          mr={'auto'}
          display='flex'
          alignItems='center'
          width={'calc(var(--content-width) - 2 * var(--space-md))'}
          sx={{ background: 'var(--bg-color)' }}
          p={2}
        >
          {children}
        </Grid>
      </Grid>
    </>
  );
};



export default Header;