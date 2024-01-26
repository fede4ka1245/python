import React from 'react';
import {Grid} from "@mui/material";

const PageContainer = ({ children }) => {
  return (
    <Grid width={'100vw'} mt={'100px'} position={'relative'}>
      <Grid maxWidth='var(--content-width)' width="100vw" ml='auto' mr='auto'>
        <Grid>
          {children}
        </Grid>
      </Grid>
    </Grid>
  );
};



export default PageContainer;