'use strict';

const enableMusic=0;

function initSounds()
{
    if (!enableMusic)
        return;
}

let sound_beep = new Sound([,0,220,.01,.06,.05,,.5,,,,,,,,,.3,.9,.01,,-99]); // Pickup 
let sound_engine = new Sound([,0,40,.2,.2,.2,,,,,,,,300,,,,,,,-80]); // engine

let sound_hit = new Sound([3,.3,500,,,,,2,6,,,,,1,,.3,,1,.05,,-2200]); // Hit 2245
let sound_bump =new Sound([4,.2,400,.01,.01,.01,,.8,-60,-70,,,.03,.1,,,.1,.57,.01,.4,400]); // Blip 1955
//let sound_start = new Sound([,,29,.03,,.08,,,27,73,,,,,1.5]); // Blip 609

let sound_checkpoint_outrun = new Sound([.3,0,980,,,,,3,,,,,,,,.03,,,,,500]); // outrun checkpoint - Copy 4

let sound_win = new Sound([,,110,.04,.2,2,,3,,1,332,.06,.05,,,,.3,.8,.3,.5,-1e3]); // Powerup 6686;

let sound_lose = new Sound([2,,114,.02,.03,2,1,3,,.6,,,,2,,.2,.4,.5,.14,,500]); // Explosion 621

//let sound_mariocoin = new Sound([3,0,988,,,.4,,33,,,331,.1,,,,,,,,,-340]); // coin;

///////////////////////////////////////////////////////////////////////////////
// music stuff
