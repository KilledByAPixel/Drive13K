'use strict';

const testTrackBillboards=0;

// build the road with procedural generation
function buildTrack()
{
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
    
    let turn = 0;

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

        let height = 0;
        let width = roadGenWidth;

        const startOfTrack = !level && i < 400;
        const checkpointSegment = i%checkpointTrackSegments;
        const levelBetweenRange = 100;
        let isBetweenLevels = checkpointSegment < levelBetweenRange || 
            checkpointSegment > checkpointTrackSegments - levelBetweenRange;
        isBetweenLevels |= startOfTrack; // start of track
        //const nextCheckpoint = (level+1)*checkpointTrackSegments;

        if (isBetweenLevels)
        {
            // transition at start or end of level
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

        if (i > trackEnd - 500)
            sectionTurn = 0; // no turns at end

        turn = lerp(.02,turn, sectionTurn); // smooth out turns

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

        //turn = .7; height = 0;
        //turn = Math.sin(i/100)*.7;
        //height = noise1D((i-50)/99)*2700;turn =0; // jumps test

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
                t.addSprite(spriteList.sign_turn,signSide*(t.width+500));
        }

        // todo prevent sprites from spawning near road signs?
        //levelInfo.tunnel = spriteList.tunnel2; // test tuns
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
                        spriteList.tunnel2Front : levelInfo.tunnel;
                    t.addSprite(sprite, 0);

                    if (isLongTunnel && i%50==0)
                    {
                        // lights on top of tunnel
                        const lightSprite = spriteList.light_tunnel;
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
                const count = spriteList.billboards.length;
                const billboardSprite = spriteList.billboards[random.int(count)];
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