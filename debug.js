'use strict';

let debug=1, downloadLink, debugMesh, debugTile, debugCapture, debugCanvas;
let showMap=0, debugGenerativeCanvas=0, debugInfo=1, debugSkipped=0;
let debugGenerativeCanvasCached;

function ASSERT(assert, output) 
{ output ? console.assert(assert, output) : console.assert(assert); }
function LOG() { console.log(...arguments); }

///////////////////////////////////////////////////////////////////////////////

function debugInit()
{
    debugCanvas = document.createElement('canvas');
    downloadLink = document.createElement('a');
}

function debugUpdate()
{
    if (keyWasPressed('Digit1') || keyWasPressed('Digit2'))
    {
        const d = keyWasPressed('Digit1') ? 1 : -1;
        playerVehicle.pos.z += d * checkpointDistance;
        playerVehicle.pos.z = max(playerVehicle.pos.z, 0);
        checkpointTimeLeft = 40;
        debugSkipped = 1;
    }
    if (keyIsDown('Digit3') || keyIsDown('Digit4'))
    {
        const v = keyIsDown('Digit3') ? 1e3 : -1e3;
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
        checkpointTimeLeft=1
    if (keyWasPressed('Digit6'))
    {
        // randomize track
        trackSeed = randInt(1e9);
        const endLevel = levelInfoList.pop();
        shuffle(endLevel.scenery);
        shuffle(levelInfoList);
        for(let i=levelInfoList.length; i--;)
        {
            const info = levelInfoList[i];
            info.level = i;
            shuffle(info.scenery);
            info.sceneryListBias = random.float(5,30);
        }
        levelInfoList.push(endLevel);
        buildTrack();
        gameStart();
    }
    if (keyWasPressed('Digit0'))
        debugCapture = 1;
    if (keyWasPressed('KeyI'))
        debugInfo = !debugInfo;
    if (keyWasPressed('KeyM')) // toggle mute
        soundVolume = soundVolume ? 0 : .3;
        
    if (keyWasPressed('KeyQ'))
        testDrive = !testDrive
    if (keyWasPressed('KeyE'))
    {
        //sound_win.play(1,2);
        sound_beep.play(1,4);
    }
    if (keyWasPressed('KeyR')) // restart
    {
        titleScreenMode = 0;
        sound_lose.play(1,2);
        gameStart();
    }

    if (debug && keyWasPressed('KeyV'))
        spawnVehicle(playerVehicle.pos.z-1300)
        
    //if (!document.hasFocus())
    //    testDrive = 1;
}

function debugDraw()
{
    if (debugInfo && !debugCapture)
        drawHUDText((averageFPS|0) + 'fps / ' + glBatchCountTotal + ' / ' + glDrawCalls + ' / ' + vehicles.length, vec3(.98,.12),.03, undefined, 'monospace','right');

    const c = mainCanvas;
    const context = mainContext;

    if (testDrive)
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
            for(let i=0; i < 500; i++)
            {   
                let j = playerVehicle.pos.z/trackSegmentLength+i-100|0;
                if (!track[j])
                    break;

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

function debugSaveCanvas(canvas, filename=engineName, type='image/png')
{ debugSaveDataURL(canvas.toDataURL(type), filename); }

function debugSaveText(text, filename=engineName, type='text/plain')
{ debugSaveDataURL(URL.createObjectURL(new Blob([text], {'type':type})), filename); }

function debugSaveDataURL(dataURL, filename)
{
    downloadLink.download = filename;
    downloadLink.href = dataURL;
    downloadLink.click();
}