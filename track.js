'use strict';

function trackPreRender()
{
    // update camera
    cameraOffset = playerVehicle.pos.z - cameraPlayerOffset.z;
    cameraTrackInfo = new TrackSegmentInfo(cameraOffset);
    worldHeading += .00005*cameraTrackInfo.offset.x*playerVehicle.velocity.z;

    if (attractMode)
        cameraPos.y = cameraTrackInfo.offset.y + 1e3;
    else
        cameraPos.y = cameraTrackInfo.offset.y + cameraPlayerOffset.y;

    cameraRot.x = cameraTrackInfo.pitch/2;
    cameraPos.x = playerVehicle.pos.x*.7;

    // track settings
    lightDirection = vec3(0,4,-1).rotateY(worldHeading).normalize()
    lightColor = hsl(0,1,1);
    ambientColor = hsl(.7,.1,.2);
    fogColor = hsl(.6,1,.7);

    // calcuate track x offsets and projections (iterate in reverse)
    const cameraTrackSegment = cameraTrackInfo.segment;
    const cameraTrackSegmentPercent = cameraTrackInfo.percent;
    const turnScale = 2;
    let x, v, i;
    for(x = v = i = 0; i < drawDistance+1; ++i)
    {
        const j = cameraTrackSegment+i;
        if (!track[j])
            break;

        // create track world position
        const s = i < 1 ? 1-cameraTrackSegmentPercent : 1;
        track[j].pos = track[j].offset.copy();
        track[j].pos.x = x+=v+=turnScale*s*track[j].pos.x;
        track[j].pos.z -= cameraOffset;
    }
}

function drawRoad(zwrite = 0)
{
    glSetDepthTest(zwrite,zwrite);
    
    // draw the road segments
    const cameraTrackSegment = cameraTrackInfo.segment;
    for(let i = drawDistance, segment2; i--; )
    {
        const segmentIndex = cameraTrackSegment+i;
        const segment1 = track[segmentIndex];    
        if (!segment1 || !segment2)
        {
            segment2 = segment1
            continue;
        }

        const p1 = segment1.pos;
        const p2 = segment2.pos;
        if (i % (lerp(i/drawDistance,1,6)|0) == 0) // fade in road resolution
        {
            const normals = [segment1.normal, segment1.normal, segment2.normal, segment2.normal];
            for(let pass=0; pass < (zwrite ? 1 : 3); ++pass)
            {
                let color, offset;
                if (pass == 0)
                {
                    // ground
                    color = segment1.colorGround;
                    offset = p1.z*20; // fill the screen
                }
                else if (pass == 1)
                {
                    // road
                    color = segment1.colorRoad;
                    offset = segment1.width;
                }
                else if (pass == 2)
                {
                    // stripe
                    color = segment1.colorLine;
                    offset = 30;
                }

                const point1a = vec3(p1.x+offset, p1.y, p1.z);
                const point1b = vec3(p1.x-offset, p1.y, p1.z);
                const point2a = vec3(p2.x+offset, p2.y, p2.z);
                const point2b = vec3(p2.x-offset, p2.y, p2.z);
                const poly = [point1a, point1b, point2a, point2b];
                color.a && glPushPoints(poly, normals, color, 0, 1);
            }
            segment2 = segment1;
        }
    }

    glRender();
    glSetDepthTest();
}

function drawScenery()
{
    glSetDepthTest(1,0);
    glPolygonOffset(100);
    
    const cameraTrackSegment = cameraTrackInfo.segment;
    for(let i = sceneryDrawDistance; i--; )
    {
        const segmentIndex = cameraTrackSegment+i;
        const trackSegment = track[segmentIndex];    
        if (!trackSegment)
            continue;

        // random scenery
        random.setSeed(segmentIndex);
        const w = trackSegment.width;
        for(let i=5;i--;)
        {
            const m = random.sign();
            const s = random.float(300, 600);
            const o = random.floatSign(w+300,5e4);
            const p = trackSegment.pos.add(vec3(o,0,0));
            pushTrackSprite(p, vec3(s*m,s,s), hsl(random.float(.1,.15),1,.5), vec3(1,1));
        }

        // collidable sprites
        for(const sprite of trackSegment.sprites)
            sprite.draw(trackSegment);
    }

    glRender();
    glSetDepthTest();
    glPolygonOffset(0);
}

function drawTrack()
{
    drawRoad(1); // first draw just flat ground with z write
    drawRoad();  // then draw the road without z write
}

function pushTrackSprite(pos, scale, color, tilePos)
{
    const offset = 20; // offset from the ground
    pushShadow(pos.add(vec3(0,offset)), scale.y, scale.y*.2);
    pushSprite(pos.add(vec3(0,offset+scale.y)), scale, color, getGenerativeTile(tilePos));
}

///////////////////////////////////////////////////////////////////////////////

class TrackSegmentInfo
{
    constructor(z)
    {
        const segment = this.segment = z/trackSegmentLength|0;
        const percent = this.percent = z/trackSegmentLength%1;
        if (track[segment] && track[segment+1])
        {
            if (track[segment].pos && track[segment+1].pos)
                this.pos = track[segment].pos.lerp(track[segment+1].pos, percent);
            else
                this.pos = vec3(0,0,z);
            this.offset = track[segment].offset.lerp(track[segment+1].offset, percent);
            this.pitch = lerp(percent, track[segment].pitch, track[segment+1].pitch);
            this.width = lerp(percent, track[segment].width, track[segment+1].width);
        }
        else
        {
            this.offset = this.pos = vec3(0,0,z);
            this.pitch = 0;
            this.width = trackWidth;
        }
    }
}

