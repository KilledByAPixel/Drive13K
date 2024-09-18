'use strict';

function trackPreUpdate()
{
    // calcuate track x offsets and projections (iterate in reverse)
    const cameraTrackInfo = new TrackSegmentInfo(cameraOffset);
    const cameraTrackSegment = cameraTrackInfo.segmentIndex;
    const cameraTrackSegmentPercent = cameraTrackInfo.percent;
    const turnScale = 2;
    let x, v, i;
    for(x = v = i = 0; i < drawDistance; ++i)
    {
        const j = cameraTrackSegment+i;
        if (!track[j])
            continue;

        // create track world position
        const s = i < 1 ? 1-cameraTrackSegmentPercent : 1;
        track[j].pos = track[j].offset.copy();
        track[j].pos.x = x += v += turnScale*s*track[j].pos.x;
        track[j].pos.z -= cameraOffset;
    }
}

function drawRoad(zwrite = 0)
{
    glSetDepthTest(zwrite,zwrite);
    
    // draw the road segments
    const drawLineDistance = 500;
    const cameraTrackInfo = new TrackSegmentInfo(cameraOffset);
    const cameraTrackSegment = cameraTrackInfo.segmentIndex;
    for(let i = drawDistance, segment1, segment2; i--; )
    {
        const segmentIndex = cameraTrackSegment+i;
        segment1 = track[segmentIndex];    
        if (!segment1 || !segment2)
        {
            segment2 = segment1;
            continue;
        }

        const p1 = segment1.pos;
        const p2 = segment2.pos;
        if (i % (lerp(i/drawDistance,1,8)|0)) // fade in road resolution
            continue;
            
        const normals = [segment1.normal, segment1.normal, segment2.normal, segment2.normal];
        function pushRoadVerts(width, color, offset=0, width2=width, offset2=offset)
        {
            const point1a = vec3(p1.x+width+offset, p1.y, p1.z);
            const point1b = vec3(p1.x-width+offset, p1.y, p1.z);
            const point2a = vec3(p2.x+width2+offset2, p2.y, p2.z);
            const point2b = vec3(p2.x-width2+offset2, p2.y, p2.z);
            const poly = [point1a, point1b, point2a, point2b];
            color.a && glPushVertsCapped(poly, normals, color);
        }

        {
            // ground
            const color = segment1.colorGround;
            const width = 4e3+p1.z*5; // fill the width of the screen
            pushRoadVerts(width, color);
        }

        if (zwrite)
        {
            segment2 = segment1;
            continue;
        }

        {
            // road
            const color = segment1.colorRoad;
            const width = segment1.width;
            const width2 = segment2.width;
            pushRoadVerts(width, color, undefined, width2);
        }

        if (i < drawLineDistance)
        {
            // lines on road
            const w = segment1.width;
            const lineBias = .2
            const laneCount = 2*w/laneWidth - lineBias;
            for(let j=1; j<laneCount; ++j)
            {
                const color = segment1.colorLine;
                const lineWidth = 30;
                const offset = j*laneWidth-segment1.width;
                const offset2 = j*laneWidth-segment2.width;
                pushRoadVerts(lineWidth, color, offset, undefined, offset2);
            }
        }
        
        segment2 = segment1;
    }

    glRender();
    glSetDepthTest();
}

