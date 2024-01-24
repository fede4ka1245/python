import React, {useEffect} from 'react';
import {Grid} from "@mui/material";
import Fab from "@mui/material/Fab";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import Typography from "@mui/material/Typography";

const Header = ({ children }) => {
  return (
    <Grid
      position='fixed'
      left={0}
      top={0}
      width={'100vw'}
      sx={{ background: 'var(--bg-color)' }}
      zIndex={100}
      height={'80px'}
      display={'flex'}
      justifyContent={'center'}
      alignItems={'center'}
      borderRadius={'0 0 var(--border-radius-lg) var(--border-radius-lg)'}
      overflow={'hidden'}
    >
      <Grid
        ml={'auto'}
        mr={'auto'}
        display='flex'
        alignItems='center'
        width={'calc(var(--content-width) - 2 * var(--space-md))'}
        sx={{ background: 'var(--bg-color)' }}
        p={2}
        mt={1}
      >
        {children}
      </Grid>
    </Grid>
  );
};

export default Header;