class TrackSprite
{
    constructor(offset, scale, color, tilePos, collideSize=60)
    {
        this.offset = offset;
        this.scale = scale;
        this.color = color;
        this.tilePos = tilePos;
        this.collideSize = collideSize;
    }

    draw(trackSegment)
    {
        const pos = trackSegment.pos.add(this.offset);
        pushTrackSprite(pos, this.scale, this.color, this.tilePos);
    }
}

class TrackSegment
{
    constructor(segmentIndex,offset,width)
    {
        this.offset = offset;
        this.width = width;
        this.pitch = 0;
        this.normal = vec3(0,1);
        this.sprites = [];
        
        const previous = track[segmentIndex-1];
        if (previous)
        {
            this.pitch = Math.atan2(previous.offset.y-offset.y, trackSegmentLength);
            const v = vec3(0,offset.y-previous.offset.y, trackSegmentLength);
            this.normal = v.cross(vec3(1,0)).normalize();
        }

        let checkpointLine = segmentIndex > 25 && segmentIndex < 30;
        if (segmentIndex%checkpointTrackSegments < 5)
            checkpointLine = 1;
        {
            // setup colors
            const largeSegmentIndex = segmentIndex/6|0;
            const stripe = largeSegmentIndex% 2 ? .1: 0;
            this.colorGround = hsl(.083, .2, .7 + Math.cos(segmentIndex*2/PI)*.05);
            this.colorRoad = hsl(0, 0, stripe ? .6 : .55);
            if (checkpointLine)
                this.colorRoad = WHITE; // starting line
            this.colorLine = hsl(0,0,1,stripe?1:0);
        }

        // spawn sprites
        const addSprite = (...a)=>this.sprites.push(new TrackSprite(...a));
        if (segmentIndex%checkpointTrackSegments == 0) // checkpoint
        {
            addSprite(vec3(-width+100,0), vec3(800), WHITE, vec3(6,0), 0);
            addSprite(vec3(width-100,0), vec3(800), WHITE, vec3(7,0), 0);
        }
        if (segmentIndex == 30) // start
            addSprite(vec3(0,-700,0), vec3(1300), WHITE, vec3(5,0), 0);
        else
        {
            let s = random.float(1e3, 1400);
            let sideTree = segmentIndex%13 == 0;
            let m = segmentIndex%2 ? 1 : -1;
            let m2 = sideTree ? m : random.sign();
            let o = (width+(sideTree?500:random.float(2e5)))*m2;
            let offset = vec3(o,0,0);

            if (random.bool(.01))
            {
                // billboard
                offset = vec3((width+700)*random.sign(),0,0)
                addSprite(offset, vec3(400), hsl(0,0,random.float(.9,1)), vec3(random.int(8),2));
            }
            else
            {
                addSprite(offset, vec3(s*m,s,s), hsl(0,0,random.float(.9,1)), vec3(0,1));
            }
        }
    }
}

function buildTrack()
{
    /////////////////////////////////////////////////////////////////////////////////////
    // build the road with procedural generation
    /////////////////////////////////////////////////////////////////////////////////////

    // set random seed & time
    let roadGenSectionDistanceMax = 0;
    let roadGenWidth = trackWidth;
    let roadGenSectionDistance = 0;
    let roadGenTaper = 0;
    let roadGenWaveFrequencyX = 0;
    let roadGenWaveFrequencyY = 0;
    let roadGenWaveScaleX = 0;
    let roadGenWaveScaleY = 0;
    random.setSeed(5123);
    track = []; 
    
    // generate the road
    for(let i = 0; i < trackEnd + 3e3 + drawDistance; ++i)
    {
        if (roadGenSectionDistance++ > roadGenSectionDistanceMax)
        {
            // calculate difficulty percent
            const difficulty =1; Math.min(1, i*trackSegmentLength/checkpointDistance/checkpointMaxDifficulty);
            
            // randomize road settings
            roadGenWidth = trackWidth//*random.float(1-difficulty*.7, 3-2*difficulty);
            roadGenWaveFrequencyX = random.float(lerp(difficulty, .01, .03));
            roadGenWaveFrequencyY = random.float(lerp(difficulty, .01, .1));
            roadGenWaveScaleX = i > trackEnd ? 0 : random.float(lerp(difficulty, .2, .8));
            roadGenWaveScaleY = random.float(5,lerp(difficulty, 10, 40));
            
            // apply taper and move back
            roadGenTaper = random.float(99, 1e3)|0;
            roadGenSectionDistanceMax = roadGenTaper + random.float(99, 1e3);
            i -= roadGenTaper;
            roadGenSectionDistance = 0;
        }
        
        // make wavy hills
        let x = Math.sin(i*roadGenWaveFrequencyX) * roadGenWaveScaleX;
        let ys = min(2e3,10/roadGenWaveFrequencyY);
        let y = ys * Math.sin(i*roadGenWaveFrequencyY);
        let z = i*trackSegmentLength;
        let o = vec3(x,y,z);
        let w = i > trackEnd ? 0 : roadGenWidth;
        let t = track[i];
        if (t)
        {
            // lerp in taper
            const p = clamp(roadGenSectionDistance / roadGenTaper, 0, 1);
            o = t.offset.lerp(o, p);
            w = lerp(p, t.width, w);
        }

        if (i<0)
            continue;

        // make the road gen segment
        track[i] = new TrackSegment(i, o, w);
    }
}