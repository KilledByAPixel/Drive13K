'use strict';

const debug = 1;
let enhancedMode = 1;
let enableAsserts = 1;
let devMode = 0;
let downloadLink, debugMesh, debugTile, debugCapture, debugCanvas;
let debugGenerativeCanvas=0, debugInfo=0, debugSkipped=0;
let debugGenerativeCanvasCached, showMap;
let freeCamPos, freeCamRot, mouseDelta;
const js13kBuildLevel2 = 0; // more space is needed for js13k

function ASSERT(assert, output) 
{ enableAsserts&&(output ? console.assert(assert, output) : console.assert(assert)); }
function LOG() { console.log(...arguments); }

///////////////////////////////////////////////////////////////////////////////

function debugInit()
{
    freeCamPos = vec3();
    freeCamRot = vec3();
    mouseDelta = vec3();
    debugCanvas = document.createElement('canvas');
    downloadLink = document.createElement('a');
}
function debugUpdate()
{
    if (!devMode)
        return;

    if (keyWasPressed('KeyG')) // free Cam
    {
        freeCamMode = !freeCamMode;
        if (!freeCamMode)
        {
            document.exitPointerLock();
            cameraPos = vec3();
            cameraRot = vec3();
        }
    }
    if (freeCamMode)
    {
        if (!document.pointerLockElement)
        {
            mainCanvas.requestPointerLock();
            freeCamPos = cameraPos.copy();
            freeCamRot = cameraRot.copy();
        }

        const input = vec3(
            keyIsDown('KeyD') - keyIsDown('KeyA'),
            keyIsDown('KeyE') - keyIsDown('KeyQ'),
            keyIsDown('KeyW') - keyIsDown('KeyS'));

        const moveSpeed = keyIsDown('ShiftLeft') ? 500 : 100;
        const turnSpeed = 2;
        const moveDirection = input.rotateX(freeCamRot.x).rotateY(-freeCamRot.y);
        freeCamPos = freeCamPos.add(moveDirection.scale(moveSpeed));
        freeCamRot = freeCamRot.add(vec3(mouseDelta.y,mouseDelta.x).scale(turnSpeed));
        freeCamRot.x = clamp(freeCamRot.x, -PI/2, PI/2);
        mouseDelta = vec3();
    }

    if (keyWasPressed('Digit1') || keyWasPressed('Digit2'))
    {
        const d = keyWasPressed('Digit2') ? 1 : -1;
        playerVehicle.pos.z += d * checkpointDistance;
        playerVehicle.pos.z = max(playerVehicle.pos.z, 0);
        checkpointTimeLeft = 40;
        debugSkipped = 1;
    }
    if (keyIsDown('Digit3') || keyIsDown('Digit4'))
    {
        const v = keyIsDown('Digit4') ? 1e3 : -1e3;
        playerVehicle.pos.z += v;
        playerVehicle.pos.z = max(playerVehicle.pos.z, 0);

        const trackInfo = new TrackSegmentInfo(playerVehicle.pos.z);
        playerVehicle.pos.y = trackInfo.offset.y;
        playerVehicle.pos.x = 0;
            
        // update world heading based on speed and track turn
        const cameraTrackInfo = new TrackSegmentInfo(cameraOffset);
        worldHeading += v*cameraTrackInfo.offset.x/turnWorldScale;
        debugSkipped = 1;
    }
    if (keyWasPressed('Digit5'))
        checkpointTimeLeft=12
    if (keyWasPressed('Digit6'))
    {
        // randomize track
        trackSeed = randInt(1e9);
        
        //initGenerative();
        const endLevel = levelInfoList.pop();
        shuffle(endLevel.scenery);
        shuffle(levelInfoList);
        for(let i=levelInfoList.length; i--;)
        {
            const info = levelInfoList[i];
            info.level = i;
            info.randomize();
        }
        levelInfoList.push(endLevel);
        buildTrack();

        for(const s in spriteList)
        {
           const sprite = spriteList[s];
            if (sprite instanceof GameSprite)
                sprite.randomize();
        }

        const playerTrackInfo = new TrackSegmentInfo(playerVehicle.pos.z);
        playerVehicle.pos.y = playerTrackInfo.offset.y;
        //gameStart();
    }
    if (keyWasPressed('Digit7'))
        debugGenerativeCanvas = !debugGenerativeCanvas;
    if (keyWasPressed('Digit0'))
        debugCapture = 1;
    if (keyWasPressed('KeyQ') && !freeCamMode)
        testDrive = !testDrive
    if (keyWasPressed('KeyU'))
        sound_win.play();
    if (debug && keyWasPressed('KeyV'))
        spawnVehicle(playerVehicle.pos.z-1300)
    //if (!document.hasFocus())
    //    testDrive = 1;
}

