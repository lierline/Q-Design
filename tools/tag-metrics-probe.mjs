// The source must explicitly select the canonical tag metrics before using them.
export function centralTagMetrics(source,runtime){
 if(!/import\s*\{\s*QDPresentation\s*\}\s*from\s*['"]@\/lib\/design\/q-design-runtime['"]/.test(source)
  || !/export const TAG_BORDER = QDPresentation\.visual\.tag\.border;/.test(source)
  || !/export const TAG_DIMS = QDPresentation\.visual\.tag\.dims;/.test(source))throw Error('Tag metrics do not select the canonical presentation rules');
 const value=runtime.QDPresentation?.visual?.tag;
 if(!value||!Number.isFinite(value.border)||value.border<0)throw Error('Invalid canonical tag border');
 if(JSON.stringify(Object.keys(value.dims).sort())!==JSON.stringify(['md','sm','xs']))throw Error('Invalid canonical tag sizes');
 for(const row of Object.values(value.dims))for(const field of ['fs','padY','padX','minH','dotSize','gap'])if(!Number.isFinite(row[field])||row[field]<0)throw Error('Invalid canonical tag dimension '+field);
 return {border:value.border,dims:structuredClone(value.dims)};
}
