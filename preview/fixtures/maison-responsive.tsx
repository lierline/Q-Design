import React from 'react';
import {StatRow,StatBlock} from '@/components/shared/stat-block';
import {a} from './maison-comparison';
import ResponsiveCases from './responsive-cases';
export default function Fixture(){return <ResponsiveCases adapters={a} grid={children=><div className="grid qd-form-grid--four">{children}</div>} stats={()=><StatRow>{[1,2,3,4].map(i=><StatBlock key={i} label="누적 검토 실적" value="123,456,789" accent="cobalt" />)}</StatRow>} />;}
