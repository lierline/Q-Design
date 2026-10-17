import React from 'react';
import {Field,Stat} from '@/components/ui';
import {a} from './carnet-comparison';
import ResponsiveCases from './responsive-cases';
const adapters={...a,field:(id:string,label:string,child:React.ReactNode)=><Field label={label}><label htmlFor={id} className="sr-only">{label}</label>{child}</Field>};
export default function Fixture(){return <ResponsiveCases adapters={adapters} grid={children=><div className="grid qd-form-grid--four">{children}</div>} stats={()=><div className="qd-responsive-grid" style={{'--qd-grid-columns':4} as React.CSSProperties}>{[1,2,3,4].map(i=><Stat key={i} label="누적 검토 실적" value="123,456,789" />)}</div>} />;}
