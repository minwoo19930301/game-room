export function drawHero(ctx,x,y,s=1,pose='idle',t=0,color='#3478db',opts={}) {
 ctx.save();ctx.translate(x,y);ctx.rotate(opts.rot||0);ctx.scale(opts.flip?-s:s,s);if(opts.alpha!=null)ctx.globalAlpha=opts.alpha;
 const crouch=['harden','ball','sleep'].includes(pose), run=pose==='run', wave=['fly','jump','hit'].includes(pose);
 ctx.translate(0,crouch?12:Math.sin(t*(run?18:3))*(run?2:1));
 const limb=(a,b,c,d,col,w)=>{ctx.strokeStyle=col;ctx.lineWidth=w;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(a,b);ctx.lineTo(c,d);ctx.stroke();};
 const stride=run?Math.sin(t*18)*10:0;
 limb(-7,8,-8+stride,crouch?20:30,'#24334d',9);limb(7,8,8-stride,crouch?20:30,'#24334d',9);
 limb(-8+stride,crouch?21:31,-13+stride,crouch?21:31,'#122035',7);limb(8-stride,crouch?21:31,13-stride,crouch?21:31,'#122035',7);
 ctx.fillStyle=pose==='harden'?'#73869a':color;ctx.beginPath();ctx.roundRect(-15,-17,30,31,7);ctx.fill();
 ctx.fillStyle='#e2efff';ctx.beginPath();ctx.moveTo(-7,-17);ctx.lineTo(0,-10);ctx.lineTo(7,-17);ctx.fill();
 ctx.fillStyle='#fff';for(let j=0;j<3;j++)ctx.fillRect(-1,-6+j*6,2,2);
 const ay=wave?-31:crouch?-5:pose==='eat'?-13:8;
 limb(-14,-11,-23,ay,color,9);limb(14,-11,pose==='eat'?32:23,ay,color,9);
 limb(-23,ay,-24,ay-2,'#efbd95',7);limb(pose==='eat'?32:23,ay,pose==='eat'?35:24,ay-2,'#efbd95',7);
 ctx.fillStyle='#efbd95';ctx.beginPath();ctx.arc(0,-30,14,0,Math.PI*2);ctx.fill();
 ctx.fillStyle='#19283e';ctx.beginPath();ctx.arc(0,-34,14,Math.PI,Math.PI*2);ctx.lineTo(13,-29);ctx.lineTo(5,-37);ctx.lineTo(-5,-30);ctx.lineTo(-13,-28);ctx.fill();
 ctx.strokeStyle='#26344a';ctx.lineWidth=2;for(const ex of [-5,5]){ctx.beginPath();ctx.moveTo(ex-1,-29);ctx.lineTo(ex+1,pose==='sleep'?-29:-27);ctx.stroke();}
 ctx.beginPath();ctx.arc(0,-24,3,0,Math.PI);ctx.stroke();
 if(pose==='harden'){ctx.fillStyle='#a6c6df';ctx.strokeStyle='#e8f8ff';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-17,-10);ctx.lineTo(17,-10);ctx.lineTo(14,12);ctx.lineTo(0,23);ctx.lineTo(-14,12);ctx.closePath();ctx.fill();ctx.stroke();}
 ctx.restore();
}
