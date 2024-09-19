'use strict';

let trackSprites;
let testTrackSprite;
const testTrackBillboards=0;

function initTrackSprites()
{
    //TrackSprites
    //(tilePos, size=1e3, sizeRandomness=0, windScale=0, collideSize=60)
    trackSprites = {};

    // trees
    trackSprites.trees = [];
    trackSprites.tree_palm   = new TrackSprite(vec3(0,1),1500,.2,.1,.04);
    trackSprites.tree_oak    = new TrackSprite(vec3(1,1),2e3,.5,.06,.1);
    trackSprites.tree_stump  = new TrackSprite(vec3(2,1),1e3,.6,.04);
    trackSprites.tree_dead   = new TrackSprite(vec3(3,1),800,.3,.03,.06);
    trackSprites.tree_pink   = new TrackSprite(vec3(4,1),1500,.3,.1,.04);
    trackSprites.tree_bush   = new TrackSprite(vec3(5,1),1e3,.5,.1,.06);
    trackSprites.tree_fall   = new TrackSprite(vec3(6,1),1500,.3,.1,.1);
    //TB(trackSprites.tree_flower = new TrackSprite(vec3(7,1),2e3,.3,.05,200));
    trackSprites.tree_snow      = new TrackSprite(vec3(4,3),1300,.3,.06,.1)
    trackSprites.tree_yellow    = new TrackSprite(vec3(5,3),1e3,.3,.06,.1)
    trackSprites.tree_huge    = new TrackSprite(vec3(3,1),1e4,.5,.1,.1)
    trackSprites.tree_huge.colorHSL = vec3(.8, 0, .5);

    // must face track
    trackSprites.tree_palm.trackFace = 
    trackSprites.tree_pink.trackFace = 1;

    // smaller tree shadows
    trackSprites.tree_palm.shadowScale =
    trackSprites.tree_oak.shadowScale = 
    trackSprites.tree_stump.shadowScale = 
    trackSprites.tree_dead.shadowScale = 
    trackSprites.tree_pink.shadowScale =
    trackSprites.tree_bush.shadowScale =
    trackSprites.tree_fall.shadowScale =
    trackSprites.tree_snow.shadowScale =
    trackSprites.tree_yellow.shadowScale =
    trackSprites.tree_huge.shadowScale = .7;

    // grass and flowers
    trackSprites.grasses = [];
    trackSprites.grass_plain     = new TrackSprite(vec3(0,3),500,.5,1);
    trackSprites.grass_plain.colorHSL = vec3(.3, .4, .5);
    trackSprites.grass_dead      = new TrackSprite(vec3(0,3),600,.3,1);
    trackSprites.grass_dead.colorHSL  = vec3(.13, .6, .7);
    trackSprites.grass_flower1   = new TrackSprite(vec3(1,3),500,.3,1);
    trackSprites.grass_flower2   = new TrackSprite(vec3(2,3),500,.3,1);
    trackSprites.grass_flower3   = new TrackSprite(vec3(3,3),500,.3,1);
    trackSprites.grass_red       = new TrackSprite(vec3(0,3),700,.3,1)
    trackSprites.grass_red.colorHSL  = vec3(0, .8, .5);
    trackSprites.grass_snow      = new TrackSprite(vec3(0,3),300,.5,1)
    trackSprites.grass_snow.colorHSL  = vec3(.4, 1, .9);
    trackSprites.grass_large     = new TrackSprite(vec3(0,3),1e3,.5,1);
    trackSprites.grass_large.colorHSL = vec3(.4, .4, .5);
    //trackSprites.grass_huge     = new TrackSprite(vec3(0,3),1e4,.6,.5,5e3);
    //trackSprites.grass_huge.colorHSL = vec3(.8, .5, .5);
    //trackSprites.grass_huge.hueRandomness = .2;

    // billboards 
    trackSprites.billboards = [];
    const PB = (s)=>trackSprites.billboards.push(s);
    PB(trackSprites.sign_zzfx      = new TrackSprite(vec3(1,2),500,0,.02,.5,0));
    PB(trackSprites.sign_js13k     = new TrackSprite(vec3(0,2),600,0,.02,1,0));
    PB(trackSprites.sign_github    = new TrackSprite(vec3(2,2),750,0,.02,.5,0));
    PB(trackSprites.sign_avalanche = new TrackSprite(vec3(7,2),600,0,.02,1,0));
    PB(trackSprites.sign_harris    = new TrackSprite(vec3(4,2),300,0,.02,1,0));
    PB(trackSprites.sign_opGames   = new TrackSprite(vec3(5,2),600,0,.02,.5,0));
    trackSprites.sign_frankForce   = new TrackSprite(vec3(3,2),500,0,.02,1,0);
    //PB(trackSprites.sign_dwitter   = new TrackSprite(vec3(6,2),550,0,.02,1,0));
    
    // signs
    trackSprites.sign_turn       = new TrackSprite(vec3(0,5),500,0,.05,.5);
    trackSprites.sign_turn.trackFace = 1; // signs face track
    //trackSprites.sign_curve     = new TrackSprite(vec3(1,5),500,0,.05,.5);
    //trackSprites.sign_curve.trackFace = 1; // signs face track
    //trackSprites.sign_warning    = new TrackSprite(vec3(2,5),500,0,.05,1,0);
    //trackSprites.sign_speed      = new TrackSprite(vec3(4,5),500,0,.05,50,0);
    //trackSprites.sign_interstate = new TrackSprite(vec3(5,5),500,0,.05,50,0);

    // rocks
    trackSprites.rock_tall     = new TrackSprite(vec3(1,4),1e3,.3,0,.6,0);
    trackSprites.rock_big      = new TrackSprite(vec3(2,4),800,.2,0,.6,0);
    trackSprites.rock_huge     = new TrackSprite(vec3(1,4),5e3,.7,0,.6,0);
    trackSprites.rock_huge.colorHSL  = vec3(.08, 1, .8);
    trackSprites.rock_huge.hueRandomness = .01;
    trackSprites.rock_huge2     = new TrackSprite(vec3(2,4),8e3,.5,0,.25,0);
    trackSprites.rock_huge2.colorHSL  = vec3(.05, 1, .8);
    trackSprites.rock_huge2.hueRandomness = .01;
    trackSprites.rock_huge3     = new TrackSprite(vec3(2,4),8e3,.7,0,.5,0);
    trackSprites.rock_huge3.colorHSL  = vec3(.05, 1, .8);
    trackSprites.rock_huge3.hueRandomness = .01;
    trackSprites.rock_weird      = new TrackSprite(vec3(2,4),5e3,.5,0,1,0);
    trackSprites.rock_weird.colorHSL  = vec3(.8, 1, .8);
    trackSprites.rock_weird.hueRandomness = .2;
    trackSprites.rock_weird2     = new TrackSprite(vec3(1,4),1e3,.5,0,.5,0);
    trackSprites.rock_weird2.colorHSL  = vec3(0, 0, .2);
    trackSprites.tunnel1     = new TrackSprite(vec3(6,4),1e4,.0,0,0,0);
    trackSprites.tunnel1.colorHSL  = vec3(.05, 1, .8);
    trackSprites.tunnel1.tunnelArch = 1;
    trackSprites.tunnel2     = new TrackSprite(vec3(7,4),5e3,0,0,0,0);
    trackSprites.tunnel2.colorHSL  = vec3(0, 0, .1);
    trackSprites.tunnel2.tunnelLong = 1;
    trackSprites.tunnel2Front     = new TrackSprite(vec3(7,4),5e3,0,0,0,0);
    trackSprites.tunnel2Front.colorHSL  = vec3(0,0,.8);
    //trackSprites.tunnel2_rock         = new TrackSprite(vec3(6,6),1e4,.2,0,.5,0);
    //trackSprites.tunnel2_rock.colorHSL = vec3(.15, .5, .8);

    // hazards
    trackSprites.hazard_rocks      = new TrackSprite(vec3(3,4),1e3,.2,0,.9);
    trackSprites.hazard_sand      = new TrackSprite(vec3(4,4),1e3,.2,0,.9);
    trackSprites.hazard_rocks.isBump = 
    trackSprites.hazard_sand.isSlow = 1;
    trackSprites.hazard_rocks.spriteYOffset =
    trackSprites.hazard_sand.spriteYOffset = -.02;
    //trackSprites.hazard_snow     = new TrackSprite(vec3(6,6),500,.1,0,300,0);
    //trackSprites.hazard_snow.isSlow = 1;

    // special sprites
    trackSprites.water            = new TrackSprite(vec3(5,4),6e3,.5,1);
    trackSprites.sign_start       = new TrackSprite(vec3(5,0),2300,0,.01,0,0);
    trackSprites.sign_goal        = new TrackSprite(vec3(0,6),2300,0,.01,0,0);
    trackSprites.sign_checkpoint1 = new TrackSprite(vec3(6,0),1e3,0,.01,0,0);
    trackSprites.sign_checkpoint2 = new TrackSprite(vec3(7,0),1e3,0,.01,0,0);
    trackSprites.telephonePole    = new TrackSprite(vec3(0,4),1800,0,0,.03,0);
    //trackSprites.parts_girder  = new TrackSprite(vec3(0,6),500,0,.05,30,0);
    trackSprites.telephonePole.shadowScale = .3;
    trackSprites.grave_stone      = new TrackSprite(vec3(2,6),500,.4,.05,.5,0);
    trackSprites.grave_stone.lightnessRandomness = .5;
    trackSprites.light_tunnel      = new TrackSprite(vec3(0,0),200,0,0,0,0);

    // horizon sprites
    trackSprites.horizon_city           = new TrackSprite(vec3(3,6),0,0,0,0,1);
    trackSprites.horizon_city.hueRandomness = 
        trackSprites.horizon_city.lightnessRandomness = .1;
    trackSprites.horizon_city.colorHSL = vec3(1); // vary color

    trackSprites.horizon_islands        = new TrackSprite(vec3(7,6));
    trackSprites.horizon_islands.colorHSL = vec3(.25, .5, .6);
    trackSprites.horizon_redMountains   = new TrackSprite(vec3(7,6));
    trackSprites.horizon_redMountains.colorHSL = vec3(.05, .7, .7);
    trackSprites.horizon_brownMountains = new TrackSprite(vec3(7,6));
    trackSprites.horizon_brownMountains.colorHSL = vec3(.1, .5, .6);
    trackSprites.horizon_smallMountains = new TrackSprite(vec3(6,6));
    trackSprites.horizon_smallMountains.colorHSL = vec3(.1, .5, .6);
    trackSprites.horizon_desert         = new TrackSprite(vec3(6,6));
    trackSprites.horizon_desert.colorHSL = vec3(.15, .5, .8);
    trackSprites.horizon_snow           = new TrackSprite(vec3(7,6));
    trackSprites.horizon_snow.colorHSL  = vec3(0,0,1);
    trackSprites.horizon_graveyard      = new TrackSprite(vec3(6,6));
    trackSprites.horizon_graveyard.colorHSL = vec3(.2, .4, .8);
    trackSprites.horizon_weird          = new TrackSprite(vec3(7,6));
    trackSprites.horizon_weird.colorHSL = vec3(.7, .5, .6);

    // no mirror on horizon sprites
    trackSprites.horizon_islands.canMirror = 0;
    trackSprites.horizon_redMountains.canMirror = 0;
    trackSprites.horizon_brownMountains.canMirror = 0;
    trackSprites.horizon_smallMountains.canMirror = 0;
    trackSprites.horizon_desert.canMirror = 0;
    trackSprites.horizon_snow.canMirror = 0;
    trackSprites.horizon_graveyard.canMirror = 0;
    trackSprites.horizon_weird.canMirror = 0;

    // no shadow on these sprites
    ///trackSprites.tunnel2_rock.shadowScale = 0;
    trackSprites.light_tunnel.shadowScale = 0;
    trackSprites.hazard_rocks.shadowScale = 0;
    trackSprites.hazard_sand.shadowScale = 0;
    //trackSprites.hazard_snow.shadowScale = 0;
    trackSprites.tunnel1.shadowScale = 0;
    trackSprites.tunnel2.shadowScale = 0;
    trackSprites.tunnel2Front.shadowScale = 0;
    trackSprites.water.shadowScale = 0;
    trackSprites.rock_huge.shadowScale = 0;
    trackSprites.rock_huge2.shadowScale = 0;
    trackSprites.rock_huge3.shadowScale = 0;
    trackSprites.rock_weird.shadowScale = 0;
    trackSprites.tree_huge.shadowScale = 0;
    trackSprites.sign_start.shadowScale = 0;
    trackSprites.sign_goal.shadowScale = 0;
    trackSprites.sign_checkpoint1.shadowScale = 0;
    trackSprites.sign_checkpoint2.shadowScale = 0;
}

