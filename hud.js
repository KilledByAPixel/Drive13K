'use strict';

let radioMusic = -1;
const showTitle = 1;

function initHUD()
{

}

function drawHUD()
{
    if (titleScreenMode)
    {
        if (showTitle)
        for(let j=2;j--;)
        {
            // draw logo
            const text = j?'DR1V3N':'WILD';
            const pos = vec3(.47,.25-j*.15).multiply(mainCanvasSize);
            const size = mainCanvasSize.y/9;
            const weight = 900;
            const style = 'italic';
            const font = 'arial';
                    
            const context = mainContext;
            context.strokeStyle = BLACK;
            context.textBaseline = 'middle';
            context.textAlign = 'center';

            let totalWidth = 0;
            for(let k=2;k--;)
            for(let i=0;i<text.length;i++)
            {
                const p = Math.sin(i-time*2-j*2);
                const size2 = size + p*mainCanvasSize.y/20;
                context.font = `${style} ${weight} ${size2}px ${font}`;
                const c = text[i];
                const w = context.measureText(c).width;
                if (k)
                {
                    totalWidth += w;
                    continue;
                }

                const x = pos.x+w/2-totalWidth/2;
                for(let f = 2;f--;)
                {
                    const o = f*mainCanvasSize.y/99;
                    context.fillStyle = hsl(.15+p/9,1,f?0:.75+p*.25);
                    context.fillText(c, x+o, pos.y+o);
                }
                pos.x += w;
            }
        }

        if (bestTime)
        {
            const timeString = formatTimeString(bestTime);
            drawHUDText('BEST TIME', vec3(.5,.87), .08, WHITE, undefined,'monospace',undefined,900,undefined,undefined,0,undefined,3);
            drawHUDText(timeString, vec3(.5,.94), .08, WHITE, undefined,'monospace',undefined,900,undefined,undefined,0,undefined,3);
        }
        /*else
        {
            const t = 'Click to Play';
            const a = 1 - abs(Math.sin(time*2))/2;
            drawHUDText(t, vec3(.5,.95), .06, hsl(.1,1,a), undefined,undefined,undefined,900,undefined,undefined,0,undefined,3);
        }*/

        // do not draw hud when in title mode
        return;
    }

    if (startCountdownTimer.active() || startCountdown)
    {
        // count down
        const a = 1-time%1;
        const t = !startCountdown && startCountdownTimer.active() ? 'GO!' : startCountdown|0;
        const c = (startCountdown?RED:GREEN).copy();
        c.a = a;
        drawHUDText(t, vec3(.5,.15), .25-a*.1, c, undefined,undefined,undefined,900,undefined,undefined,0,.03);
    }
    
    if (!startCountdown)
    {
        const wave1 = .04*(1 - abs(Math.sin(time*2)));
        const win = playerWin, newRecord = playerNewRecord;
        if (gameOverTimer.isSet())
        {
            const c = win?YELLOW:WHITE;
            const wave2 = .04*(1 - abs(Math.sin(time*2+PI/2)));
            drawHUDText(win?'YOU':'GAME', vec3(.5,.15), .1+wave1, c, undefined,undefined,undefined,900,'italic',.5,0,undefined,4);
            drawHUDText(win?'WIN!':'OVER!', vec3(.5,.25), .1+wave2, c, undefined,undefined,undefined,900,'italic',.5,0,undefined,4);

            if (!win && newRecord && !bestTime)
                drawHUDText('NEW BEST!', vec3(.5,.54), .08+wave1/4, RED, undefined,'monospace',undefined,900,undefined,undefined,0,undefined,3);
        }
        else if (!startCountdownTimer.active() && !freeRide)
        {
            // big center checkpoint time
            const c = checkpointTimeLeft < 3 ? RED : checkpointTimeLeft < 10 ? YELLOW : WHITE;
            const t = checkpointTimeLeft|0;
            drawHUDText(t, vec3(.5,.09), .14, c, undefined,undefined,undefined,900,undefined,undefined,0,.04);
        }

        if (win)
        {
            // current time
            const timeString = formatTimeString(raceTime);
            drawHUDText('TIME', vec3(.5,.4), .08, WHITE, undefined,'monospace',undefined,900,undefined,undefined,0,undefined,3);
            drawHUDText(timeString, vec3(.5,.47), .08, WHITE, undefined,'monospace',undefined,900,undefined,undefined,0,undefined,3);
            newRecord && drawHUDText('NEW RECORD!', vec3(.5,.54), .08+wave1/4, RED, undefined,'monospace',undefined,900,undefined,undefined,0,undefined,3);
        }
        else if (!freeRide)
        {
            // current time
            const timeString = formatTimeString(raceTime);
            drawHUDText(timeString, vec3(.13,.04), .05, WHITE, undefined,'monospace');

            // current stage
            const level = debug&&testLevelInfo ? testLevelInfo.level+1 :playerLevel+1;
            drawHUDText('STAGE '+level, vec3(.87,.04), .05, WHITE, undefined,'monospace');
        }
    }

    //const mph = playerVehicle.velocity.z>>1;
    //const mphPos = vec3(.01,.95);
    //drawHUDText(mph+' MPH', mphPos, .08, RED, WHITE,undefined,'left',900,'italic');
    
    /*
    if (enableMusic && radioMusic>=0)
    {
        let size = .034 + .002*Math.sin(time*4);
        drawHUDText('𝅘𝅥𝅮 '+musicTrackNames[radioMusic], vec3(.83,.89), size, WHITE, BLACK,undefined,undefined,undefined,'italic');
    }
    */
}

///////////////////////////////////////////////////////////////////////////////

function HUDstickToSides(pos)
{
    pos = pos.copy();
    if (pos.x < .5)
        pos.x = pos.x * mainCanvasSize.y/mainCanvasSize.x;
    else
        pos.x = 1 - (1-pos.x) * mainCanvasSize.y/mainCanvasSize.x;
    return pos;
}

function drawHUDText(text, pos, size=.1, color=WHITE, shadowColor=BLACK, font='arial', textAlign='center', weight=400, style='', width, stickToSides=1, shadowScale=.07, outline)
{
    if (stickToSides)
        pos = HUDstickToSides(pos);
    size *= mainCanvasSize.y;
    if (width)
        width *= mainCanvasSize.y;
    pos = pos.multiply(mainCanvasSize);
    
    const context = mainContext;
    context.lineCap = context.lineJoin = 'round';
    context.font = `${style} ${weight} ${size}px ${font}`;
    context.textBaseline = 'middle';
    context.textAlign = textAlign;

    const shadowOffset = size*shadowScale;
    if (shadowOffset)
    {
        let c = shadowColor.copy();
        c.a = color.a;
        context.fillStyle = c;
        context.fillText(text, pos.x+shadowOffset, pos.y+shadowOffset, width);
    }

    context.lineWidth = outline;
    outline && context.strokeText(text, pos.x, pos.y, width);
    context.fillStyle = color;
    context.fillText(text, pos.x, pos.y, width);
}