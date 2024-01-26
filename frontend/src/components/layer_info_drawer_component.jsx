import React, {useCallback, useState} from "react"
import Typography from '@mui/material/Typography';
import '../layers_page/layer_page_drawer.css'
import { AppDrawer } from "./Drawer";
import {Alert, AlertTitle, Grid} from "@mui/material";
import {
  TransformWrapper,
  TransformComponent
} from "react-zoom-pan-pinch";
import {createPortal} from "react-dom";
import Tappable from "../ui/tappable/Tappable";
import CloseIcon from "@mui/icons-material/Close";

const warnMsgs = ['- Повреждение вайпера', '- Ошибка распределения порошка'];
const recommendationMsgs = {
  'fix': 'Надо исправить печать',
  'stop': 'Надо останавливать печать',
  'ignore': 'Можно проигнорировать дефект, он не влияет на печать проекта',
  'metal_absence_stop': 'Увеличьте подачу или загрузите металлическый порошок в контейнер',
  'reslice_stop': 'Остановите процесс и уберите из печати деталь с дефектом'
};

const ImageWrapper = (props) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggle = useCallback(() => {
    setIsOpen((value) => !value)
  }, [])

  return (
    <>
      <img
        onClick={toggle}
        {...props}
      />
      {
        createPortal(<>
          {isOpen && <div
            style={{
              position: "fixed",
              left: 0,
              top: 0,
              zIndex: 100000,
              width: '100vw',
              height: '100vh',
              background: 'rgba(47,47,47,0.9)'
            }}
          >
            <Grid
              display='flex'
              justifyContent='center'
              alignItems='center'
              position='fixed'
              right='20px'
              top='20px'
              zIndex={10000}
              onClick={toggle}
            >
              <Tappable
                style={{
                  border: 'var(--element-border)',
                  borderRadius: '50%',
                  width: '46px',
                  height: '46px',
                  background: 'var(--bg-color)'
                }}
              >
                <CloseIcon sx={{ color: 'var(--hint-color)' }} />
              </Tappable>
            </Grid>
            <TransformWrapper>
              <TransformComponent>
                <img
                  style={{
                    objectFit: 'contain',
                    width: '100vw',
                    height: '100vh',
                  }}
                  {...props}
                />
              </TransformComponent>
            </TransformWrapper>
          </div>}
        </>, window.document.body)
      }
    </>
  )
}


const LayerInfoDrawerComponent = ({ layer, isDrawerOpen, toggleDrawer }) => {
    return (
        <>
            <AppDrawer
                anchor="bottom"
                open={isDrawerOpen}
                close={toggleDrawer(false)}
            >
              <Grid
                position='sticky'
                left={0}
                top={0}
                width={'100%'}
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
                  <Typography
                    flex={1}
                    color={'var(--text-secondary-color)'}
                    fontSize={'var(--font-size-md)'}
                    fontWeight="bold"
                    lineHeight={1.1}
                    overflow='hidden'
                    pl={2}
                  >
                    Слой #{layer.order}
                  </Typography>
                </Grid>
              </Grid>
                <div className="drawer_container">
                  {!!layer.warns?.length && <Grid pt={1} pb={1}>
                    <Alert severity="warning">
                      <AlertTitle>Ошибки</AlertTitle>
                      <Grid>
                        {layer.warns.map(({ reason, rate }) => (
                          <>
                            {warnMsgs[reason]}. Критичность: {rate.toFixed(4)} <br/>
                          </>
                        ))}
                      </Grid>
                    </Alert>
                  </Grid>}
                  {!!layer.recommendation && <Grid>
                    <Alert severity="info">
                      <AlertTitle>Рекомендация</AlertTitle>
                      <Grid>
                        {recommendationMsgs[layer.recommendation]}
                      </Grid>
                    </Alert>
                  </Grid>}
                    <Typography variant="h6" className='img_text'>
                        SVG
                    </Typography>
                    <ImageWrapper
                      className={'img-preview'}
                      src={layer.svg_image}
                      alt=""
                    />
                    <Typography variant="h6" className='img_text'>
                        До плавления
                    </Typography>
                    <ImageWrapper
                      className={'img-preview'}
                      src={layer.before_melting_image} alt=""
                    />
                    <Typography variant="h6" className='img_text'>
                        После плавления
                    </Typography>
                    <ImageWrapper
                      className={'img-preview'}
                      src={layer.after_melting_image} alt=""
                    />
                </div>
            </AppDrawer>
        </>
    );

}
export default LayerInfoDrawerComponent