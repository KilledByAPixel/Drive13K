'use strict';

const sound_beep = new Sound([,0,220,.01,.06,.05,,.5,,,,,,,,,.3,.9,.01,,-99]); // Pickup 
const sound_engine = new Sound([,0,40,.2,.2,.2,,,,,,,,300,,,,,,,-80]); // engine
const sound_hit = new Sound([3,.3,500,,,,,2,6,,,,,1,,.3,,1,.05,,-2200]); // Hit 2245
const sound_bump = new Sound([4,.2,400,.01,.01,.01,,.8,-60,-70,,,.03,.1,,,.1,.5,.01,.4,400]); // Blip 1955
const sound_checkpoint_outrun = new Sound([.3,0,980,,,,,3,,,,,,,,.03,,,,,500]); // outrun checkpoint
const sound_win = new Sound([,,110,.04,.2,2,,3,,1,330,.06,.05,,,,.3,.8,.3,.5,-1e3]); // Powerup 6686;
const sound_lose = new Sound([2,,120,.02,.03,2,1,3,,.6,,,,2,,.2,.4,.5,.15,,500]); // Explosion 621