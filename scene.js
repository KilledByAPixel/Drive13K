'use strict';

function drawScene()
{
    drawSky();
    drawTrack();
    drawCars();
    drawTrackScenery();
}

function preRenderSky()
{
    // lerp level stuff
    const levelFloat = getPlayerLevelFloat();
    const levelInfo = getLevelInfo(levelFloat);
    const levelInfoLast = getLevelInfo(levelFloat-1);
    const levelPercent = levelFloat%1;
    const levelLerpPercent = percent(levelPercent, 0, levelLerpRange);
    const skyColorTop = levelInfoLast.skyColorTop.lerp(levelInfo.skyColorTop, levelLerpPercent);
    const skyColorBottom = levelInfoLast.skyColorBottom.lerp(levelInfo.skyColorBottom, levelLerpPercent);

    // track settings
    lightDirection = vec3(0,1,1).rotateY(worldHeading).normalize();
    lightColor = skyColorTop.lerp(WHITE,.8).lerp(BLACK,.3);
    ambientColor = skyColorBottom.lerp(WHITE,.8).lerp(BLACK,.3);
    fogColor = skyColorBottom.lerp(WHITE,.5);
}

function drawSky()
{
    glEnableFog = 0; // disable fog when drawing sky
    random.setSeed(13);

    // lerp level stuff
    const levelFloat = getPlayerLevelFloat();
    const levelInfo = getLevelInfo(levelFloat);
    const levelInfoLast = getLevelInfo(levelFloat-1);
    const levelPercent = levelFloat%1;
    const levelLerpPercent = percent(levelPercent, 0, levelLerpRange);

    // sky
    const skyZ   = 1e5;
    const skyTop = 13e4; // slightly above camera
    const skyW   = 5e5;
    const skyH   = 8e4;
    {
        // top/bottom gradient
        const skyColorTop = levelInfoLast.skyColorTop.lerp(levelInfo.skyColorTop, levelLerpPercent);
        const skyColorBottom = levelInfoLast.skyColorBottom.lerp(levelInfo.skyColorBottom, levelLerpPercent);
        pushGradient(vec3(0,skyH,skyZ), vec3(skyW,skyH), skyColorTop,  skyColorBottom);
    }

    const headingScale = -5e5;
    const range = 1e6;
    const circleSpriteTile = getSpriteTile(vec3());
    const dotSpriteTile = getSpriteTile(vec3(1,0));
    { 
        // sun / moon
        const sunSize = 1e4;
        const sunHeight = skyTop*lerp(levelLerpPercent, levelInfoLast.sunHeight, levelInfo.sunHeight);
        const sunColor = levelInfoLast.sunColor.lerp(levelInfo.sunColor, levelLerpPercent);
        const x = mod(worldHeading+PI,2*PI)-PI;
        for(let i=0;i<1;i+=.05)
        {
            const c = sunColor.copy();
            c.a = i?.2*(1-i)**2:1;
            pushSprite(vec3( x*headingScale, sunHeight, skyZ), vec3(sunSize*(1+i*30)), c, i?dotSpriteTile:circleSpriteTile);
        }
    }

    // clouds
    const windSpeed = 5e3;
    for(let i=99;i--;)
    {
        const cloudColor = levelInfoLast.cloudColor.lerp(levelInfo.cloudColor, levelLerpPercent);
        const cloudWidth = lerp(levelLerpPercent, levelInfoLast.cloudWidth, levelInfo.cloudWidth);
        const cloudHeight = lerp(levelLerpPercent, levelInfoLast.cloudHeight, levelInfo.cloudHeight);
        const s = random.float(3e4,8e4);
        let x = worldHeading*headingScale + random.float(range) + time*windSpeed*random.float(1,1.5);
        x = mod(x,range) - range/2;
        const y = random.float(skyTop);
        pushSprite(vec3( x, y, skyZ), vec3(s*cloudWidth,s*cloudHeight), cloudColor, getSpriteTile(vec3(1,0)))
    }

    // parallax
    const horizonSprite = levelInfo.horizonSprite;
    const horizonSpriteTile = getSpriteTile(horizonSprite.tilePos);
    const horizonSpriteSize = levelInfo.horizonSpriteSize;
    for(let i=99;i--;)
    {
        const p = i/99;
        const ltp = lerp(p,1,2);
        const ltt = .1;
        let levelTransition = levelPercent < ltt ? (levelPercent/ltt)**ltp : 
                levelPercent > 1-ltt ? 1-((levelPercent-1)/ltt+1)**ltp : 1;
        if (levelFloat>levelGoal-.5 | levelFloat<.5)
            levelTransition = 1; // dont transition out of last level
            
        const parallax = lerp(p, 1.01, 1.09);
        const s = random.float(1e4,2e4)*horizonSpriteSize;
        const x = mod(worldHeading*headingScale/parallax + random.float(range),range) - range/2;
        const y = lerp(levelTransition, -s*1.5, random.float(s));
        const c = horizonSprite.getRandomSpriteColor();
        pushSprite(vec3( x, y, skyZ), vec3(s*random.float(1,2),s,s), c, horizonSpriteTile);
    }

    {
        // horizon bottom
        const groundColor = levelInfoLast.groundColor.lerp(levelInfo.groundColor, levelLerpPercent);
        pushSprite(vec3(0,-skyH,skyZ), vec3(skyW,skyH), groundColor);
    }

    glRender();
    glSetDepthTest();
    glEnableFog = 1; 
}