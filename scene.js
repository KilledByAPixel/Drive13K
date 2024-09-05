'use strict';

function drawScene()
{
    drawSky();
    drawTrack();
    drawCars();
    drawScenery();
}

function drawSky()
{
    glEnableFog = 0; // disable fog

    //fogColor = hsl(200,.5,.5,0);  
    glSetDepthTest(0);

    {
        // horizon
        // background
        let s = 1e4;
        pushGradient(vec3(0,s,1e4), vec3(5e4,s), WHITE,  hsl(.57,1,.5));
        //pushGradient(vec3(0,s,1e4), vec3(5e4,s), RED,  RED);
        //pushGradient(vec3(0,-s+2e3,1e4), vec3(s), hsl(0,0,0),  hsl(0,1,0));
    }

    // clouds
    random.setSeed(13);
    for(let i=99;i--;)
    {
        let s = random.float(900,2000);
        pushSprite(vec3(worldHeading*-3e4 + random.floatSign(1e5),random.float(2000,9000),1e4), vec3(s*3,s,s), hsl(.15,1,.95,.5), getGenerativeTile(vec3(1,0)))
    }

    glRender();
    glEnableFog = 1; 
}