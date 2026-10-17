import React from 'react';
import {StatRow,StatBlock} from '@/components/shared/stat-block';
import {Sheet,SheetContent,SheetTitle,SheetDescription} from '@/components/ui/sheet';
import {Button} from '@/components/ui/button';
import {a} from './maison-comparison';
import ResponsiveCases from './responsive-cases';
export default function Fixture(){return <ResponsiveCases adapters={a} grid={children=><div className="grid qd-form-grid--four">{children}</div>} stats={()=><StatRow>{[1,2,3,4].map(i=><StatBlock key={i} label="누적 검토 실적" value="123,456,789" accent="cobalt" />)}</StatRow>} drawer={(open,close,child,side)=><Sheet open={open} onOpenChange={next=>{if(!next)close();}}><SheetContent side={side}><SheetTitle>검토 패널</SheetTitle><SheetDescription>긴 내용을 검토합니다.</SheetDescription>{child}<Button onClick={close}>패널 닫기</Button></SheetContent></Sheet>} />;}