function drawTrackScenery()
{
    // this is last pass from back to front so do do not write to depth
    glSetDepthTest(1, 0);
    glEnableLighting = 0;

    const cameraTrackInfo = new TrackSegmentInfo(cameraOffset);
    const cameraTrackSegment = cameraTrackInfo.segmentIndex;
    for(let i=drawDistance; i--; )
    {
        const segmentIndex = cameraTrackSegment+i;
        const trackSegment = track[segmentIndex];    
        if (!trackSegment)
            continue;

        // draw objets for this segment
        random.setSeed(trackSeed+segmentIndex);
        for(const trackObject of trackSegment.trackObjects)
            trackObject.draw();

        // random scenery
        const levelInfo = getLevelInfo(trackSegment.level);
        const w = trackSegment.width;
        if (!trackSegment.sideStreet) // no sprites on side streets
        for(let k=3;k--;)
        {
            const trackSpriteSide = (segmentIndex+k)%2 ? 1 : -1;
            if (trackSpriteSide == levelInfo.waterSide)
            {
                // water
                const sprite = trackSprites.water;
                const s = sprite.size*sprite.getRandomSpriteScale();
                const o2 = w+random.float(12e3,8e4);
                const o = trackSpriteSide * o2;
                // get taller in distance to cover horizon
                const h = .4;
                const wave = time-segmentIndex/70;
                const p = trackSegment.pos.add(vec3(o+2e3*Math.sin(wave),0));
                const waveWind = 9*Math.cos(wave); // fake wind to make wave seam more alive
                pushTrackObject(p, vec3(trackSpriteSide*s,s*h,s), WHITE, sprite, waveWind);
            }
            else
            {
                // lerp in next level scenery at end
                const levelFloat = trackSegment.offset.z/checkpointDistance;
                const levelInfoNext = getLevelInfo(levelFloat+1);
                const levelLerpPercent = percent(levelFloat%1, 1-levelLerpRange, 1);
                const sceneryLevelInfo = random.bool(levelLerpPercent) ? levelInfoNext : levelInfo;
                
                // scenery on far side like grass and flowers
                const sceneryList = sceneryLevelInfo.scenery;
                const sceneryListBias = sceneryLevelInfo.sceneryListBias;
                if (sceneryLevelInfo.scenery)
                {
                    const sprite = random.fromList(sceneryList,sceneryListBias);
                    const s = sprite.size*sprite.getRandomSpriteScale();

                    // push farther away if big collision
                    const xm = w+sprite.size+8*sprite.collideScale*s; 
                    const o = trackSpriteSide * random.float(xm,3e4);
                    const p = trackSegment.pos.add(vec3(o,0));
                    const wind = trackSegment.getWind();
                    const color = sprite.getRandomSpriteColor();
                    const scale = vec3(s);
                    if (sprite.canMirror && random.bool())
                        scale.x *= -1;
                    pushTrackObject(p, scale, color, sprite, wind);
                }
            }
        }
    }

    glRender();

    // this is the final thing renderd
    //glSetDepthTest();
    //glEnableLighting = 1;
}

function drawTrack()
{
    glEnableFog = 0; // disable track fog
    drawRoad(1); // first draw just flat ground with z write
    drawRoad();  // then draw the road without z write
    glEnableFog = 1;
}

function pushTrackObject(pos, scale, color, sprite, trackWind)
 {
    if (optimizedCulling)
    {
        const cullScale = 100;
        if (cullScale*scale.y < pos.z)
            return; // cull out small sprites
        if (abs(pos.x)-abs(scale.x) > pos.z*4+2e3)
            return; // out of view
        if (pos.z < 0)
            return; // behind camera
    }

    const tilePos = sprite.tilePos;
    const spriteYOffset = scale.y*(1+sprite.spriteYOffset);
    const shadowScale = sprite.shadowScale;
    const wind = sprite.windScale * trackWind;
    const yShadowOffset = 10;

    if (shadowScale)
        pushShadow(pos.add(vec3(0,yShadowOffset)), scale.y*shadowScale, scale.y*shadowScale/6);

    // draw on top of shadow
    pushSprite(pos.add(vec3(0,spriteYOffset)), scale, color, getSpriteTile(tilePos), wind);
}

///////////////////////////////////////////////////////////////////////////////

/*function draw3DTrackScenery()
{
    const cameraTrackSegment = cameraTrackInfo.segmentIndex;
    
    // 3d scenery
    for(let i=drawDistance, segment1, segment2; i--; )
    {
        segment2 = segment1;
        const segmentIndex = cameraTrackSegment+i;
        segment1 = track[segmentIndex];    
        if (!segment1 || !segment2)
            continue;

        if (segmentIndex%7)
            continue

        const d = segment1.pos.subtract(segment2.pos);
        const heading = PI-Math.atan2(d.x, d.z);

        // random scenery
        random.setSeed(trackSeed+segmentIndex);
        const w = segment1.width;
        const o =(segmentIndex%2?1:-1)*(random.float(5e4,1e5))
        const r = vec3(0,-heading,0);
        const p = segment1.pos.add(vec3(-o,0));

        const s = vec3(random.float(500,1e3),random.float(1e3,4e3),random.float(500,1e3));
        //const s = vec3(500,random.float(2e3,2e4),500);
        const m4 = buildMatrix(p,r,s);
        const c = hsl(0,0,random.float(.2,1));
        cubeMesh.render(m4, c);
    }
}
*/