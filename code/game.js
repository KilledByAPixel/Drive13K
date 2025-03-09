'use strict';

// debug settings
let testLevel;
let quickStart;
let disableAiVehicles;
let testDrive;
let freeCamMode;
let testLevelInfo;
let testQuick;
const js13kBuild = 1; // fixes for legacy code made during js13k

///////////////////////////////////////////////////

// settings
const pixelate = 0;
const canvasFixedSize = 0;
const frameRate = 60;
const timeDelta = 1/frameRate;
const pixelateScale = 3;
const clampAspectRatios = enhancedMode;
const optimizedCulling = 1;
const random = new Random;
let autoPause = enhancedMode;
let autoFullscreen = 0;

// setup
const laneWidth = 1400;            // how wide is track
const trackSegmentLength = 100;    // length of each segment
const drawDistance = 1e3;          // how many track segments to draw
const cameraPlayerOffset = vec3(0,680,1050);
const checkpointTrackSegments = testQuick?1e3:4500;
const checkpointDistance = checkpointTrackSegments*trackSegmentLength;
const startCheckpointTime = 45;
const extraCheckpointTime = 40;
const levelLerpRange = .1;
const levelGoal = 10;
const playerStartZ = 2e3;
const turnWorldScale = 2e4;
const testStartZ = testLevel ? testLevel*checkpointDistance-1e3 : quickStart&&!testLevelInfo?5e3:0;

let mainCanvasSize;// = pixelate ? vec3(640, 420) : vec3(1280, 720);
let mainCanvas, mainContext;
let time, frame, frameTimeLastMS, averageFPS, frameTimeBufferMS, paused;
let checkpointTimeLeft, startCountdown, startCountdownTimer, gameOverTimer, nextCheckpointDistance;
let raceTime, playerLevel, playerWin, playerNewDistanceRecord, playerNewRecord;
let checkpointSoundCount, checkpointSoundTimer, vehicleSpawnTimer;
let titleScreenMode = 1, titleModeStartCount = 0;
let trackSeed = 1331;

///////////////////////////////
// game variables

let cameraPos, cameraRot, cameraOffset;
let worldHeading, mouseControl;
let track, vehicles, playerVehicle;
let freeRide;

///////////////////////////////

function gameInit()
{
    if (enhancedMode)
    {
        console.log(`Dr1v3n Wild by Frank Force`);
        console.log(`www.frankforce.com 🚗🌴`);
    }

    if (quickStart || testLevel)
        titleScreenMode = 0;

    debug && debugInit();
    glInit();
        
    document.body.appendChild(mainCanvas = document.createElement('canvas'));
    mainContext = mainCanvas.getContext('2d');

    const styleCanvas = 'position:absolute;' +               // position
        (clampAspectRatios?'top:50%;left:50%;transform:translate(-50%,-50%);':'') + // center
        (pixelate?' image-rendering: pixelated':'');         // pixelated

    glCanvas.style.cssText = mainCanvas.style.cssText = styleCanvas;

    if (!clampAspectRatios)
        document.body.style.margin = '0px';

    drawInit();
    inputInit()
    initGenerative();
    initSprites();
    initLevelInfos();
    gameStart();
    gameUpdate();
}

function gameStart()
{
    time = frame = frameTimeLastMS = averageFPS = frameTimeBufferMS = 
        cameraOffset = checkpointTimeLeft = raceTime = playerLevel = playerWin = playerNewDistanceRecord = playerNewRecord = freeRide = checkpointSoundCount = 0;
    startCountdown = quickStart || testLevel ? 0 : 4;
    worldHeading = titleScreenMode ? rand(7) : .8;
    checkpointTimeLeft = startCheckpointTime;
    nextCheckpointDistance = checkpointDistance;
    startCountdownTimer = new Timer;
    gameOverTimer = new Timer;
    vehicleSpawnTimer = new Timer;
    checkpointSoundTimer = new Timer;
    cameraPos = vec3();
    cameraRot = vec3();
    vehicles = [];
    buildTrack();
    vehicles.push(playerVehicle = new PlayerVehicle(testStartZ?testStartZ:playerStartZ, hsl(0,.8,.5)));

    if (titleScreenMode)
    {
        const level = titleModeStartCount*2%9;
        playerVehicle.pos.z = 8e4+level*checkpointDistance;
    }

    if (enhancedMode)
    {
        // match camera to ground at start
        cameraOffset = playerVehicle.pos.z - cameraPlayerOffset.z;
        const cameraTrackInfo = new TrackSegmentInfo(cameraOffset);
        cameraPos.y = cameraTrackInfo.offset.y;
        cameraRot.x = cameraTrackInfo.pitch/3;
    }
}

