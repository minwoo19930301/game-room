// Twelve authored character poses, anchored to the same floor line.
// 4 x 3: idle / run A / run B / jump / punch / kick / guard / hurt /
// seated / victory / crouch / pointing. Crop transparent padding once at load.
export const CHARACTER_POSES = Object.freeze({idle:0,runA:1,runB:2,jump:3,punch:4,kick:5,guard:6,hurt:7,seated:8,victory:9,crouch:10,point:11});
export function prepareCharacters(image, makeCanvas = (w,h)=>{const c=document.createElement('canvas');c.width=w;c.height=h;return c;}) {
 const cellW=image.width/4,cellH=image.height/3,frames=[];
 for(let i=0;i<12;i++){
  const canvas=makeCanvas(Math.ceil(cellW),Math.ceil(cellH)),c=canvas.getContext('2d');
  c.drawImage(image,(i%4)*cellW,Math.floor(i/4)*cellH,cellW,cellH,0,0,cellW,cellH);
  const pixels=c.getImageData(0,0,canvas.width,canvas.height);let x0=canvas.width,y0=canvas.height,x1=0,y1=0;
  for(let y=0;y<canvas.height;y++)for(let x=0;x<canvas.width;x++)if(pixels.data[(y*canvas.width+x)*4+3]>24){x0=Math.min(x0,x);y0=Math.min(y0,y);x1=Math.max(x1,x);y1=Math.max(y1,y);}
  if(x1<x0||y1<y0)throw Error(`Character pose ${i} is empty`);
  frames.push({image:canvas,x:x0,y:y0,w:x1-x0+1,h:y1-y0+1,cellW});
 }
 const baseHeight=Math.max(...[0,1,2,4,5,6,7,11].map(i=>frames[i].h));
 const variants=[frames];
 return {variants,baseHeight};
}
export function drawCharacter(ctx,atlas,pose,x,y,height=160,{variant=0,facing=1,alpha=1,lean=0,squash=1}={}){
 if(!atlas)return;
 const f=atlas.variants[variant%atlas.variants.length][pose%12],s=height/atlas.baseHeight;
 ctx.save();ctx.translate(x,y);ctx.scale(facing,squash);ctx.rotate(lean);ctx.globalAlpha*=alpha;
 ctx.imageSmoothingEnabled=true;
 ctx.drawImage(f.image,f.x,f.y,f.w,f.h,-f.w*s/2,-f.h*s,f.w*s,f.h*s);
 ctx.restore();
}