// a sprite that can be placed on the track
class TrackSprite
{
    constructor(tilePos, size=1e3, sizeRandomness=0, windScale=0, collideScale=0, canMirror=1)
    {
        this.tilePos = tilePos;
        this.size = size;
        this.sizeRandomness = sizeRandomness;
        this.windScale = windScale;
        this.collideScale = collideScale;
        this.canMirror = canMirror; // allow mirroring
        this.trackFace =          // face track if close
        this.spriteYOffset = 0;     // how much to offset the sprite from the ground
        this.shadowScale = 1.2;

        // color
        this.colorHSL = vec3(0,0,1);
        this.hueRandomness = .05;
        this.lightnessRandomness = .01;
    }

    getRandomSpriteColor()
    {
        const c = this.colorHSL.copy();
        c.x += random.floatSign(this.hueRandomness);
        c.z += random.floatSign(this.lightnessRandomness);
        return c.getHSLColor();
    }

    getRandomSpriteScale() { return 1+random.floatSign(this.sizeRandomness); }
}

///////////////////////////////////////////////////////////////////////////////

// an instance of a track sprite
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
        if (segmentIndex > levelGoal*checkpointTrackSegments)
            width = 0;

        this.offset = offset;
        this.width = width;
        this.pitch = 0;
        this.normal = vec3();

        this.trackObjects = [];
        const levelFloat = segmentIndex/checkpointTrackSegments;
        const level = this.level = testLevelInfo ? testLevelInfo.level : levelFloat|0;
        const levelInfo = getLevelInfo(level);
        const levelInfoNext = getLevelInfo(levelFloat+1);
        //const levelLerpPercent = percent(levelFloat%1, 0, levelLerpRange);
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
        if (debug && testTrackSprite)
        {
            // test sprite
            this.addSprite(testTrackSprite,random.floatSign(width/2,1e4));
        }
        else if (debug && testTrackBillboards)
        {
            // test billboard
            const billboardSprite = random.fromList(trackSprites.billboards);
            this.addSprite(billboardSprite,random.floatSign(width/2,1e4));
        }
        else if (segmentIndex == levelGoal*checkpointTrackSegments)
        {
            // goal!
            this.addSprite(trackSprites.sign_goal);
        }
        else if (segmentIndex%checkpointTrackSegments == 0)
        {
            // checkpoint
            if (segmentIndex < levelGoal*checkpointTrackSegments)
            {
                this.addSprite(trackSprites.sign_checkpoint1,-width+500);
                this.addSprite(trackSprites.sign_checkpoint2, width-500);
            }
        }

        if (segmentIndex == 30)
        {
            // starting area
            this.addSprite(trackSprites.sign_start);

            // left
            const ol = -(width+100);
            this.addSprite(trackSprites.sign_opGames,ol,1450);
            this.addSprite(trackSprites.sign_zzfx,ol,850);
            this.addSprite(trackSprites.sign_avalanche,ol);
            
            // right
            const or = width+100;
            this.addSprite(trackSprites.sign_frankForce,or,1500);
            this.addSprite(trackSprites.sign_github,or,350);
            this.addSprite(trackSprites.sign_js13k,or);
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

function buildTrack()
{
    /////////////////////////////////////////////////////////////////////////////////////
    // build the road with procedural generation
    /////////////////////////////////////////////////////////////////////////////////////


    // set random seed & time
    random.setSeed(trackSeed);
    track = [];

    let sectionXEndDistance = 0;
    let sectionYEndDistance = 0;
    let sectionTurn = 0;
    let noisePos = random.int(1e5);
    let sectionBumpFrequency = 0;
    let sectionBumpScale = 1;
    let currentNoiseFrequency = 0;
    let currentNoiseScale = 1;
    
    // generate the road
    const trackEnd = levelGoal*checkpointTrackSegments;
    const roadTransitionRange = testQuick?min(checkpointTrackSegments,500):500;
    for(let i=0; i < trackEnd + 5e4; ++i)
    {
        const levelFloat = i/checkpointTrackSegments;
        const level = levelFloat|0;
        const levelInfo = getLevelInfo(level);
        const levelInfoLast = getLevelInfo(levelFloat-1);
        const levelLerpPercent = percent(i%checkpointTrackSegments, 0, roadTransitionRange);

        if (js13kBuild && i==31496)
            random.setSeed(7); // mess with seed to randomize jungle

        const roadGenWidth = laneWidth/2*lerp(levelLerpPercent, levelInfoLast.laneCount, levelInfo.laneCount);

        let turn = 0;
        let height = 0;
        let width = roadGenWidth;

        const startOfTrack = !level && i < 400;
        const checkpointSegment = i%checkpointTrackSegments;
        const levelBetweenRange = 100;
        let isBetweenLevels = checkpointSegment < levelBetweenRange || 
            checkpointSegment > checkpointTrackSegments - levelBetweenRange;
        isBetweenLevels |= startOfTrack; // start of track
        //const nextCheckpoint = (level+1)*checkpointTrackSegments;

        if (isBetweenLevels || i > trackEnd - 500) // straight at end
        {
            // transition at start or end of level
            // reset stuff
            sectionXEndDistance = sectionYEndDistance = sectionTurn = 0;
        }
        else
        {
            // turns
            const turnChance = levelInfo.turnChance; // chance of turn
            const turnMin = levelInfo.turnMin;     // min turn
            const turnMax = levelInfo.turnMax;     // max turn
            const sectionDistanceMin = 100;
            const sectionDistanceMax = 400;
            if (sectionXEndDistance-- < 0)
            {
                // pick random section distance
                sectionXEndDistance = random.int(sectionDistanceMin,sectionDistanceMax);
                sectionTurn = random.bool(turnChance) ? random.floatSign(turnMin,turnMax) : 0;
            }

            // bumps
            const bumpChance   = levelInfo.bumpChance;   // chance of bump
            const bumpFreqMin  = levelInfo.bumpFreqMin;  // no bumps
            const bumpFreqMax  = levelInfo.bumpFreqMax;  // raipd bumps
            const bumpScaleMin = levelInfo.bumpScaleMin; // small rapid bumps
            const bumpScaleMax = levelInfo.bumpScaleMax; // large hills
            if (sectionYEndDistance-- < 0)
            {
                // pick random section distance
                sectionYEndDistance = random.int(sectionDistanceMin,sectionDistanceMax);
                if (random.bool(bumpChance))
                {
                    sectionBumpFrequency = random.float(bumpFreqMin,bumpFreqMax);
                    sectionBumpScale = random.float(bumpScaleMin,bumpScaleMax);
                }
                else
                {
                    sectionBumpFrequency = 0;
                    sectionBumpScale = bumpScaleMin;
                }
            }
        }

        turn = sectionTurn;

        // apply noise to height
        const noiseFrequency = currentNoiseFrequency 
            = lerp(.01, currentNoiseFrequency, sectionBumpFrequency);
        const noiseSize = currentNoiseScale 
            = lerp(.01, currentNoiseScale, sectionBumpScale);

        //noiseFrequency = 1; noiseSize = 50;
        if (currentNoiseFrequency)
            noisePos += noiseFrequency/noiseSize;
        const noiseConstant = 20;
        height = noise1D(noisePos)*noiseConstant*noiseSize;

        //turn = 0; height = 0;
        //height = noise1D(i/29)*400;turn =0; // jumps test

        // create track segment
        const o = vec3(turn, height, i*trackSegmentLength);
        track[i] = new TrackSegment(i, o, width);
    }

    // second pass
    let hazardWait = 0;
    let tunnelOn = 0;
    let tunnelTime = 0;
    let trackSideChanceScale = 1;
    for(let i=0; i < track.length; ++i)
    {
        // calculate pitch
        const iCheckpoint = i%checkpointTrackSegments;
        const t = track[i];
        const levelInfo = getLevelInfo(t.level);
        ASSERT(t.level == levelInfo.level || t.level > levelGoal); 
        
        const previous = track[i-1];
        if (previous)
        {
            t.pitch = Math.atan2(previous.offset.y-t.offset.y, trackSegmentLength);
            const d = vec3(0,t.offset.y-previous.offset.y, trackSegmentLength);
            t.normal = d.cross(vec3(1,0)).normalize();
        }

        if (!iCheckpoint)
        {
            // reset level settings
            trackSideChanceScale = 1;
        }

        if (t.sideStreet || i < 50)
            continue; // no objects on side streets

        // check what kinds of turns are ahead
        const lookAheadTurn = 150;
        const lookAheadStep = 20;
        let leftTurns = 0, rightTurns = 0;
        for(let k=0; k<lookAheadTurn; k+=lookAheadStep)
        {
            const t2 = track[i+k];
            if (!t2)
                continue;
            
            if (k < lookAheadTurn)
            {
                const x = t2.offset.x;
                if (x > 0) leftTurns  = max(leftTurns, x);
                else       rightTurns = max(rightTurns, -x);
            }
        }

        // spawn road signs
        const roadSignRate = 10;
        const turnWarning = 0.5;
        let signSide;
        if (i < levelGoal*checkpointTrackSegments) // end of level
        if (rightTurns > turnWarning || leftTurns > turnWarning)
        {
            // turn
            signSide = sign(rightTurns - leftTurns);
            if (i%roadSignRate == 0)
                t.addSprite(trackSprites.sign_turn,signSide*(t.width+500));
        }

        // todo prevent sprites from spawning near road signs?
        //levelInfo.tunnel = trackSprites.tunnel2; // test tuns
        if (levelInfo.tunnel)
        {
            const isRockArch   = levelInfo.tunnel.tunnelArch;
            const isLongTunnel = levelInfo.tunnel.tunnelLong;
            if (iCheckpoint > 100 && iCheckpoint < checkpointTrackSegments - 100)
            {
                const wasOn = tunnelOn;
                if (tunnelTime-- < 0)
                {
                    tunnelOn = !tunnelOn;
                    tunnelTime = tunnelOn? 
                        isRockArch ? 10 : random.int(200,600) :
                        tunnelTime = random.int(300,600); // longer when off
                }

                if (tunnelOn)
                {
                    // brighter front of tunnel
                    const sprite = isLongTunnel && !wasOn ?
                        trackSprites.tunnel2Front : levelInfo.tunnel;
                    t.addSprite(sprite, 0);

                    if (isLongTunnel && i%50==0)
                    {
                        // lights on top of tunnel
                        const lightSprite = trackSprites.light_tunnel;
                        const tunnelHeight = 1600;
                        t.addSprite(lightSprite, 0, tunnelHeight);
                    }
                    continue;
                }
            }
        }
        else
        {
            // restart tunnel wait
            tunnelOn = tunnelTime = 0;
        }
        
        {
            // sprites on sides of track
            const billboardChance = levelInfo.billboardChance;
            const billboardRate =  levelInfo.billboardRate;
            if (i%billboardRate == 0 && random.bool(billboardChance))
            {
                // random billboards
                const extraScale = levelInfo.billboardScale; // larger in desert
                const width = t.width*extraScale;
                const count = trackSprites.billboards.length;
                const billboardSprite = trackSprites.billboards[random.int(count)];
                const billboardSide = signSide ? -signSide : random.sign();
                t.addSprite(billboardSprite,billboardSide*random.float(width+600,width+800),0,extraScale);
                continue;
            }
            if (levelInfo.trackSideSprite)
            {
                // vary how often side objects spawn
                if (random.bool(.001))
                {
                    trackSideChanceScale = 
                        random.bool(.4) ? 1 : // normal to spawn often
                        random.bool(.1) ? 0 : // small chance of none
                        random.float();       // random scale
                }

                // track side objects
                const trackSideRate = levelInfo.trackSideRate;
                const trackSideChance = levelInfo.trackSideChance;
                if (i%trackSideRate == 0 && random.bool(trackSideChance*trackSideChanceScale))
                {
                    const trackSideForce = levelInfo.trackSideForce;
                    const side = trackSideForce || (i%(trackSideRate*2)<trackSideRate?1:-1);
                    t.addSprite(levelInfo.trackSideSprite, side*(t.width+random.float(700,1e3)));
                    continue;
                }
            }

            if (iCheckpoint > 40 && iCheckpoint < checkpointTrackSegments - 40)
            if (hazardWait-- < 0 && levelInfo.hazardType && random.bool(levelInfo.hazardChance))
            {
                // hazards on the ground in road to slow player
                const sprite = levelInfo.hazardType;
                t.addSprite(sprite,random.floatSign(t.width/.9));

                // wait to spawn another hazard
                hazardWait = random.float(40,80);
            }
        }
    }
}