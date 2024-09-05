'use strict';

let HUDButtons = [];
let radioMusic = -1;

function initHUD()
{
    //function togglePause()  {console.log('Pause');}
    //HUDButtons.push(new HUDButton('Pause', vec3(.5,.5), vec3(.3,.1), togglePause));

    HUDButtons.push(new HUDButton('RADIO', vec3(.63,.95), vec3(.15,.08), 0,YELLOW,0));
    for(let i=4; i--;)
    {
        let c = hsl(.1,1,.5);
        let b = new HUDButton(i==3?'OFF':i+1, vec3(.73+i*.07,.95), vec3(.06), undefined, c);
        b.musicTrack = i==3?-1:i;
        b.onClick = o=>
        {
            sound_click.play();
            playMusicTrack(i);
            radioMusic = b.musicTrack;
        }
        HUDButtons.push(b);
    }
}

function drawHUD()
{
    if (attractMode)
    {
        let t = 'Click to Play';
        let a = 1 - Math.abs(Math.sin(time*2));
        a = .5 + a*.5;
        drawHUDText(t, vec3(.5,.95), .06, hsl(.1,1,a), .005, undefined,undefined,undefined,900,undefined,undefined,0);

        for(let j=2;j--;)
        {
            // draw logo
            let text = j?'DR1V3N':'WILD';
            let pos = vec3(.47,.25-j*.15);
            let size = .12;
            let weight = 900;

            pos = pos.multiply(mainCanvasSize);
            size = size * mainCanvasSize.y;
            let style = 'italic';
            let font = 'arial';
                    
            const context = mainContext;
            context.strokeStyle = BLACK;
            context.lineWidth = size*.1;
            context.textBaseline = 'middle';
            context.textAlign = 'center';
            context.lineJoin = 'round';

            let totalWidth = 0;
            for(let k=2;k--;)
            {
                for(let i=0;i<text.length;i++)
                {
                    const p = Math.sin(i-time*2-j*2);
                    const size2 = size + p*.05*mainCanvasSize.y;
                    context.font = style + ' ' + weight + ' ' + size2 + 'px '+font;
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
                        const o = f*.01*mainCanvasSize.y;
                        context.fillStyle = hsl(.15+p/9,1,!f?.75+p*.25:0);
                        context.fillText(c, x+o, pos.y+o);
                    }
                    pos.x += w;
                }
            }
        }
        return;
    }

    if (startCountdownTimer.active() || startCountdown > 0)
    {
        if (startCountdown < 4)
        {
            // count down
            let a = 1-time%1;
            let t = startCountdown|0;
            if (startCountdown == 0 && startCountdownTimer.active())
                t = 'GO!';

            let colors = [GREEN, RED, RED, RED];
            let c = colors[startCountdown].copy();
            c.a = a;

            drawHUDText(t, vec3(.5,.2), .3-a*.1, c, .005, undefined,undefined,undefined,900,undefined,undefined,0);
        }
    }
    else
    {
        if (gameOverTimer.isSet())
        {
            const c = WHITE;
            const s1 = .04*(1 - Math.abs(Math.sin(time*2)));
            const s2 = .04*(1 - Math.abs(Math.sin(time*2+PI/2)));
            drawHUDText('GAME', vec3(.5,.1), .1+s1, c, .005, undefined,undefined,undefined,900,'italic',.5,0);
            drawHUDText('OVER!', vec3(.5,.2), .1+s2, c, .005, undefined,undefined,undefined,900,'italic',.5,0);

        }
        else
        {
            const c = checkpointTimeLeft < 3 ? RED : checkpointTimeLeft < 10 ? YELLOW : WHITE;
            const t = checkpointTimeLeft|0;
            drawHUDText(t, vec3(.5,.1), .15, c, .005, undefined,undefined,undefined,900,undefined,undefined,0);
        }
    }

    const mph = playerVehicle.velocity.z|0;
    const aspect = mainCanvasSize.x/mainCanvasSize.y;
    const mphPos = vec3(.01,.95)
    if (aspect > .75)
        drawHUDText(mph+' MPH', mphPos, .08, RED, .005, WHITE,undefined,'left',900,'italic');
    if (radioMusic>=0)
    {
        let size = .034 + .002*Math.sin(time*4);
        drawHUDText('𝅘𝅥𝅮 '+musicTrackNames[radioMusic], vec3(.83,.89), size, WHITE, .003, BLACK,undefined,undefined,undefined,'italic');
    }

    for(const b of HUDButtons)
        b.draw();
}

