'use strict';

let vehicleShadowList;
function drawCars()
{
    vehicleShadowList = [];
    vehicles = vehicles.filter(o=>!o.destroyed);
    for(const v of vehicles)
        v.draw();

    // draw batched shadows
    glPolygonOffset(80);
    glSetDepthTest(1,0);
    for(let v of vehicleShadowList)
        pushShadow(...v);
    glRender();   
    glPolygonOffset(false);
    glSetDepthTest();
}

class Vehicle
{
    constructor(z, color = WHITE)
    {
        this.lane = randInt(2);
        this.pos = vec3(0,0,z);
        this.targetSpeed = 80;
        this.velocity = vec3(0,0,this.targetSpeed);
        this.color = color;
        this.isPlayer = 0;

        // car physics
        this.breaking = 0;
        this.turn = 0;
        this.wheelTurn = 0;
        this.collisionSize = vec3(240,200,350);
    }

    update()
    {
        if (this.isPlayer)
            return;
            
        if (this.velocity.z < this.targetSpeed)
            this.velocity.z += .5;
        else if (this.velocity.z > this.targetSpeed+5)
            this.velocity.z -= 2;
        this.pos.z = this.pos.z += this.velocity.z;

        const trackInfo = new TrackSegmentInfo(this.pos.z);
        const trackInfo2 = new TrackSegmentInfo(this.pos.z+trackSegmentLength);
        if (!trackInfo.pos || !trackInfo2.pos)
            return; // not visible

        // move ai vehicles
        const x = -trackWidth/2 + this.lane*trackWidth;
        this.pos.x = trackInfo.pos.x + x;
        this.pos.y = trackInfo.offset.y;

        // get projected track angle
        let delta = trackInfo2.pos.subtract(trackInfo.pos);
        this.turn = Math.atan2(delta.x, delta.z);
        this.wheelTurn = this.turn;

        // remove in front or behind
        let playerDelta = this.pos.z - playerVehicle.pos.z;
        if (playerDelta > 5e4 || playerDelta < -2e3)
            this.destroyed = 1;
    }

    draw()
    {
        const trackInfo = new TrackSegmentInfo(this.pos.z);
        const vehicleHeight = 80;
        let p = this.pos.copy();
        p.y += vehicleHeight;
        p.z = p.z - cameraOffset;
        
        // car
        const heading = this.turn;
        const trackPitch = trackInfo.pitch;
        const m2 = buildMatrix(p, vec3(trackPitch,0,0));
        const m1 = m2.multiply(buildMatrix(0, vec3(0,heading,0), 0));
        carMesh.render(m1.multiply(buildMatrix(0, 0, vec3(450))), this.color); 
        //cubeMesh.render(m1.multiply(buildMatrix(0, 0, this.collisionSize)), BLACK);  // collis

        glPolygonOffset(50);

        // bumpers
        const bumperY = 130;
        const bumperZ = -440;
        cubeMesh.render(m1.multiply(buildMatrix(vec3(0,bumperY,bumperZ), 0, vec3(140,50,20))), hsl(0,0,.1));
        cubeMesh.render(m1.multiply(buildMatrix(vec3(0,10,440), 0, vec3(240,30,30))), hsl(0,0,.5));

        // license plate
        if (this.isPlayer)
        {
            quadMesh.renderTile(m1.multiply(buildMatrix(vec3(0,bumperY-80,bumperZ-20), 0, vec3(80,25))),WHITE, getGenerativeTile(vec3(3,0)));

            // top number
            quadMesh.renderTile(m1.multiply(buildMatrix(vec3(0,220,-200), vec3(PI/2-.2,0,0), vec3(150))),WHITE, getGenerativeTile(vec3(4,0)));
        }

        // break lights
        const isBraking = this.isBraking;
        for(let i=2;i--;)
        {
            let color = isBraking ? hsl(0,1,.5) : hsl(0,.9,.3);
            cubeMesh.renderUnlit(m1.multiply(buildMatrix(vec3((i?1:-1)*180,bumperY-25,bumperZ), 0, vec3(40,25,20))), color, isBraking);
        }
        for(let i=2;i--;)
        {
            cubeMesh.render(m1.multiply(buildMatrix(vec3((i?1:-1)*180,bumperY+25,bumperZ), 0, vec3(40,25,20))), hsl(0,0,.8));
        }

        glPolygonOffset(false);

        // wheels
        const wheelRadius = 110;
        const wheelSize = vec3(40,wheelRadius,wheelRadius);
        const wheelM1 = buildMatrix(0,vec3(this.pos.z/500,this.wheelTurn,0),wheelSize);
        const wheelM2 = buildMatrix(0,vec3(this.pos.z/500,0,0),wheelSize);
        const wheelColor = hsl(0,0,.2);
        const wheelOffset1 = vec3(240,25,220);
        const wheelOffset2 = vec3(240,25,-300);
        for (let i=4;i--;)
        {
            const wo = i<2? wheelOffset1 : wheelOffset2;
            const o = vec3(i%2?wo.x:-wo.x, wo.y, i<2? wo.z : wo.z);
            carWheel.render(m1.multiply(buildMatrix(o)).multiply(i<2 ? wheelM1 :wheelM2), wheelColor);
        }

        // add shadow to list
        p.y = this.pos.y;
        const r = vec3(trackPitch,heading,0);
        vehicleShadowList.push([p, 600, 600, r, 2]);
    }
}

