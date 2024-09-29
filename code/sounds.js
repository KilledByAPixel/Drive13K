'use strict';

const sound_beep = new Sound([,0,220,.01,.08,.05,,.5,,,,,,,,,.3,.9,.01,,-99]); // beep
const sound_engine = new Sound([,,40,.2,.5,.5,,,,,,,,300,,,,,,,-80]); // engine
const sound_hit = new Sound([,.3,90,,,.2,,3,,,,,,9,,.3,,.3,.01]); // crash
const sound_bump = new Sound([4,.2,400,.01,.01,.01,,.8,-60,-70,,,.03,.1,,,.1,.5,.01,.4,400]); // bump
const sound_checkpoint = new Sound([.3,0,980,,,,,3,,,,,,,,.03,,,,,500]); // checkpoint
const sound_win = new Sound([1.5,,110,.04,,2,,6,,1,330,.07,.05,,,,.4,.8,,.5,1e3]); // win 
const sound_lose = new Sound([,,120,.1,,1,,3,,.6,,,,1,,.2,.4,.1,1,,500]); // lose