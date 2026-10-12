import {hash} from './style-arguments-core.mjs';

// Type shape only. This never approves a caller value or an authored default.
// It is used only after the existing exact declaration/caller flow passes.
export function primitiveFlowType(ts,sf,flow){
 if(flow.path!==sf.fileName||hash(sf.text)!==flow.sourceHash)return null;
 const declarations=[];const visit=n=>{if((ts.isFunctionDeclaration(n)||ts.isFunctionExpression(n))&&n.name?.text===flow.component&&sf.getLineAndCharacterOfPosition(n.getStart(sf)).line+1===flow.declarationLine)declarations.push(n);ts.forEachChild(n,visit);};visit(sf);if(declarations.length!==1)return null;
 const fn=declarations[0],param=fn.parameters.find(p=>ts.isObjectBindingPattern(p.name)&&p.name.elements.some(e=>(e.propertyName??e.name).getText(sf)===flow.prop));if(!param)return null;
 const binding=param.name.elements.find(e=>(e.propertyName??e.name).getText(sf)===flow.prop);if(!ts.isIdentifier(binding.name)||binding.getText(sf)!==flow.binding)return null;
 const localTypes=new Map(sf.statements.filter(n=>ts.isInterfaceDeclaration(n)||ts.isTypeAliasDeclaration(n)).map(n=>[n.name.text,n]));
 const propertyType=(type,depth=0)=>{
  if(!type||depth>8)return null;
  if(ts.isTypeLiteralNode(type)||ts.isInterfaceDeclaration(type))return type.members.find(m=>ts.isPropertySignature(m)&&m.name.getText(sf).replace(/^['"]|['"]$/g,'')===flow.prop)?.type??null;
  if(ts.isTypeReferenceNode(type)&&ts.isIdentifier(type.typeName)&&!type.typeArguments?.length){const found=localTypes.get(type.typeName.text);if(found&& !found.typeParameters?.length)return propertyType(ts.isTypeAliasDeclaration(found)?found.type:found,depth+1);}
  return null;
 };
 const shape=(type,depth=0)=>{
  if(!type||depth>8)return null;
  if(ts.isParenthesizedTypeNode(type))return shape(type.type,depth+1);
  if(ts.isUnionTypeNode(type)){const parts=type.types.map(t=>shape(t,depth+1));return parts.every(Boolean)?parts.flat():null;}
  if(type.kind===ts.SyntaxKind.StringKeyword)return ['string'];if(type.kind===ts.SyntaxKind.NumberKeyword)return ['number'];if(type.kind===ts.SyntaxKind.BooleanKeyword)return ['boolean'];if(type.kind===ts.SyntaxKind.UndefinedKeyword)return [];
  if(ts.isLiteralTypeNode(type)){if(ts.isStringLiteral(type.literal))return ['string'];if(ts.isNumericLiteral(type.literal))return ['number'];if([ts.SyntaxKind.TrueKeyword,ts.SyntaxKind.FalseKeyword].includes(type.literal.kind))return ['boolean'];if(type.literal.kind===ts.SyntaxKind.NullKeyword)return [];}
  return null;
 };
 const kinds=shape(propertyType(param.type));if(!kinds?.length)return null;const unique=[...new Set(kinds)];return unique.length===1?unique[0]:'mixed';
}
