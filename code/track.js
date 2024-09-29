'use strict';

function trackPreUpdate()
{
    // calcuate track x offsets and projections (iterate in reverse)
    const cameraTrackInfo = new TrackSegmentInfo(cameraOffset);
    const cameraTrackSegment = cameraTrackInfo.segmentIndex;
    const cameraTrackSegmentPercent = cameraTrackInfo.percent;
    const turnScale = 2;
    for(let x=0, v=0, i=0; i<drawDistance; ++i)
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

function drawTrack()
{
    glEnableFog = 0; // track looks better without fog
    drawRoad(1); // first draw just flat ground with z write
    glSetDepthTest(0,0); // disable z testing
    drawRoad();  // draw ground and road

    // set evertyhing back to normal
    glEnableFog = 1;
    glSetDepthTest();
}

function drawRoad(zwrite)
{
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

        if (i % (lerp(i/drawDistance,1,8)|0)) // fade in road resolution
            continue;
            
        const p1 = segment1.pos;
        const p2 = segment2.pos;
        const normals = [segment1.normal, segment1.normal, segment2.normal, segment2.normal];
        function pushRoadVerts(width, color, offset=0, width2=width, offset2=offset, oy=0)
        {
            const point1a = vec3(p1.x+width+offset, p1.y+oy, p1.z);
            const point1b = vec3(p1.x-width+offset, p1.y+oy, p1.z);
            const point2a = vec3(p2.x+width2+offset2, p2.y+oy, p2.z);
            const point2b = vec3(p2.x-width2+offset2, p2.y+oy, p2.z);
            const poly = [point1a, point1b, point2a, point2b];
            color.a && glPushVertsCapped(poly, normals, color);
        }

        {
            // ground
            const color = segment1.colorGround;
            const width = 1e5; // fill the width of the screen
            pushRoadVerts(width, color);
        }

        if (!zwrite)
        {
            const roadHeight = 10;
            
            // road
            const color = segment1.colorRoad;
            const width = segment1.width;
            const width2 = segment2.width;
            pushRoadVerts(width, color, undefined, width2,undefined,roadHeight);

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
                    pushRoadVerts(lineWidth, color, offset, undefined, offset2,roadHeight);
                }
            }
        }
        
        segment2 = segment1;
    }

    glRender();
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
            const spriteSide = (segmentIndex+k)%2 ? 1 : -1;
            if (spriteSide == levelInfo.waterSide)
            {
                // water
                const sprite = spriteList.water;
                const s = sprite.size*sprite.getRandomSpriteScale();
                const o2 = w+random.float(12e3,8e4);
                const o = spriteSide * o2;
                // get taller in distance to cover horizon
                const h = .4;
                const wave = time-segmentIndex/70;
                const p = vec3(o+2e3*Math.sin(wave),0).addSelf(trackSegment.pos);
                const waveWind = 9*Math.cos(wave); // fake wind to make wave seam more alive
                pushTrackObject(p, vec3(spriteSide*s,s*h,s), WHITE, sprite, waveWind);
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
                    const xm = w+sprite.size+6*sprite.collideScale*s; 
                    const o = spriteSide * random.float(xm,3e4);
                    const p = vec3(o,0).addSelf(trackSegment.pos);
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

    if (!js13kBuild) // final thing rendered, so no need to reset
    {
        glSetDepthTest();
        glEnableLighting = 1;
    }
}

function pushTrackObject(pos, scale, color, sprite, trackWind)
 {
    if (optimizedCulling)
    {
        const cullScale = 200;
        if (cullScale*scale.y < pos.z)
            return; // cull out small sprites
        if (abs(pos.x)-abs(scale.x) > pos.z*4+2e3)
            return; // out of view
        if (pos.z < 0)
            return; // behind camera
    }

    const shadowScale = sprite.shadowScale;
    const wind = sprite.windScale * trackWind;
    const yShadowOffset = freeCamMode ? cameraPos.y/20 : 10; // fix shadows in free cam mode
    const spriteYOffset = scale.y*(1+sprite.spriteYOffset) + (freeCamMode?cameraPos.y/20:0);

    pos.y += yShadowOffset;
    if (shadowScale)
        pushShadow(pos, scale.y*shadowScale, scale.y*shadowScale/6);

    // draw on top of shadow
    pos.y += spriteYOffset - yShadowOffset;
    pushSprite(pos, scale, color, sprite.spriteTile, wind);
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
        const p = vec3(-o,0).addSelf(segment1.pos);

        const s = vec3(random.float(500,1e3),random.float(1e3,4e3),random.float(500,1e3));
        //const s = vec3(500,random.float(2e3,2e4),500);
        const m4 = buildMatrix(p,r,s);
        const c = hsl(0,0,random.float(.2,1));
        cubeMesh.render(m4, c);
    }
}
*/

///////////////////////////////////////////////////////////////////////////////

// an instance of a sprite
class TrackObject
{
    constructor(trackSegment, sprite, offset, color=WHITE, sizeScale=1)
    {
        this.trackSegment = trackSegment;
        this.sprite = sprite;
        this.offset = offset;
        this.color = color;

        const scale = sprite.size * sizeScale;
        this.scale = vec3(scale);
        const trackWidth = trackSegment.width;
        const trackside = offset.x < trackWidth*2 && offset.x > -trackWidth*2;
        if (trackside && sprite.trackFace)
            this.scale.x *= sign(offset.x);
        else if (sprite.canMirror && random.bool())
            this.scale.x *= -1;
        this.collideSize = sprite.collideScale*abs(scale);
    }