function debugDraw()
{
    if (!debug)
        return;

    if (debugInfo && !debugCapture)
        drawHUDText((averageFPS|0) + 'fps / ' + glBatchCountTotal + ' / ' + glDrawCalls + ' / ' + vehicles.length, vec3(.98,.12),.03, undefined, 'monospace','right');

    const c = mainCanvas;
    const context = mainContext;

    if (testDrive && !titleScreenMode && !freeRide)
        drawHUDText('AUTO', vec3(.5,.95),.05,RED);

    if (showMap)
    {
        // draw track map preview
        context.save();
        context.beginPath();
        for(let k=2;k--;)
        {
            let x=0, v=0;
            let p = vec3();
            let d = vec3(0,-.5);
            for(let i=0; i < 1e3; i++)
            {   
                let j = playerVehicle.pos.z/trackSegmentLength+i-100|0;
                if (!track[j])
                    continue;

                const t = track[j];
                const o = t.offset;
                v += o.x;
                p = p.add(d.rotateZ(v*.005));
                if (j%5==0)
                {
                    let y = o.y;
                    let w = t.width/199;
                    const h = k ? 5 : -y*.01;
                    context.fillStyle=hsl(y*.0001,1,k?0:.5,k?.5:1);
                    context.fillRect(c.width-200+p.x,c.height-100+p.y+h,w,w);
                    //context.fillRect(c.width-200+x/199,c.height-100-i/2+o,w,w);
                }
            }
        }
        context.restore();
    }

    if (debugGenerativeCanvas)
    {
        const s = 512;
        //context.imageSmoothingEnabled = false;
        context.drawImage(debugGenerativeCanvasCached, 0, 0, s, s);
       // context.strokeRect(0, 0, s, s);
    }

    if (debugCapture)
    {
        debugCapture = 0;
        const context = debugCanvas.getContext('2d');
        debugCanvas.width = mainCanvas.width;
        debugCanvas.height = mainCanvas.height;
        context.fillStyle = '#000';
        context.fillRect(0,0,mainCanvas.width,mainCanvas.height);
        context.drawImage(glCanvas, 0, 0);
        context.drawImage(mainCanvas, 0, 0);
        debugSaveCanvas(debugCanvas);
    }

    {
        // test render
        //debugMesh = cylinderMesh;
        debugMesh && debugMesh.render(buildMatrix(cameraPos.add(vec3(0,400,1000)), vec3(0,time,0), vec3(200)), WHITE); 

        //debugTile = vec3(0,1)
        if (debugTile)
        {
            const s = 256*2, w = generativeTileSize, v = debugTile.scale(w);
            const x = mainCanvas.width/2-s/2;
            context.fillStyle = '#5f5';
            context.fillRect(x, 0, s, s);
            context.drawImage(debugGenerativeCanvasCached, v.x, v.y, w, w, x, 0, s, s);
            context.strokeRect(x, 0, s, s);
            //pushTrackObject(cameraPos.add(vec3(0,0,100)), vec3(100), WHITE, debugTile);  
        }
    }

    if (0) // world cube
    {
        const r = vec3(0,-worldHeading,0);
        const m1 = buildMatrix(vec3(2220,1e3,2e3), r, vec3(200));
        cubeMesh.render(m1, hsl(0,.8,.5)); 
    }

    if (0)
    {
        // test noise
        context.fillStyle = '#fff';
        context.fillRect(0, 0, 500, 500);
        context.fillStyle = '#000';
        for(let i=0; i < 1e3; i++)
        {
            const n = noise1D(i/129-time*9)*99;
            context.fillRect(i, 200+n, 9, 9);
        }
    }

    //cubeMesh.render(buildMatrix(vec3(0,-500,0), vec3(0), vec3(1e5,10,1e5)), RED);   // ground
    //cylinderMesh.render(buildMatrix(cameraPos.add(vec3(0,400,1000)), vec3(time,time/2,time/3), vec3(200)), WHITE);   
    //let t = new Tile(vec3(64*2,0), vec3(128));
    //pushSprite(cameraPos.add(vec3(0,400,1000)), vec3(200), WHITE, t); 

    glRender();
}

///////////////////////////////////////////////////////////////////////////////

function debugSaveCanvas(canvas, filename='screenshot', type='image/png')
{ debugSaveDataURL(canvas.toDataURL(type), filename); }

function debugSaveText(text, filename='text', type='text/plain')
{ debugSaveDataURL(URL.createObjectURL(new Blob([text], {'type':type})), filename); }

function debugSaveDataURL(dataURL, filename)
{
    downloadLink.download = filename;
    downloadLink.href = dataURL;
    downloadLink.click();
}