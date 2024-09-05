'use strict';

let debug=1, downloadLink, debugMesh, debugTile, debugTakeScreenshot;
let showMap=0, debugGenerativeCanvas=0, debugInfo=1;

onerror=(event, source, lineno, colno, error)=>
{ 
    document.body.innerHTML = '<pre style="color:red;font-size:20px;">'+
        event + '\n' + source + '\n' + 'Ln ' + lineno + ', Col ' + colno; 
}

function ASSERT(assert, output) 
{ output ? console.assert(assert, output) : console.assert(assert); }

function LOG() { console.log(...arguments); }

function debugInit()
{
    // create link for saving screenshots
    document.body.appendChild(downloadLink = document.createElement('a'));
    downloadLink.style.display = 'none';
}

function drawDebug()
{
    if (debugInfo)
        drawHUDText('fps: ' + (averageFPS|0) + ' draws: ' + glDrawCalls, vec3(.8,.05), .04);

    const c = mainCanvas;
    const context = mainContext;

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
        context.drawImage(generativeCanvas, 0, 0, s, s);
       // context.strokeRect(0, 0, s, s);
    }

    if (debugTakeScreenshot)
    {
        debugTakeScreenshot = 0;
        mainContext.fillStyle = '#000';
        mainContext.fillRect(0,0,mainCanvas.width,mainCanvas.height);
        mainContext.drawImage(glCanvas, 0, 0);
        debugSaveCanvas(mainCanvas);
    }

    {
        // test render
        //debugMesh = cylinderMesh;
        debugMesh && debugMesh.render(buildMatrix(cameraPos.add(vec3(0,400,1000)), vec3(0,time,0), vec3(200)), WHITE); 

        //debugTile = vec3(0,1)
        if (debugTile)
        {
            const s = 256, w = generativeTileSize, v = debugTile.scale(w);
            const x = mainCanvas.width/2-s/2;
            context.fillStyle = '#555';
            context.fillRect(x, 0, s, s);
            context.drawImage(generativeCanvas, v.x, v.y, w, w, x, 0, s, s);
            context.strokeRect(x, 0, s, s);
            //pushTrackSprite(cameraPos.add(vec3(0,0,100)), vec3(100), WHITE, debugTile);  
        }
    }

    {
        // world cube
        //const r = vec3(0,-worldHeading,0);
        //const m1 = buildMatrix(vec3(0,1e3,2e3), r, vec3(200));
        //cubeMesh.render(m1, hsl(0,.8,.5)); 
    }

    //cubeMesh.render(buildMatrix(vec3(0,-500,0), vec3(0), vec3(1e5,10,1e5)), RED);   // ground
    //cylinderMesh.render(buildMatrix(cameraPos.add(vec3(0,400,1000)), vec3(time,time/2,time/3), vec3(200)), WHITE);   
    //let t = new Tile(vec3(64*2,0), vec3(128));
    //pushSprite(cameraPos.add(vec3(0,400,1000)), vec3(200), WHITE, t); 

    glRender();
}

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