class PlayerVehicle extends Vehicle
{
    constructor(z, color)
    {
        super(z, color);
        this.isPlayer = 1;
        this.bumpTimer = 0;
        this.airTime = 0;
        this.playerTurn = 0;
        this.velocity = vec3();
        this.hitTimer = new Timer;
    }

    draw()
    {
        attractMode || super.draw();
    }

    update()
    {
        if (attractMode)
        {
            this.pos.z += this.velocity.x = min(this.velocity.x += .1, 20);
            return;
        }

        this.turn = this.playerTurn*clamp(this.velocity.z/49);

        if (attractMode)
            return;

        // player settings
        const forwardDamping = .998;      // dampen player z speed
        const playerMaxSpeed = 200;        // limit max player speed
        const playerTurnControl = .3;      // player turning rate
        const centrifugal = .002;          // how much to pull player on turns
        const gravity = -2;                // gravity to apply in y axis
        const lateralDamping = .7;         // dampen player x speed
        const maxPlayerX = 2e3;            // player can not move this far from center of road
        const playerAccel = 1;             // player acceleration
        const playerBrake = 2;             // player acceleration when breaking

        if (playerVehicle.pos.z > nextCheckpointDistance)
        {
            nextCheckpointDistance += checkpointDistance;
            checkpointTimeLeft += 40;
            
            speak('CHECKPOINT');
            sound_checkpoint.play();
        }

        // check for collisions
        for(const v of vehicles)
        {
            if (v.isPlayer)
                continue;

            const d = this.pos.subtract(v.pos).abs();
            const s = this.collisionSize.add(v.collisionSize);
            if (d.x < s.x && d.z < s.z)
            {
                // collision
                let vel = this.velocity;
                this.velocity = v.velocity.scale(.7);
                v.velocity.z = max(v.velocity.z, vel.z*.7);
                this.hit();
            }
        }

        let playerInput = vec3(
            keyIsDown('ArrowRight') - keyIsDown('ArrowLeft'),
            keyIsDown('ArrowUp')    - keyIsDown('ArrowDown'));

        if (playerInput.x || playerInput.y)
            mouseControl = 0;
        if (mouseWasPressed(0) || mouseWasPressed(2))
            mouseControl = 1;

        if (mouseControl)
        {
            playerInput.y = 0;
            if (mouseIsDown(0))
                playerInput.y = 1;
            if (mouseIsDown(2))
                playerInput.y = -1;
            let center = this.pos.x/4e3;
            playerInput.x = clamp(4*(mousePos.x-.5-center),-1,1);
        }

        if (gameOverTimer.isSet())
            playerInput = vec3();

        if (testDrive)
            this.velocity.z = 30;
        this.velocity.y += gravity;
        this.velocity.x *= lateralDamping;
        this.pos = this.pos.add(this.velocity);
        const playerTrackInfo = new TrackSegmentInfo(this.pos.z);
        
        let desiredPlayerTurn = playerInput.x * playerTurnControl;
        if (startCountdown > 0)
            desiredPlayerTurn = 0;

        this.wheelTurn = lerp(.2, this.wheelTurn, 2*desiredPlayerTurn);
        desiredPlayerTurn *= lerp(this.velocity.z/playerMaxSpeed, 1, .3);
        this.playerTurn = lerp(.1, this.playerTurn, desiredPlayerTurn);

        this.velocity.x +=
            this.velocity.z * this.playerTurn -
            this.velocity.z ** 2 * centrifugal * playerTrackInfo.offset.x;
        this.pos.x = clamp(this.pos.x, -maxPlayerX, maxPlayerX); 
        
        // check if on ground
        let offRoad = 0;
        let onGround = 0;
        const lastAirTime = this.airTime;
        const elasticity = 0;1.2;            // bounce elasticity (2 is full bounce, 1 is none)
        if (this.pos.y < playerTrackInfo.offset.y)
        {
            this.pos.y = playerTrackInfo.offset.y;
            const trackPitch = playerTrackInfo.pitch;
            if (!gameOverTimer.isSet())
            {
                let reflectVelocity = vec3(0, Math.cos(trackPitch), Math.sin(trackPitch))
                .scale(-elasticity *
                (Math.cos(trackPitch) * this.velocity.y + Math.sin(trackPitch) * this.velocity.z))

                this.velocity = this.velocity.add(reflectVelocity);
            }

            if (Math.abs(this.pos.x) > playerTrackInfo.width - this.collisionSize.x)
            {
                offRoad = 1;
                this.velocity.z *= .98;
                this.bumpTimer += this.velocity.z*rand(.8,1.2);
                if (this.bumpTimer > 200)
                {
                    this.velocity.y += min(50,this.velocity.z)*.1*rand(1,2);
                    this.bumpTimer = 0;
                    sound_bump.play();
                    //zzfx();
                }
            }
            
            this.airTime = 0;
            onGround = 1;
            this.velocity.z = Math.max(0, forwardDamping*this.velocity.z);
            if (this.velocity.z < 10)
                this.velocity.z *= .95;
        }
        else
            this.airTime += timeDelta;
        
        //if (!this.airTime && lastAirTime > .3)
        //    PlaySound(6); // land

        this.isBraking = playerInput.y<0;
        
        if (onGround)
        {
            if (playerInput.y>0)
                this.velocity.z += playerInput.y*lerp(this.velocity.z/playerMaxSpeed, playerAccel, 0);
            else if (this.isBraking)
                this.velocity.z += playerInput.y*playerBrake;
        }
        this.velocity.z = max(0, this.velocity.z);

        if (startCountdown > 0)
            this.velocity.z=0
        if (gameOverTimer.isSet())
            this.velocity = this.velocity.scale(.95);
   
        {
            // check for collisions
            const cameraOffset = playerVehicle.pos.z - cameraPlayerOffset.z;
            const cameraTrackInfo = new TrackSegmentInfo(cameraOffset);
            const cameraTrackSegment = cameraTrackInfo.segment;
            const collisionCheckDistance = 40;
            for(let i = collisionCheckDistance; i--; )
            {
                const segmentIndex = cameraTrackSegment+i;
                const trackSegment = track[segmentIndex];    
                if (!trackSegment)
                    continue;

                // collidable sprites
                for(const sprite of trackSegment.sprites)
                {
                    if (!sprite.collideSize)
                        continue;

                    const pos = trackSegment.offset.add(sprite.offset);
                    const z = pos.z - this.pos.z;
                    if (z > this.collisionSize.z || z < -this.collisionSize.z)
                        continue;
                        
                    const dx = abs(this.pos.x - pos.x);
                    const cs = this.collisionSize.x + abs(sprite.collideSize);
                    if (dx > cs)
                        continue;

                    // collision
                    //this.playerTurn = -.2*sign(this.pos.x)
                    this.velocity.x = -100*sign(this.pos.x);
                    this.velocity = this.velocity.scale(.9);
                    this.hit();
                    break;
                }
            }
        }
    }

    hit()
    {
        if (!this.hitTimer.active())
        {
            sound_hit.play();
            this.hitTimer.set(.5);
        }
    }
}