function gameUpdateInternal()
{
    if (titleScreenMode)
    {
        // update title screen
        if (mouseWasPressed(0) || keyWasPressed('Space') || isUsingGamepad && (gamepadWasPressed(0)||gamepadWasPressed(9)))
        {
            titleScreenMode = 0;
            gameStart();
        }
        if (time > 60)
        {
            // restart
            ++titleModeStartCount;
            gameStart();
        }
    }
    else
    {
        if (startCountdown > 0 && !startCountdownTimer.active())
        {
            --startCountdown;
            sound_beep.play(1,startCountdown?1:2);
            //speak(startCountdown || 'GO!' );
            startCountdownTimer.set(1);
        }

        if (gameOverTimer.get() > 1 && (mouseWasPressed(0) || isUsingGamepad && (gamepadWasPressed(0)||gamepadWasPressed(9))) || gameOverTimer.get() > 9)
        {
            // go back to title screen after a while
            titleScreenMode = 1;
            titleModeStartCount = 0;
            gameStart();
        }
        if (keyWasPressed('Escape') || isUsingGamepad && gamepadWasPressed(8))
        {
            // go back to title screen
            sound_bump.play(2);
            titleScreenMode = 1;
            ++titleModeStartCount;
            gameStart();
        }
        /*if (keyWasPressed('KeyR'))
        {
            titleScreenMode = 0;
            sound_lose.play(1,2);
            gameStart();
        }*/
        
        if (freeRide)
        {
             // free ride mode
            startCountdown = 0;
        }
        else if (keyWasPressed('KeyF'))
        {
            // enter free ride mode
            freeRide = 1;
            sound_lose.play(.5,3);
        }
        
        if (!startCountdown && !freeRide && !gameOverTimer.isSet())
        {
            // race mode
            raceTime += timeDelta;
            const lastCheckpointTimeLeft = checkpointTimeLeft;
            checkpointTimeLeft -= timeDelta;
            if (checkpointTimeLeft < 4)
            if ((lastCheckpointTimeLeft|0) != (checkpointTimeLeft|0))
            {
                // low time warning
                sound_beep.play(1,3);
            }

            const playerDistance = playerVehicle.pos.z;
            const minRecordDistance = 5e3;
            if (bestDistance && !playerNewDistanceRecord && playerDistance > bestDistance && playerDistance > minRecordDistance)
            {
                // new distance record
                sound_win.play(1,2);
                playerNewDistanceRecord = 1;
                //speak('NEW RECORD');
            }

            if (checkpointTimeLeft <= 0)
            {
                if (!(debug && debugSkipped))
                if (playerDistance > minRecordDistance)
                if (!bestDistance || playerDistance > bestDistance)
                {
                    playerNewDistanceRecord = 1;
                    bestDistance = playerDistance;
                    writeSaveData();
                }

                // game over
                checkpointTimeLeft = 0;
                //speak('GAME OVER');
                gameOverTimer.set();
                sound_lose.play();
            }
        }
    }
    updateCars();
}