    draw()
    {
        const trackSegment = this.trackSegment;
        const pos = trackSegment.pos.add(this.offset);
        const wind = trackSegment.getWind();
        pushTrackObject(pos, this.scale, this.color, this.sprite, wind);
    }
}

class TrackSegment
{
    constructor(segmentIndex,offset,width)
    {
        if (segmentIndex >= levelGoal*checkpointTrackSegments)
            width = 0; // no track after end

        this.offset = offset;
        this.width = width;
        this.pitch = 0;
        this.normal = vec3();

        this.trackObjects = [];
        const levelFloat = segmentIndex/checkpointTrackSegments;
        const level = this.level = testLevelInfo ? testLevelInfo.level : levelFloat|0;
        const levelInfo = getLevelInfo(level);
        const levelInfoNext = getLevelInfo(levelFloat+1);
        const levelLerpPercent = percent(levelFloat%1, 1-levelLerpRange, 1);

        const checkpointLine = segmentIndex > 25 && segmentIndex < 30
            || segmentIndex%checkpointTrackSegments > checkpointTrackSegments-10;
        const recordPoint = bestDistance/trackSegmentLength;
        const recordPointLine = segmentIndex>>3 == recordPoint>>3;
        this.sideStreet = levelInfo.sideStreets && ((segmentIndex%checkpointTrackSegments)%495<36);

        {
            // setup colors
            const groundColor = levelInfo.groundColor.lerp(levelInfoNext.groundColor,levelLerpPercent);
            const lineColor = levelInfo.lineColor.lerp(levelInfoNext.lineColor,levelLerpPercent);
            const roadColor = levelInfo.roadColor.lerp(levelInfoNext.roadColor,levelLerpPercent);

            const largeSegmentIndex = segmentIndex/9|0;
            const stripe = largeSegmentIndex% 2 ? .1: 0;
            this.colorGround = groundColor.brighten(Math.cos(segmentIndex*2/PI)/20);
            this.colorRoad = roadColor.brighten(stripe&&.05);
            if (recordPointLine)
                this.colorRoad = hsl(0,.8,.5);
            else if (checkpointLine)
                this.colorRoad = WHITE; // starting line
            this.colorLine = lineColor;
            if (stripe)
                this.colorLine.a = 0;
            if (this.sideStreet)
                this.colorLine = this.colorGround = this.colorRoad;
        }

        // spawn track objects
        if (debug && testGameSprite)
        {
            // test sprite
            this.addSprite(testGameSprite,random.floatSign(width/2,1e4));
        }
        else if (debug && testTrackBillboards)
        {
            // test billboard
            const billboardSprite = random.fromList(spriteList.billboards);
            this.addSprite(billboardSprite,random.floatSign(width/2,1e4));
        }
        else if (segmentIndex == levelGoal*checkpointTrackSegments)
        {
            // goal!
            this.addSprite(spriteList.sign_goal);
        }
        else if (segmentIndex%checkpointTrackSegments == 0)
        {
            // checkpoint
            if (segmentIndex < levelGoal*checkpointTrackSegments)
            {
                this.addSprite(spriteList.sign_checkpoint1,-width+500);
                this.addSprite(spriteList.sign_checkpoint2, width-500);
            }
        }

        if (segmentIndex == 30)
        {
            // starting area
            this.addSprite(spriteList.sign_start);

            // left
            const ol = -(width+100);
            this.addSprite(spriteList.sign_opGames,ol,1450);
            this.addSprite(spriteList.sign_zzfx,ol,850);
            this.addSprite(spriteList.sign_avalanche,ol);
            
            // right
            const or = width+100;
            this.addSprite(spriteList.sign_frankForce,or,1500);
            this.addSprite(spriteList.sign_github,or,350);
            this.addSprite(spriteList.sign_js13k,or);
            if (js13kBuild)
                random.seed = 1055752394; // hack, reset seed for js13k
        }
    }

    getWind()
    {
        const offset = this.offset;
        const noiseScale = .001;
        return Math.sin(time+(offset.x+offset.z)*noiseScale)/2;
    }

    addSprite(sprite,x=0,y=0,extraScale=1)
    {
        // add a sprite to the track as a new track object 
        const offset = vec3(x,y);
        const sizeScale = extraScale*sprite.getRandomSpriteScale();
        const color = sprite.getRandomSpriteColor();
        const trackObject = new TrackObject(this, sprite, offset, color, sizeScale);
        this.trackObjects.push(trackObject);
    }
}

// get lerped info about a track segment
class TrackSegmentInfo
{
    constructor(z)
    {
        const segment = this.segmentIndex = z/trackSegmentLength|0;
        const percent = this.percent = z/trackSegmentLength%1;
        if (track[segment] && track[segment+1])
        {
            if (track[segment].pos && track[segment+1].pos)
                this.pos = track[segment].pos.lerp(track[segment+1].pos, percent);
            else
                this.pos = vec3(0,0,z);
            this.pitch = lerp(percent, track[segment].pitch, track[segment+1].pitch);
            this.offset = track[segment].offset.lerp(track[segment+1].offset, percent);
            this.width = lerp(percent, track[segment].width,track[segment+1].width);
        }
        else
            this.offset = this.pos = vec3(this.pitch = this.width = 0,0,z);
    }
}