class HUDButton
{
    constructor(text, pos, size, onClick, color=WHITE, backgroundColor=hsl(.6,1,.2))
    {
        this.text = text;
        this.pos = pos;
        this.size = size;
        this.onClick = onClick;
        this.color = color;
        this.backgroundColor = backgroundColor;
    }

    draw()
    {
        // stick to sides
        let pos = this.pos.copy();
        let backgroundColor = this.backgroundColor; 
        let color = this.color;
        let outlineColor = WHITE;

        if (this.musicTrack == radioMusic)
        {
            backgroundColor = hsl(radioMusic<0?0:.1,1,.5);
            color = WHITE;
            outlineColor = BLACK
        }

        backgroundColor && drawHUDRect(pos, this.size,backgroundColor,.005,outlineColor);

        pos.y += this.size.y*.05;
        drawHUDText(this.text, pos, this.size.y*.8, color, .005, undefined,undefined,undefined,900,undefined, this.size.x*.75);

        {
            pos = HUDstickToSides(pos);

            const size = this.size.scale(mainCanvasSize.y);
            const p1 = pos.multiply(mainCanvasSize);
            const p2 = mousePos.multiply(mainCanvasSize);
            if (this.onClick && mouseWasPressed(0))
            if (isOverlapping(p1, size, p2))
                this.onClick();
        }
    }
}

function HUDstickToSides(pos)
{
    pos = pos.copy();
    if (pos.x < .5)
        pos.x = pos.x * mainCanvasSize.y/mainCanvasSize.x;
    else
        pos.x = 1 - (1-pos.x) * mainCanvasSize.y/mainCanvasSize.x;
    return pos;
}

///////////////////////////////////////////////////////////////////////////////

function drawHUDRect(pos, size, color=WHITE, lineWidth=0, lineColor=BLACK)
{
    pos = HUDstickToSides(pos);

    lineWidth *= mainCanvasSize.y;
    size = size.scale(mainCanvasSize.y);
    pos = pos.multiply(mainCanvasSize).subtract(size.scale(.5));

    const context = mainContext;
    context.fillStyle = color;
    context.strokeStyle = lineColor;
    context.lineWidth = lineWidth;
    context.fillRect(pos.x, pos.y, size.x, size.y);
    lineWidth && context.strokeRect(pos.x, pos.y, size.x, size.y);
}

function drawHUDText(text, pos, size=.1, color=WHITE, shadowOffset=0, shadowColor=BLACK, font='arial', textAlign='center', weight=400, style='', width, stickToSides=1)
{
    if (stickToSides)
        pos = HUDstickToSides(pos);

    size *= mainCanvasSize.y;
    if (width)
        width *= mainCanvasSize.y;
    shadowOffset *= mainCanvasSize.y;
    pos = pos.multiply(mainCanvasSize);

    const context = mainContext;
    context.font = style + ' ' + weight + ' ' + size + 'px '+font;
    context.textBaseline = 'middle';
    context.textAlign = textAlign;

    if (shadowOffset)
    {
        let c = shadowColor.copy();
        c.a = color.a;
        context.fillStyle = c;
        context.fillText(text, pos.x+shadowOffset, pos.y+shadowOffset, width);
    }
    
    context.fillStyle = color;
    context.fillText(text, pos.x, pos.y, width);
}