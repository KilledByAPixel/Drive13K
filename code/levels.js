'use strict';

let levelInfoList;

function initLevelInfos()
{
    levelInfoList = [];
    let LI, level=0;

    // Level 1 - beach - 
    LI = new LevelInfo(level++, [
        trackSprites.grass_plain, 
        trackSprites.tree_palm,
        trackSprites.rock_big,
    ], trackSprites.tree_palm);
    LI.waterSide = -1;
    LI.horizonSpriteSize = .5;
    //LI.tunnel = trackSprites.tunnel2; // test tunnel
    LI.billboardChance = .3 // more billboards at start
    LI.trafficDensity = .7; // less traffic at start
    
    // mostly straight with few well defined turns or bumps
    LI.turnChance = .6;
    LI.turnMin = .2;
    //LI.turnMax = .6;
    //LI.bumpChance = .5;
    LI.bumpFreqMin = .2;
    LI.bumpFreqMax = .4;
    LI.bumpScaleMin = 10;
    LI.bumpScaleMax = 20;

    // Level 2 - forest - 
    LI = new LevelInfo(level++, [
        trackSprites.tree_oak,
        trackSprites.grass_plain,
        trackSprites.tree_bush,
        trackSprites.tree_stump,
        trackSprites.grass_flower1,
        trackSprites.grass_flower3,
        trackSprites.grass_flower2,
    ], trackSprites.tree_bush, trackSprites.horizon_smallMountains);
    LI.trackSideRate = 10;
    LI.sceneryListBias = 9;
    //LI.skyColorTop = WHITE;
    LI.skyColorBottom = hsl(.5,.3,.5);
    LI.roadColor = hsl(.05,.4,.2);
    LI.groundColor = hsl(.2,.4,.4);
    LI.cloudColor = hsl(0,0,1,.3);
    LI.cloudHeight = .2;
    LI.sunHeight = .7;
    LI.billboardChance = .1 // less billboards in forest type areas

    // trail through forest
    LI.turnChance = .7; // more small turns
    //LI.turnMin = 0;
    //LI.turnMax = .6;
    LI.bumpChance = .8;
    LI.bumpFreqMin = .3;
    //LI.bumpFreqMax = .7;
    //LI.bumpScaleMin = 50;
    LI.bumpScaleMax = 100;

    // Level 3 - desert - 
    // has long straight thin roads and tunnel
    LI = new LevelInfo(level++, [
        trackSprites.grass_dead, 
        trackSprites.tree_dead,
        trackSprites.rock_big,
        trackSprites.tree_stump,
    ], trackSprites.telephonePole, trackSprites.horizon_desert);
    LI.trackSideRate = 50;
    LI.trackSideChance = 1;
    LI.skyColorTop = hsl(.15,1,.9);
    LI.skyColorBottom = hsl(.5,.7,.6);
    LI.roadColor = hsl(.1,.2,.2);
    LI.lineColor = hsl(0,0,1,.5);
    LI.groundColor = hsl(.1,.2,.5);
    LI.trackSideForce = 1; // telephone poles on right side
    LI.cloudHeight = .05;
    LI.sunHeight = .9;
    LI.sideStreets = 1;
    LI.laneCount = 2;
    LI.hazardType = trackSprites.hazard_sand;
    LI.hazardChance = .003;
    LI.tunnel = trackSprites.tunnel2;
    LI.trafficDensity = .7; // less traffic in desert, only 2 lanes
    LI.billboardRate = 91;
    LI.billboardScale = 8;

    // flat desert
    //LI.turnChance = .5;
    LI.turnMin = .2;
    LI.turnMax = .5;
    LI.bumpChance = 1;
    //LI.bumpFreqMin = 0;
    LI.bumpFreqMax = .2;
    LI.bumpScaleMin = 30;
    LI.bumpScaleMax = 60;

    // Level 4 - snow area - 
    LI = new LevelInfo(level++, [
        trackSprites.grass_snow,
        trackSprites.tree_dead,
        trackSprites.tree_snow,
        trackSprites.rock_big,
        trackSprites.tree_stump,
    ], trackSprites.tree_snow, trackSprites.horizon_snow);
    LI.trackSideRate = 31;
    LI.skyColorTop = hsl(.5,.2,.4);
    LI.skyColorBottom = WHITE;
    LI.roadColor = hsl(0,0,.5,.3);
    LI.groundColor = hsl(.6,.3,.9);
    LI.cloudColor = hsl(0,0,.8,.5);
    LI.horizonSpriteSize = 3;
    LI.lineColor = hsl(0,0,1,.5);
    LI.sunHeight = .7;
    LI.hazardType = trackSprites.hazard_rocks;
    LI.hazardChance = .001;
    LI.trafficDensity = 1.5; // extra traffic through snow

    // snowy mountains
    //LI.turnChance = .5;
    LI.turnMin = .4;
    //LI.turnMax = .6;
    LI.bumpChance = .8;
    LI.bumpFreqMin = .3;
    //LI.bumpFreqMax = .7;
    LI.bumpScaleMin = 80;
    LI.bumpScaleMax = 160;

    // Level 5 - canyon - 
    // has winding roads, hills, and sand onground
    LI = new LevelInfo(level++, [
        trackSprites.rock_huge,
        trackSprites.grass_dead,
        trackSprites.tree_fall,
        trackSprites.rock_huge2,
        trackSprites.grass_flower2,
        trackSprites.tree_dead,
        trackSprites.tree_stump,
        trackSprites.rock_big,
    ], trackSprites.tree_fall,trackSprites.horizon_brownMountains);
    LI.sceneryListBias = 2;
    LI.trackSideRate = 31;
    LI.skyColorTop = hsl(.7,1,.7);
    LI.skyColorBottom = hsl(.2,1,.9);
    LI.roadColor = hsl(0,0,.15);
    LI.groundColor = hsl(.1,.4,.5);
    LI.cloudColor = hsl(0,0,1,.3);
    LI.cloudHeight = .1;
    LI.sunColor = hsl(0,1,.7);
    //LI.laneCount = 3;
    LI.hazardChance = .01;
    LI.billboardChance = .1 // less billboards in forest type areas
    LI.trafficDensity = .7;

    // rocky canyon
    LI.turnChance = 1; // must turn to block vision
    LI.turnMin = .2;
    LI.turnMax = .8;
    LI.bumpChance = .9;
    LI.bumpFreqMin = .4;
    //LI.bumpFreqMax = .7;
    //LI.bumpScaleMin = 50;
    LI.bumpScaleMax = 120;

    // Level 6 - red fields and city 
    LI = new LevelInfo(level++, [
        trackSprites.grass_red, 
        trackSprites.tree_yellow,
        trackSprites.rock_big,
        trackSprites.tree_stump,
        //trackSprites.rock_wide,
    ], trackSprites.tree_yellow,trackSprites.horizon_city);
    LI.trackSideRate = 31;
    LI.skyColorTop = YELLOW;
    LI.skyColorBottom = RED;
    LI.roadColor = hsl(0,0,.1);
    LI.lineColor = hsl(.15,1,.7);
    LI.groundColor = hsl(.05,.5,.4);
    LI.cloudColor = hsl(.15,1,.5,.5);
    //LI.cloudHeight = .3;
    LI.billboardRate = 23; // more billboards in city
    LI.billboardChance = .5
    LI.horizonSpriteSize = 1;
    LI.sunHeight = .5;
    LI.sunColor = hsl(.15,1,.8);
    LI.sideStreets = 1;
    LI.laneCount = 5;
    LI.trafficDensity = 2; // extra traffic in city

    // in front of city
    LI.turnChance = .3;
    LI.turnMin = .5
    LI.turnMax = .9; // bigger turns since lanes are wide
    //LI.bumpChance = .5;
    LI.bumpFreqMin = .3;
    LI.bumpFreqMax = .6;
    LI.bumpScaleMin = 80;
    LI.bumpScaleMax = 160;

    // Level 7 - graveyard - 
    LI = new LevelInfo(level++, [
        trackSprites.grass_dead,
        trackSprites.grass_plain, 
        trackSprites.grave_stone,
        trackSprites.tree_dead,
        trackSprites.tree_stump,
    ], trackSprites.tree_oak, trackSprites.horizon_graveyard);
    LI.sceneryListBias = 2;
    LI.trackSideRate = 50;
    LI.skyColorTop = hsl(.5,1,.5);
    LI.skyColorBottom = hsl(0,1,.8);
    LI.roadColor = hsl(.6,.3,.15);
    LI.groundColor = hsl(.2,.3,.5);
    LI.lineColor = hsl(0,0,1,.5);
    LI.billboardChance = 0; // no ads in graveyard
    LI.cloudColor = hsl(.15,1,.9,.3);
    LI.horizonSpriteSize = 4;
    LI.sunHeight = 1.5;
    //LI.laneCount = 3;
    LI.trafficDensity = .5;
    LI.trackSideChance = 1; // more trees
    LI.trackSideRate = 50;

    // thin road over hills in graveyard
    //LI.turnChance = .5;
    LI.turnMin = .1;
    //LI.turnMax = .6;
    //LI.bumpChance = .5;
    LI.bumpFreqMin = .4;
    LI.bumpFreqMax = .8;
    LI.bumpScaleMin = 100;
    //LI.bumpScaleMax = 150;

    // Level 8 - jungle - dirt road, many trees
    // has lots of physical hazards
    LI = new LevelInfo(level++, [
        trackSprites.grass_large, 
        trackSprites.tree_palm,
        trackSprites.grass_flower1,
        trackSprites.rock_tall,
        trackSprites.rock_big,
        trackSprites.rock_huge2,
    ], trackSprites.rock_big, trackSprites.horizon_redMountains);
    LI.sceneryListBias = 5;
    LI.trackSideRate = 20;
    LI.skyColorTop = hsl(0,1,.8);
    LI.skyColorBottom = hsl(.6,1,.6);
    LI.lineColor = hsl(0,0,0,0);
    LI.roadColor = hsl(0,.6,.2,.8);
    LI.groundColor = hsl(.1,.5,.4);
    LI.waterSide = 1;
    LI.cloudColor = hsl(0,1,.96,.8);
    LI.cloudWidth = .6;
    //LI.cloudHeight = .3;
    LI.sunHeight = .7;
    LI.sunColor = hsl(.1,1,.7);
    LI.hazardType = trackSprites.rock_big;
    LI.hazardChance = 1;
    LI.trafficDensity = 0;  // no other cars in jungle

    // bumpy jungle road 
    LI.turnChance = .8;
    //LI.turnMin = 0;
    LI.turnMax = .3;  // lots of slight turns
    LI.bumpChance = 1;
    LI.bumpFreqMin = .4;
    LI.bumpFreqMax = .8;
    LI.bumpScaleMin = 10;
    LI.bumpScaleMax = 60;

    // Level 9 - strange area
    LI = new LevelInfo(level++, [
        trackSprites.grass_red,
        trackSprites.rock_weird,
        trackSprites.tree_huge, 
    ], trackSprites.rock_weird2, trackSprites.horizon_weird);
    LI.trackSideRate = 50;
    LI.skyColorTop = hsl(.05,1,.8);
    LI.skyColorBottom = hsl(.15,1,.7);
    LI.lineColor = hsl(0,1,.9);
    LI.roadColor = hsl(.6,1,.1);
    LI.groundColor = hsl(.6,1,.6);
    LI.cloudColor = hsl(.9,1,.5,.3);
    LI.cloudHeight = .2;
    LI.sunColor = BLACK;
    LI.laneCount = 4;
    LI.trafficDensity = 1.5; // extra traffic to increase difficulty here

    // large strange hills
    LI.turnChance = .7;
    LI.turnMin = .3;
    LI.turnMax = .8;
    LI.bumpChance = 1;
    LI.bumpFreqMin = .5;
    LI.bumpFreqMax = .9;
    LI.bumpScaleMin = 100;
    //LI.bumpScaleMax = 150;

    // Level 10 - mountains - hilly, rocks on sides
    LI = new LevelInfo(level++, [
        trackSprites.grass_plain,
        trackSprites.rock_huge3,
        trackSprites.grass_flower1,
        trackSprites.rock_huge2,
        trackSprites.rock_huge,
    ], trackSprites.tree_pink);
    LI.trackSideRate = 30;
    LI.skyColorTop = hsl(.2,1,.9);
    LI.skyColorBottom = hsl(.55,1,.5);
    LI.roadColor = hsl(0,0,.1);
    LI.groundColor = hsl(.1,.5,.7);
    LI.cloudColor = hsl(0,0,1,.5);
    LI.sunHeight = .7;
    LI.tunnel = trackSprites.tunnel1;
    LI.horizonSpriteSize = 0; // no horizon

    // mountains, most difficult level
    LI.turnChance = .8;
    //LI.turnMin = 0;
    LI.turnMax = 1;
    LI.bumpChance = 1;
    LI.bumpFreqMin = .3;
    LI.bumpFreqMax = .9;
    //LI.bumpScaleMin = 50;
    LI.bumpScaleMax = 80;

    // Level 11 - win area
    LI = new LevelInfo(level++, [
        trackSprites.grass_flower1,
        trackSprites.grass_flower2,
        trackSprites.grass_flower3,
        trackSprites.grass_plain, 
        trackSprites.tree_oak,
        trackSprites.tree_bush,
    ], trackSprites.tree_oak);
    LI.sceneryListBias = 1;
    LI.groundColor = hsl(.2,.3,.5);
    LI.trackSideRate = LI.laneCount = LI.billboardChance = 0;
    LI.sunHeight = .5;
}

