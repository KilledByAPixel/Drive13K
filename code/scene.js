'use strict';

function drawScene()
{
    drawSky();
    drawTrack();
    drawCars();
    drawTrackScenery();
}

function drawSky()
{
    glEnableLighting = glEnableFog = 0;
    glSetDepthTest(0,0);
    random.setSeed(13);

    // lerp level stuff
    const levelFloat = cameraOffset/checkpointDistance;
    const levelInfo = getLevelInfo(levelFloat);
    const levelInfoLast = getLevelInfo(levelFloat-1);
    const levelPercent = levelFloat%1;
    const levelLerpPercent = percent(levelPercent, 0, levelLerpRange);

    // sky
    const skyTop = 13e2; // slightly above camera
    const skyZ   = 1e3;
    const skyW   = 5e3;
    const skyH   = 8e2;
    {
        // top/bottom gradient
        const skyColorTop = levelInfoLast.skyColorTop.lerp(levelInfo.skyColorTop, levelLerpPercent);
        const skyColorBottom = levelInfoLast.skyColorBottom.lerp(levelInfo.skyColorBottom, levelLerpPercent);
        pushGradient(cameraPos.add(vec3(0,skyH,skyZ)), vec3(skyW,skyH), skyColorTop,  skyColorBottom);
        
        // light settings from sky
        glLightDirection = vec3(0,1,1).rotateY(worldHeading).normalize();
        glLightColor = skyColorTop.lerp(WHITE,.8).lerp(BLACK,.3);
        glAmbientColor = skyColorBottom.lerp(WHITE,.8).lerp(BLACK,.3);
        glFogColor = skyColorBottom.lerp(WHITE,.5);
    }

    const headingScale = -5e3;
    const circleSpriteTile = getSpriteTile(vec3());
    const dotSpriteTile = getSpriteTile(vec3(1,0));
    { 
        // sun
        const sunSize = 1e2;
        const sunHeight = skyTop*lerp(levelLerpPercent, levelInfoLast.sunHeight, levelInfo.sunHeight);
        const sunColor = levelInfoLast.sunColor.lerp(levelInfo.sunColor, levelLerpPercent);
        const x = mod(worldHeading+PI,2*PI)-PI;
        for(let i=0;i<1;i+=.05)
        {
            const c = sunColor.copy();
            c.a = i?(1-i)**7:1;
            pushSprite(cameraPos.add(vec3( x*headingScale, sunHeight, skyZ)), vec3(sunSize*(1+i*30)), c, i?dotSpriteTile:circleSpriteTile);
        }
    }

    // clouds
    const range = 1e4;
    const windSpeed = 50;
    for(let i=99;i--;)
    {
        const cloudColor = levelInfoLast.cloudColor.lerp(levelInfo.cloudColor, levelLerpPercent);
        const cloudWidth = lerp(levelLerpPercent, levelInfoLast.cloudWidth, levelInfo.cloudWidth);
        const cloudHeight = lerp(levelLerpPercent, levelInfoLast.cloudHeight, levelInfo.cloudHeight);

        let x = worldHeading*headingScale + random.float(range) + time*windSpeed*random.float(1,1.5);
        x = mod(x,range) - range/2;
        const y = random.float(skyTop);
        const s = random.float(3e2,8e2);
        pushSprite(cameraPos.add(vec3( x, y, skyZ)), vec3(s*cloudWidth,s*cloudHeight), cloudColor, getSpriteTile(vec3(1,0)))
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
        const levelTransition = levelFloat<.5 ? 1 : levelPercent < ltt ? (levelPercent/ltt)**ltp : 
                levelPercent > 1-ltt ? 1-((levelPercent-1)/ltt+1)**ltp : 1;
            
        const parallax = lerp(p, 1.01, 1.07);
        const s = random.float(1e2,2e2)*horizonSpriteSize;
        const size = vec3(random.float(1,2)*(horizonSprite.canMirror ? s*random.sign() : s),s,s);
        const x = mod(worldHeading*headingScale/parallax + random.float(range),range) - range/2;
        const y = lerp(levelTransition, -s*1.5, random.float(s));
        const c = horizonSprite.getRandomSpriteColor();
        pushSprite(cameraPos.add(vec3( x, y, skyZ)), size, c, horizonSpriteTile);
    }

    {
        // get ahead of player for horizon ground color to match track
        const lookAhead = .2;
        const levelFloatAhead = levelFloat + lookAhead;
        const levelInfo = getLevelInfo(levelFloatAhead);
        const levelInfoLast = getLevelInfo(levelFloatAhead-1);
        const levelPercent = levelFloatAhead%1;
        const levelLerpPercent = percent(levelPercent, 0, levelLerpRange);

        // horizon bottom
        const groundColor = levelInfoLast.groundColor.lerp(levelInfo.groundColor, levelLerpPercent).brighten(.1);
        pushSprite(cameraPos.add(vec3(0,-skyH,skyZ)), vec3(skyW,skyH), groundColor);
    }

    glRender();
    glSetDepthTest();
    glEnableLighting = glEnableFog = 1;
}