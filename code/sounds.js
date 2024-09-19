'use strict';

const sound_beep = new Sound([,0,220,.01,.08,.05,,.5,,,,,,,,,.3,.9,.01,,-99]); // Pickup 
const sound_engine = new Sound([,0,40,.2,.2,.2,,,,,,,,300,,,,,,,-80]); // engine
const sound_hit = new Sound([,.2,68,.01,.01,,,3,-1,,,,,2,,.3,,.3,.01]); // Hit 0
const sound_bump = new Sound([4,.2,400,.01,.01,.01,,.8,-60,-70,,,.03,.1,,,.1,.5,.01,.4,400]); // Blip 1955
const sound_checkpoint_outrun = new Sound([.3,0,980,,,,,3,,,,,,,,.03,,,,,500]); // outrun checkpoint
const sound_win = new Sound([1.5,,110,.04,,2,,6,,1,330,.07,.05,,,,.4,.8,,.5,1e3]); // Powerup 6686
const sound_lose = new Sound([,,120,.1,,1,,3,,.6,,,,1,,.2,.4,.1,1,,500]); // Explosion 621