import {execFileSync} from 'node:child_process';
import {cpSync,rmSync} from 'node:fs';
for(const game of ['ramen','rangers','football-rescue','ringout']){
 execFileSync('npm',['run','build','--workspace',`sources/${game}`],{stdio:'inherit'});
 rmSync(`public/${game}`,{recursive:true,force:true});cpSync(`sources/${game}/dist`,`public/${game}`,{recursive:true});
}
