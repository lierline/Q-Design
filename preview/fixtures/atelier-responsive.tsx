import React from 'react';
import {Grid,StatGrid,Stat,Drawer,Btn} from '@/lib/design/components';
import {a} from './atelier-comparison';
import ResponsiveCases from './responsive-cases';
export default function Fixture(){return <ResponsiveCases adapters={a} grid={children=><Grid cols={4}>{children}</Grid>} stats={()=><StatGrid>{[1,2,3,4].map(i=><Stat key={i} label="누적 검토 실적" value="123,456,789" />)}</StatGrid>} drawer={(open,close,child,side)=><Drawer open={open} onClose={close} title="검토 패널" side={side} footer={<Btn onClick={close}>패널 닫기</Btn>}>{child}</Drawer>} />;}