function gameUpdate(frameTimeMS=0)
{
    if (!clampAspectRatios)
        mainCanvasSize = vec3(mainCanvas.width=innerWidth, mainCanvas.height=innerHeight);
    else
    {
        // more complex aspect ratio handling
        const innerAspect = innerWidth / innerHeight;
        if (canvasFixedSize)
        {
            // clear canvas and set fixed size
            mainCanvas.width  = mainCanvasSize.x;
            mainCanvas.height = mainCanvasSize.y;
        }
        else
        {
            const minAspect = .45, maxAspect = 3;
            const correctedWidth = innerAspect > maxAspect ? innerHeight * maxAspect :
                    innerAspect < minAspect ? innerHeight * minAspect : innerWidth;
            if (pixelate)
            {
                const w = correctedWidth / pixelateScale | 0;
                const h = innerHeight / pixelateScale | 0;
                mainCanvasSize = vec3(mainCanvas.width = w, mainCanvas.height = h);
            }
            else
                mainCanvasSize = vec3(mainCanvas.width=correctedWidth, mainCanvas.height=innerHeight);
        }
            
        // fit to window by adding space on top or bottom if necessary
        const fixedAspect = mainCanvas.width / mainCanvas.height;
        mainCanvas.style.width  = glCanvas.style.width  = innerAspect < fixedAspect ? '100%' : '';
        mainCanvas.style.height = glCanvas.style.height = innerAspect < fixedAspect ? '' : '100%';
    }
    
    if (enhancedMode)
    {
        document.body.style.cursor = // fun cursors!
            !mouseControl ? 'auto': mouseIsDown(2) ? 'grabbing' : mouseIsDown(0) ? 'pointer' : 'grab';

        if (paused)
        {
            // hack: special input handling when paused
            inputUpdate();
            if (keyWasPressed('Space') || keyWasPressed('KeyP') 
                || mouseWasPressed(0) || isUsingGamepad && (gamepadWasPressed(0)||gamepadWasPressed(9)))
            {
                paused = 0;
                sound_checkpoint.play(.5);
            }
            if (keyWasPressed('Escape') || isUsingGamepad && gamepadWasPressed(8))
            {
                // go back to title screen
                paused = 0;
                sound_bump.play(2);
                titleScreenMode = 1;
                ++titleModeStartCount;
                gameStart();
            }
            inputUpdatePost();
        }
    }

    // update time keeping
    let frameTimeDeltaMS = frameTimeMS - frameTimeLastMS;
    frameTimeLastMS = frameTimeMS;
    const debugSpeedUp   = devMode && (keyIsDown('Equal')|| keyIsDown('NumpadAdd')); // +
    const debugSpeedDown = devMode && keyIsDown('Minus') || keyIsDown('NumpadSubtract'); // -
    if (debug) // +/- to speed/slow time
        frameTimeDeltaMS *= debugSpeedUp ? 20 : debugSpeedDown ? .1 : 1;
    averageFPS = lerp(.05, averageFPS, 1e3/(frameTimeDeltaMS||1));
    frameTimeBufferMS += paused ? 0 : frameTimeDeltaMS;
    frameTimeBufferMS = min(frameTimeBufferMS, 50); // clamp in case of slow framerate

    // apply flux capacitor, improves smoothness of framerate in some browsers
    let fluxCapacitor = 0;
    if (frameTimeBufferMS < 0 && frameTimeBufferMS > -9)
    {
        // the flux capacitor is what makes time travel possible
        // force at least one update each frame since it is waiting for refresh
        // -9 needed to prevent fast speeds on > 60fps monitors
        fluxCapacitor = frameTimeBufferMS;
        frameTimeBufferMS = 0;
    }
    
    // update multiple frames if necessary in case of slow framerate
    for (;frameTimeBufferMS >= 0; frameTimeBufferMS -= 1e3/frameRate)
    {
        // increment frame and update time
        time = frame++ / frameRate;
        gameUpdateInternal();
        enhancedModeUpdate();
        debugUpdate();
        inputUpdate();
    
        if (enhancedMode && !titleScreenMode)
        if (keyWasPressed('KeyP') || isUsingGamepad && gamepadWasPressed(9))
        if (!gameOverTimer.isSet())
        {
            // update pause
            paused = 1;
            sound_checkpoint.play(.5,.5);
        }
        
        updateCamera();
        trackPreUpdate();
        inputUpdatePost();
    }

    // add the time smoothing back in
    frameTimeBufferMS += fluxCapacitor;

    //mainContext.imageSmoothingEnabled = !pixelate;
    //glContext.imageSmoothingEnabled = !pixelate;

    glPreRender(mainCanvasSize);
    drawScene();
    touchGamepadRender();
    drawHUD();
    debugDraw();
    requestAnimationFrame(gameUpdate);
}

function enhancedModeUpdate()
{
    if (!enhancedMode)
        return;

    if (document.hasFocus())
    {
        if (autoFullscreen && !isFullscreen())
            toggleFullscreen();
        autoFullscreen = 0;
    }

    if (!titleScreenMode && !isTouchDevice && autoPause && !document.hasFocus())
        paused = 1; // pause when losing focus

    if (keyWasPressed('Home')) // dev mode
        devMode || (debugInfo = devMode = 1);
    if (keyWasPressed('KeyI')) // debug info
        debugInfo = !debugInfo;
    if (keyWasPressed('KeyM')) // toggle mute
    {
        if (soundVolume)
            sound_bump.play(.4,3);
        soundVolume = soundVolume ? 0 : .3;
        if (soundVolume)
            sound_bump.play();
    }
    if (keyWasPressed('KeyR')) // restart
    {
        titleScreenMode = 0;
        sound_lose.play(1,2);
        gameStart();
    }
}

function updateCamera()
{
    // update camera
    const lastCameraOffset = cameraOffset;
    cameraOffset = playerVehicle.pos.z - cameraPlayerOffset.z;
    const cameraTrackInfo = new TrackSegmentInfo(cameraOffset);
    const playerTrackInfo = new TrackSegmentInfo(playerVehicle.pos.z);

    // update world heading based on speed and track turn
    const v = cameraOffset - lastCameraOffset;
    worldHeading += v*cameraTrackInfo.offset.x/turnWorldScale;

    // put camera above player
    cameraPos.y = playerTrackInfo.offset.y + (titleScreenMode?1e3:cameraPlayerOffset.y);

    // move camera with player
    cameraPos.x = playerVehicle.pos.x;

    // slight tilt camera with road
    cameraRot.x = lerp(.1,cameraRot.x, cameraTrackInfo.pitch/3);

    if (freeCamMode)
    {
        cameraPos = freeCamPos.copy();
        cameraRot = freeCamRot.copy();
    }
}

///////////////////////////////////////
// save data

const saveName = 'DW';
let bestTime     = localStorage[saveName+3]*1 || 0;
let bestDistance = localStorage[saveName+4]*1 || 0;

function writeSaveData()
{
    localStorage[saveName+3] = bestTime;
    localStorage[saveName+4] = bestDistance;
}