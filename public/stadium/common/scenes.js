/* Authored environments. Coordinates remain aligned with the original playfields. */
(function(){
 const rr=(c,x,y,w,h,r,f)=>{c.fillStyle=f;c.beginPath();c.roundRect(x,y,w,h,r);c.fill()};
 const gradient=(c,x,y,w,h,colors)=>{const g=c.createLinearGradient(x,y,x,y+h);colors.forEach((a,i)=>g.addColorStop(i/(colors.length-1),a));rr(c,x,y,w,h,0,g)};
 const line=(c,x,y,x2,y2,color,width=1)=>{c.strokeStyle=color;c.lineWidth=width;c.beginPath();c.moveTo(x,y);c.lineTo(x2,y2);c.stroke()};
 function wood(c,y,height,base='#9e6440') {gradient(c,0,y,960,height,[base,'#6e4432']);for(let k=0;k<17;k++){const x=k*64-32;line(c,x,y,480+(x-480)*1.9,y+height,'#38251f38',2);for(let j=0;j<4;j++)line(c,x+8+j*9,y,x+19+j*11,y+height,'#f6c38a0c',1)}for(let j=0;j<4;j++)line(c,0,y+j*j*15,960,y+j*j*15,'#4e302a55',2)}
 function windowScene(c,x,y,w,h){c.save();c.shadowColor='#3f342c40';c.shadowBlur=14;c.shadowOffsetY=8;rr(c,x-8,y-8,w+16,h+16,6,'#8e6045');c.shadowBlur=0;c.shadowOffsetY=0;gradient(c,x,y,w,h,['#b0dbe1','#eef4d7']);c.save();c.beginPath();c.rect(x,y,w,h);c.clip();c.fillStyle='#8fb793';c.beginPath();c.ellipse(x+w*.2,y+h,w*.5,h*.3,0,0,7);c.ellipse(x+w*.8,y+h,w*.6,h*.4,0,0,7);c.fill();c.restore();rr(c,x+w*.48,y,5,h,0,'#f5e4bf');rr(c,x,y+h*.46,w,5,0,'#f5e4bf');rr(c,x-14,y+h,w+28,9,3,'#d8b587');c.restore()}
 function classroom(c,t,active){gradient(c,0,0,960,288,['#ede6d2','#d4cdb7']);for(let x=0;x<960;x+=24)line(c,x,0,x,288,'#65513d05');rr(c,0,245,960,45,0,'#a8b89f');for(let x=0;x<960;x+=64){line(c,x,245,x,288,'#71857150',2);rr(c,x+5,254,54,26,2,'#d5dfbc22')};rr(c,0,282,960,8,0,'#647360');wood(c,290,250,'#bc8755');windowScene(c,35,71,115,125);windowScene(c,810,71,115,125);
 c.save();c.fillStyle='#fff5ce26';c.beginPath();c.moveTo(35,197);c.lineTo(150,197);c.lineTo(400,540);c.lineTo(100,540);c.fill();c.restore();
 // Clock and tiny classroom details.
 c.fillStyle='#e9e1ce';c.beginPath();c.arc(480,19,15,0,7);c.fill();c.strokeStyle='#7c705e';c.lineWidth=2;c.stroke();line(c,480,19,480,9,'#4c544f',2);line(c,480,19,488,22,'#4c544f',2);
 rr(c,28,211,139,25,3,'#8e7154');for(let j=0;j<7;j++)rr(c,37+j*15,214,11,19-(j%3)*3,1,['#b46d56','#738d82','#caac72'][j%3]);
 const b=c.createLinearGradient(0,40,0,200);b.addColorStop(0,active?'#245454':'#244740');b.addColorStop(1,'#123b37');c.save();c.shadowColor='#3a332c55';c.shadowBlur=14;c.shadowOffsetY=9;rr(c,188,28,584,184,7,'#725035');c.shadowBlur=0;rr(c,193,33,574,174,3,'#b88d58');rr(c,200,40,560,160,2,b);c.restore();for(let j=0;j<42;j++){c.strokeStyle='#dce2c40b';c.beginPath();c.moveTo(210+(j*79)%525,46+(j*37)%145);c.lineTo(232+(j*79)%510,47+(j*37)%145);c.stroke()};rr(c,188,207,584,9,2,'#c09868');rr(c,620,202,25,4,1,'#e9e0cb');rr(c,650,202,14,4,1,'#e0b783');
 }
 function sushi(c,t){gradient(c,0,0,960,540,['#51473f','#c3ac84','#7d6048']);for(let x=0;x<960;x+=35){rr(c,x,0,3,100,0,'#d9ba8122')};rr(c,0,94,960,14,0,'#352c28');
 // Noren fabric and warm lanterns.
 for(let k=0;k<7;k++){const x=194+k*82;gradient(c,x,0,78,54,['#243b44','#1b3038']);c.fillStyle='#d2c2a0';c.font='18px serif';c.textAlign='center';c.fillText(['旬','の','味','鮨','の','店',''][k],x+39,30);rr(c,x,51,78,3,0,'#142730')}
 for(const x of [95,865]){line(c,x,0,x,23,'#211c17',3);const g=c.createRadialGradient(x,50,1,x,50,60);g.addColorStop(0,'#ffd99877');g.addColorStop(1,'#ffb14a00');c.fillStyle=g;c.fillRect(x-65,0,130,120);gradient(c,x-22,25,44,47,['#fff1be','#e5a858']);for(let j=0;j<6;j++)line(c,x-20,30+j*7,x+20,30+j*7,'#ad653c55');rr(c,x-18,20,36,6,2,'#6e442d');rr(c,x-18,70,36,6,2,'#6e442d')}
 wood(c,108,432,'#a47a50');c.save();c.fillStyle='#0f17182e';c.beginPath();c.ellipse(480,314,425,222,0,0,7);c.fill();c.restore();
 }
 function arena(c,t){gradient(c,0,0,960,420,['#bdd1db','#f3d6b1','#bd9680']);c.fillStyle='#fbf0cf';c.beginPath();c.arc(755,84,37,0,7);c.fill();
 for(let layer=0;layer<3;layer++){c.fillStyle=['#879aaf','#708b9d','#536b7b'][layer];c.beginPath();c.moveTo(0,230+layer*30);for(let i=0;i<10;i++)c.lineTo(i*125,110+layer*32+Math.sin(i*2.8+layer)*45);c.lineTo(960,420);c.lineTo(0,420);c.fill()}
 for(const x of [-25,215,455,695,935]){gradient(c,x,115,48,290,['#a9a38f','#615e56']);rr(c,x-8,112,64,18,3,'#c5b99e');rr(c,x-8,384,64,20,3,'#8b7f6b');line(c,x+8,138,x+8,379,'#e4d4b344',4)}
 for(let row=0;row<5;row++)for(let i=-1;i<15;i++){const x=i*75+(row%2?37:0),y=264+row*28;gradient(c,x+1,y+1,73,26,[(i+row)%2?'#9a9380':'#a69b86','#817968']);line(c,x+4,y+3,x+70,y+3,'#d1c2a555')}
 gradient(c,0,402,960,138,['#b3a38a','#6f6c65']);for(let x=-400;x<1400;x+=95)line(c,480+(x-480)*.55,402,x,540,'#4b4e4a66',2);for(const y of [418,448,495])line(c,0,y,960,y,'#484c4355',2);
 for(let j=0;j<16;j++){c.fillStyle='#fff0c955';c.beginPath();c.arc((j*113+t*(5+j%3*3))%960,120+(j*31)%250,1+j%2*.5,0,7);c.fill()}
 }
 function park(c,t){gradient(c,0,0,960,386,['#a9d2df','#f5e9bf']);c.fillStyle='#f9e9a8';c.beginPath();c.arc(780,91,40,0,7);c.fill();for(let i=0;i<8;i++){const x=i*145-30;c.fillStyle=i%2?'#769b7d':'#92ad85';c.beginPath();c.ellipse(x,205,135,70,0,0,7);c.fill()}
 for(const x of [56,900]){rr(c,x,100,12,115,2,'#716047');for(let j=0;j<3;j++){c.fillStyle=['#78956c','#8aaa74','#9cb784'][j];c.beginPath();c.arc(x+5+(j-1)*28,95+j*7,40,0,7);c.fill()}}
 rr(c,0,206,960,14,0,'#68876c');rr(c,0,221,960,165,0,'#d9c3a0');for(let y=229;y<386;y+=13)line(c,0,y,960,y,'#f5e6cd55');for(let x=0;x<960;x+=54)line(c,x,220,x+28,386,'#aa957a22');
 for(const y of [267,317,366]){line(c,0,y,960,y,'#ad997e55');line(c,0,y+2,960,y+2,'#eee0c733')}
 // Fenced promenade and flower beds; neutral track keeps counting readable.
 for(let x=0;x<960;x+=40)rr(c,x,179,4,44,2,'#e9dec4');rr(c,0,187,960,5,1,'#e9dec4');rr(c,0,207,960,5,1,'#e9dec4');
 gradient(c,0,386,960,154,['#678c75','#294e47']);rr(c,0,386,960,8,0,'#c2b093');for(let x=0;x<960;x+=24){c.fillStyle=x%48?'#bda880':'#c6bf98';c.beginPath();c.arc(x+7,403,3,0,7);c.fill()}
 }
 window.STADIUM_SCENES={classroom,sushi,arena,park};
})();