const getLevelInfo = (level) => testLevelInfo || levelInfoList[level|0] || levelInfoList[0];

// info about how to build and draw each level
class LevelInfo
{
    constructor(level, scenery, trackSideSprite,horizonSprite=trackSprites.horizon_islands)
    {
        // add self to list
        levelInfoList[level] = this;

        if (debug)
        {
            for(const s of scenery)
                ASSERT(s, 'missing scenery!');
        }

        this.level = level;
        this.scenery = scenery;
        this.trackSideSprite = trackSideSprite;
        this.sceneryListBias = 29;
        this.waterSide = 0;

        this.billboardChance = .2;
        this.billboardRate = 45;
        this.billboardScale = 1;
        this.trackSideRate = 5;
        this.trackSideForce = 0;
        this.trackSideChance = .5;

        this.groundColor = hsl(.08,.2, .7);
        this.skyColorTop = WHITE;
        this.skyColorBottom = hsl(.57,1,.5);
        this.lineColor = WHITE;
        this.roadColor = hsl(0, 0, .5);

        // horizon stuff
        this.cloudColor = hsl(.15,1,.95,.7);
        this.cloudWidth = 1;
        this.cloudHeight = .3;
        this.horizonSprite = horizonSprite;
        this.horizonSpriteSize = 2;
        this.sunHeight = .8;
        this.sunColor = hsl(.15,1,.95);

        // track generation
        this.laneCount = 3;
        this.trafficDensity = 1;

        // default turns and bumps
        this.turnChance = .5;
        this.turnMin = 0;
        this.turnMax = .6;
        this.bumpChance = .5;
        this.bumpFreqMin = 0;    // no bumps
        this.bumpFreqMax = .7;   // more often bumps
        this.bumpScaleMin = 50;  // rapid bumps
        this.bumpScaleMax = 150; // largest hills
    }
}