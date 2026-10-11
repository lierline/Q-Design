// Capture metadata remains private. Published summaries must not carry login
// links or local fixture tokens, even when the repository itself is private.
const privateKeys=new Set(['invite','token','token_hash','access_token','refresh_token','code','otp','email','password','api_key','apikey','signature']);
export function redactEvidenceURL(value){
 if(typeof value!=='string')return value;
 let url;try{url=new URL(value,'https://evidence.invalid');}catch{return value;}
 let changed=false;
 if(url.username||url.password){url.username='';url.password='';changed=true;}
 for(const key of [...url.searchParams.keys()])if(privateKeys.has(key.toLowerCase())){url.searchParams.set(key,'REDACTED');changed=true;}
 if(url.hash.includes('=')){
  const params=new URLSearchParams(url.hash.slice(1));let redacted=false;
  for(const key of [...params.keys()])if(privateKeys.has(key.toLowerCase())){params.set(key,'REDACTED');redacted=true;}
  if(redacted){url.hash=params.toString();changed=true;}
 }
 if(!changed)return value;
 return value.startsWith('/')?url.pathname+url.search+url.hash:url.toString();
}
export function publishedPageEvidence(value){
 if(Array.isArray(value))return value.map(publishedPageEvidence);
 if(!value||typeof value!=='object')return value;
 return Object.fromEntries(Object.entries(value).map(([key,child])=>[key,/^(?:url|actualURL|destination)$/i.test(key)?redactEvidenceURL(child):publishedPageEvidence(child)]));
}
