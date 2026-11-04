// Short original synthesized cues. No external music or samples.
export function createAudio(){
 let context=null,enabled=false;
 const notes={jump:[330,660,.13,'square'],coin:[988,1319,.14,'square'],stomp:[150,75,.09,'triangle'],bump:[110,65,.06,'triangle'],break:[180,40,.14,'sawtooth'],power:[440,880,.35,'square'],fire:[460,120,.1,'sawtooth'],hurt:[200,70,.23,'triangle'],death:[440,55,.55,'triangle'],checkpoint:[523,784,.3,'square'],clear:[523,1047,.5,'square'],complete:[659,1319,.6,'square'],life:[784,1568,.4,'square']};
 return {
  get enabled(){return enabled},
  set(value){enabled=!!value;if(enabled){try{context??=new AudioContext();context.resume().catch(()=>{});}catch{enabled=false;}}return enabled},
  play(type){if(!enabled||!context||!notes[type])return;const [from,to,duration,wave]=notes[type],now=context.currentTime;const oscillator=context.createOscillator(),gain=context.createGain();oscillator.type=wave;oscillator.frequency.setValueAtTime(from,now);oscillator.frequency.exponentialRampToValueAtTime(to,now+duration);gain.gain.setValueAtTime(.0001,now);gain.gain.exponentialRampToValueAtTime(.035,now+.008);gain.gain.exponentialRampToValueAtTime(.0001,now+duration);oscillator.connect(gain);gain.connect(context.destination);oscillator.start(now);oscillator.stop(now+duration+.01);},
  dispose(){context?.close().catch(()=>{});enabled=false;}
 };
}
