'use strict';

showMap = 0;

speakEnable = 1;
debugInfo = 0;
//debugTile = vec3(6,0)
//debugGenerativeCanvas = 1
soundVolume = .3;

const engineName = 'js13kRace';
const testDrive = 0;
const enableTexture = 1;
const enableLighting = 1;
const pixelate = 0;
const canvasFixedSize = 0;
const frameRate = 60;
const timeDelta = 1/60;

// track settings
const trackWidth = 1000;           // how wide is track
const trackEnd = 1e4;              // how many sections until end of the track
const trackSegmentLength = 100;    // length of each segment
const drawDistance = 1e3;          // how many track segments to draw in front
const sceneryDrawDistance = 500;   // how far to draw scenery
const cameraPlayerOffset = vec3(0,700,1050);
const checkpointTrackSegments = 3e3;
const checkpointDistance = checkpointTrackSegments*trackSegmentLength;  // how far between checkpoints
const checkpointMaxDifficulty = 9; // how many checkpoints before max difficulty
const startCheckpointTime = 30;

let quickStart = 0;
let attractMode = 1;
let mainCanvasSize = pixelate ? vec3(640, 420) : vec3(1280, 720);
let mainCanvas, mainContext;
let time, frame, frameTimeLastMS, averageFPS, frameTimeBufferMS;
let attractVehicleSpawnTimer;
let paused;
let checkpointTimeLeft, startCountdown, startCountdownTimer, gameOverTimer, nextCheckpointDistance;

///////////////////////////////
// game variables

let cameraPos, cameraRot, cameraOffset, cameraTrackInfo;
let worldHeading, mouseControl;
let track, vehicles, playerVehicle;

///////////////////////////////

function gameInit()
{
    if (quickStart)
        attractMode = 0;

    debug && debugInit();
    glInit();
    
    const styleBody = 'background-color:#111;margin:0';
    const styleCanvas = 'position:absolute;' +             // position
        'top:50%;left:50%;transform:translate(-50%,-50%);' + // center
        (pixelate?' image-rendering: pixelated':'');

    document.body.style = styleBody;
    document.body.appendChild(mainCanvas = document.createElement('canvas'));
    mainContext = mainCanvas.getContext('2d');
    mainContext.imageSmoothingEnabled = !pixelate;
    glContext.imageSmoothingEnabled = !pixelate;
    glCanvas.style.cssText = mainCanvas.style.cssText = styleCanvas;

    drawInit();
    inputInit();
    initSounds()
    initGenerative();
    initHUD();
    buildTrack();
    gameStart();
    gameUpdate();
}

function gameStart()
{
    attractVehicleSpawnTimer = time = frame = frameTimeLastMS = averageFPS = frameTimeBufferMS = 
        worldHeading = cameraOffset = checkpointTimeLeft = 0;
    startCountdown = quickStart ? 0 : 4;
    checkpointTimeLeft = startCheckpointTime;
    nextCheckpointDistance = checkpointDistance;
    startCountdownTimer = new Timer;
    gameOverTimer = new Timer;
    cameraPos = vec3();
    cameraRot = vec3();
    vehicles = [];
    playerVehicle = new PlayerVehicle(2e3, hsl(0,.8,.5));
    vehicles.push(playerVehicle);

    for(let i = 10; i--;)
        vehicles.push(new Vehicle(5e3*i+3e3, hsl(rand(),.8,.5)));
}

function gameUpdateInternal()
{
    if (attractMode)
    {
        // update attract mode
        if (vehicles.length < 10 && attractVehicleSpawnTimer-- < 0)
        {
            vehicles.push(new Vehicle(playerVehicle.pos.z-1e3, hsl(rand(),.8,.5)));
            attractVehicleSpawnTimer = randInt(100,300);
        }
        if (mouseWasPressed(0))
        {
            attractMode = 0;
            sound_start.play();
            gameStart();
        }
    }
    else
    {
        if (startCountdown > 0 && !startCountdownTimer.active())
        {
            --startCountdown;
            speak(startCountdown || 'GO!' );
            startCountdownTimer.set(1);
        }
        
        if (keyWasPressed('Escape'))
        {
            attractMode = 1;
            sound_start.play();
            gameStart();
        }

        if (gameOverTimer > 1 && mouseWasPressed(0) || gameOverTimer > 9)
        {
            attractMode = 1;
            gameStart();
        }

        if (checkpointTimeLeft > 0 && startCountdown == 0)
        {
            checkpointTimeLeft -= timeDelta;
            if (checkpointTimeLeft <= 0)
            {
                speak('GAME OVER');
                gameOverTimer.set();
                checkpointTimeLeft = 0;
            }
        }
    }

    if (keyWasPressed('KeyR'))
    {
        attractMode = 0;
        sound_start.play();
        gameStart();
    }
    
    for(const v of vehicles)
        v.update();
}

function gameUpdate(frameTimeMS=0)
{
    if (canvasFixedSize)
    {
        // clear canvas and set fixed size
        mainCanvas.width  = mainCanvasSize.x;
        mainCanvas.height = mainCanvasSize.y;
    }
    else
    {
        mainCanvasSize = vec3(innerWidth, innerHeight);
        if (pixelate)
        {
            const s = 2;
            mainCanvasSize.x = mainCanvasSize.x / s | 0;
            mainCanvasSize.y = mainCanvasSize.y / s | 0;
        }

        mainCanvas.width  = mainCanvasSize.x;
        mainCanvas.height = mainCanvasSize.y;
    }
        
    // fit to window by adding space on top or bottom if necessary
    const aspect = innerWidth / innerHeight;
    const fixedAspect = mainCanvas.width / mainCanvas.height;
    mainCanvas.style.width  = glCanvas.style.width  = aspect < fixedAspect ? '100%' : '';
    mainCanvas.style.height = glCanvas.style.height = aspect < fixedAspect ? '' : '100%';

    // update time keeping
    let frameTimeDeltaMS = frameTimeMS - frameTimeLastMS;
    frameTimeLastMS = frameTimeMS;
    const debugSpeedUp   = debug && keyIsDown('Equal'); // +
    const debugSpeedDown = debug && keyIsDown('Minus'); // -
    if (debug) // +/- to speed/slow time
        frameTimeDeltaMS *= debugSpeedUp ? 5 : debugSpeedDown ? .2 : 1;
    averageFPS = lerp(.05, averageFPS, 1e3/(frameTimeDeltaMS||1));
    frameTimeBufferMS += paused ? 0 : frameTimeDeltaMS;
    frameTimeBufferMS = min(frameTimeBufferMS, 50); // clamp in case of slow framerate

    // apply time delta smoothing, improves smoothness of framerate in some browsers
    let deltaSmooth = 0;
    if (frameTimeBufferMS < 0 && frameTimeBufferMS > -9)
    {
        // force an update each frame if time is close enough (not just a fast refresh rate)
        deltaSmooth = frameTimeBufferMS;
        frameTimeBufferMS = 0;
    }
    
    // update multiple frames if necessary in case of slow framerate
    inputUpdate();
    for (;frameTimeBufferMS >= 0; frameTimeBufferMS -= 1e3 / frameRate)
    {
        // increment frame and update time
        time = frame++ / frameRate;
        gameUpdateInternal();
    }

    // add the time smoothing back in
    frameTimeBufferMS += deltaSmooth;

    trackPreRender();
    glPreRender();
    drawScene();
    drawHUD();
    drawDebug();
    inputUpdatePost();
    requestAnimationFrame(gameUpdate);
}

gameInit();