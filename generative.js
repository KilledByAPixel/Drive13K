'use strict';

/*

trees
cactus
grass
signs
girders
fences
billboards
buildings
telepone poles
wind turbines
water towers
tunnels
lights
side streets
flowers
plants


distance
- mountains
- buildings
- sun


0  shapes
1  trees
2  plants
3  rocks
4  structures
5  signs
6  misc
7  background
8
9
10
11
12
13
14
15



*/

let generativeCanvas, generativeContext;

const generativeTileSize = 256;
const generativeCanvasSize = vec3(generativeTileSize*8,generativeTileSize*8,1);
const generativeTileSizeVec3 = vec3(generativeTileSize,generativeTileSize,0);
    
function initGenerative()
{
    generativeCanvas = document.createElement('canvas');
    generativeContext = generativeCanvas.getContext('2d');
    generativeCanvas.width = generativeCanvasSize.x;
    generativeCanvas.height = generativeCanvasSize.y;
    generateTetures();
    
    glActiveTexture = glCreateTexture(generativeCanvas);
    glContext.bindTexture(gl_TEXTURE_2D, glActiveTexture);
}

function generateTetures()
{
    const context = generativeContext;
    random.setSeed(13);

    class Particle
    {
        constructor(x, y, vx, vy, accel, sizeStart=.1, sizeEnd=0, c=BLACK)
        {
            this.x = x;
            this.y = y;
            this.vx = vx;
            this.vy = vy;
            this.accel = accel;
            this.sizeStart = sizeStart;
            this.sizeEnd = sizeEnd;
            this.color = c;
            this.style = 0;
            this.colorRandom = 0;
            this.iterations = 50;
        }

        draw()
        {
            for(let i=this.iterations|0;i-->0;)
            {
                if (this.color)
                    color(random.mutateColor(this.color, this.colorRandom))
                const p = i/this.iterations;
                const x1 = this.x + this.vx * p;
                const y1 = this.y + this.vy * p + this.accel * p * p;
                let s;
                if (this.style)
                    s = Math.sin(p*PI)*(this.sizeStart-this.sizeEnd) + this.sizeEnd;
                else
                    s = lerp(p, this.sizeStart, this.sizeEnd);
                rect(x1, y1, s, s);
            }
        }
    };

    {
        // basic shapes
        color(hsl(0,0,1));
        setupContext(0,0);
        circle(.5,.5,.45);
        setupContext(1,0);
        //radialGradient(.5,.5,0,.45,hsl(0,0,1),hsl(0,0,1,0));
        //circle(.5,.5,.45);
        for(let i=40;i--;)
            color(hsl(0,0,1,i/300)),
            circle(.5,.5,.5-i/80);
        setupContext(2,0);
        for(let i=40,a;i--;)
        {
            color(hsl(0,0,1,a=i/40)),
            rect(.5,.5,.5-a/3,.9-a/3);
        }
        setupContext(3,0);
        drawLicensePlate();
        setupContext(4,0);
        text('13',.5,.5,1,.9,.03,'impact'); 
        setupContext(5,0);
        drawStartSign();
        setupContext(6,0);
        drawCheckpointSign();
        setupContext(7,0);
        drawCheckpointSign(1);

        // plants
        setupContext(0,1);
        drawPalmTree();
        setupContext(1,1);
        drawGrass();
        setupContext(2,1);
        drawTree();

        // signs
        setupContext(0,2);
        drawJS13kSign();
        setupContext(1,2);
        drawBounceBackSign();
        setupContext(2,2);
        drawGenericSign('GitHub',.3,BLACK,WHITE);
        setupContext(3,2);
        drawLittleJSSign();
        setupContext(4,2);
        drawHarrisSign();
        setupContext(5,2);
        drawGenericSign('★VOTE★',.4,BLACK,WHITE);
        setupContext(6,2);
        drawDwitterSign('dwitter.net',.3,BLACK,WHITE,'courier new');
        setupContext(7,2);
        drawAvalancheSign();

        // more signs
        setupContext(0,3);
        drawZZFXSign();
    }

    {
        // make hard alpha
        const w = generativeCanvas.width, h = generativeCanvas.height;
        const imageData = context.getImageData(0, generativeTileSize, w, h);
        const data = imageData.data;
        for (let i=3; i<data.length; i+=4)
            data[i] = data[i] < 128 ? 0 : 255;
        context.putImageData(imageData, 0, generativeTileSize);
    }

    function setupContext(x,y)
    {
        // set context transform to go from 0-1 to 0-size
        const w = generativeTileSize;
        context.restore();
        context.save();
        context.setTransform(w,0,0,w,w*x,w*y);
        context.beginPath();
        context.rect(0,0,1,1);
        context.clip();
    }

    function particle(...a) { return new Particle(...a); }
    function circle(x,y,r) { ellipse(x,y,r,r); }
    function rect(x=.5,y=.5,w=1,h=1) { context.fillRect(x-w/2,y-h/2,w,h); }
    function rectOutline(x=.5,y=.5,w=1,h=1,l=.05)
    { context.lineWidth=l; context.strokeRect(x-w/2,y-h/2,w,h); }
    function color(c=WHITE) { context.fillStyle = c; }
    function lineColor(c=WHITE) { context.strokeStyle = c; }

    function radialGradient(x,y,r1,r2,color1,color2=WHITE)
    {
        const g = context.createRadialGradient(x,y,r1,x,y,r2);
        g.addColorStop(0,color1);
        g.addColorStop(1,color2);
        color(g);
    }

    function linearGradient(x1,y1,x2,y2,color1,color2=WHITE)
    {
        const g = context.createLinearGradient(x1,y1,x2,y2);
        g.addColorStop(0,color1);
        g.addColorStop(1,color2);
        color(g);
    }

    function ellipse(x=.5,y=.5,w=.5,h=.5,a=0)
    {
        context.beginPath();
        context.ellipse(x,y,max(0,w),max(0,h),a,0,9);
        context.fill();
    }

    function line(x1,y1,x2,y2,w=.1)
    {
        context.lineWidth = w;
        context.beginPath();
        context.lineTo(x1,y1);
        context.lineTo(x2,y2);
        context.stroke();
    }

    function polygon(sides=3, x=.5, y=.5, r=.5, ao=0)
    {
        context.beginPath();
        for(let i=sides; i--;)
        {
            const a = i/sides*PI*2;
            context.lineTo(x+r*Math.sin(a+ao), y-r*Math.cos(a+ao));
        }
        context.fill();
    }

    function text(s, x=.5, y=.5, size=1, width=.95, lineWidth=0, font='arial', textAlign='center', weight=400, style='')
    {
        context.lineWidth = lineWidth;
        context.font = style + ' ' + weight + ' ' + size + 'px '+font;
        context.textBaseline = 'middle';
        context.textAlign = textAlign;
        context.lineJoin = 'round';
        context.fillText(s, x, y, width);
        lineWidth && context.strokeText(s, x, y, width);
    }

    function drawPalmTree()
    {
        let p = particle(.3,.29,.3,.5,.5,.02,.06);
        p.color = hsl(.1,.5,.1);
        p.colorRandom = .1;
        p.draw();

        for(let j=12;j--;)
        {
            let v = .3, a = j/12*PI*2
            let vx = Math.sin(a) * v, vy = Math.cos(a) * v;;
            let p = particle(.3,.23,vx,vy-.1,.2,.05,.005);
            p.style = 1;
            p.color = hsl(.3,.6,random.float(.3,.5));
            p.colorRandom = .1;
            p.draw();
        }
    }

    function drawTree()
    {
        color(hsl(.1,.5,.1));
        rect(.5,1,.05,1);
        let z = 500
        for(let i=z;i--;)
        {
            let p = i/z;
            color(hsl(0,0,random.float(.6,.9)));
            rect(.5+random.floatSign(p/4),p*.9,.05,.05);
        }
    }

    function drawGrass()
    {
        for(let i=60;i--;)
        {
            let x = .5+random.floatSign(.3);
            let p = particle(x,1,random.floatSign(.25),random.floatSign(-.6,-1),.5,.02);
            p.color = hsl(0,0,random.float(.6,.9));
            p.iterations=100
            p.draw();
        }
    }
    
    function drawSignBackground(w=1,h=.9,c=WHITE,outlineColor=hsl(0,0,.1),outline=.05,legColor=c, legSeparation=.2)
    {
        color(legColor);
        rect((.5-legSeparation)*w,.5,.1,1);
        rect((.5+legSeparation)*w,.5,.1,1);
        color(c);
        rect(w/2,h/2,w,h);
        color(outlineColor);
        rect(w/2,h/2,w-outline,h-outline);
    }

    function drawJS13kSign()
    {
        drawSignBackground();
        color();
        text('JS',.25,.27,.5,.35,0,'courier new',undefined,600);
        text('GAMES',.5,.66,.5,.9,0,'courier new',undefined,600);
        color(hsl(1,.8, .5));
        text('13K',.67,.27,.5,.5,0,'courier new',undefined,600);
    }

    function drawBounceBackSign()
    {
        drawSignBackground();
        for(let i=300;i--;)
        {
            let p = 1-i/300;
            let b = Math.abs(3-4*p);
            let l = i ? 0 : .02;
            color(hsl(p*2,1,.5));
            lineColor();
            text('BOUNCE',.5,.5-b*.15,.02+p*.3,.85,l,undefined,undefined,800);
            text('BACK',  .5,.5+b*.12,.02+p*.3,.85,l,undefined,undefined,800);
        }
    }

    function drawDwitterSign(t,size=.5,c=WHITE,color2=BLACK,font)
    {
        let signSize = size+.33
        drawSignBackground(1,signSize,c,color2);
        color(c);
        text(t,.5,.2,size,.9,0,font,undefined,600);
        const w = .03;
        for(let i=9;i--;)
            rect(.25+i*w*2,.44,w,w*4);
    }
    function drawAvalancheSign()
    {
        drawSignBackground(1,.9,hsl(0,0,.2),WHITE);
        let c = hsl(0, .8, .6);
        color(c);
        lineColor(c);
        let y = .37;
        circle(.5,y,.32);
        text('AVALANCHE',.5,.8,.15,.9,0,undefined,undefined,600);
        color(WHITE);
        polygon(3, .5,y, .25);
        let r = .3;
        let ox = r*Math.cos(PI/3);
        let oy = r*Math.sin(PI/3);
        let x = .46;
        y += .15;
        line(x,y,x+ox,y-oy,.07);
    }

    function drawNewgroundsSign()
    {
        let size=.2,c=WHITE,color2=hsl(.57, .1, .14);
        let signSize = size+.1
        drawSignBackground(1,signSize,c,color2,.05,BLACK,0);
        color(c);
        const y = (signSize+.05)/2;
        const o = hsl(.08, 1, .61);
        color(o);
        lineColor(o)
        text('NEW',.2,y,size,.25,.02,'Verdana');
        color();
        lineColor()
        text('GROUNDS',.6,y,size,.55,.02);
    }

    function drawGenericSign(t,size=.5,c=WHITE,color2=BLACK,font)
    {
        let signSize = size+.1
        drawSignBackground(1,signSize,c,color2);
        color(c);
        text(t,.5,(signSize+.05)/2,size,.9,0,font,undefined,600);
    }

    function drawZZFXSign(t='ZZFX')
    {
        drawSignBackground(1,.6,BLACK,hsl(0,0,.2));
        color(hsl(.6,1,.5));
        let x = .47, y = .38, o = .03;
        text(t,x,y,.55,.8,0,undefined,undefined,900);
        color(YELLOW);
        text(t,x+o,y-o,.55,.8,0,undefined,undefined,900);
        color(hsl(.96,1,.5));
        lineColor(WHITE)
        text(t,x+2*o,y-2*o,.55,.8,.01,undefined,undefined,900);
    }

    function drawHarrisSign()
    {
        drawSignBackground(1,.6,WHITE,hsl(.6,.9,.3),.05,BLACK,.5);
        color(WHITE);
        text('HARRIS',.5,.24,.31,.85,0,undefined,undefined,800);
        text('WALZ',.5,.46,.2,1,0,undefined,undefined,800);
    }

    function drawLittleJSSign()
    {
        //hsl(.55, .88, .81)
        drawSignBackground(1,.7,BLACK,WHITE,.05,WHITE,0);
        color();
        ljsText('LittleJS',0.05,.25);
        ljsText('Engine',0.11,.5,2);

        function ljsText(t,x,y,o=0)
        {
            for(let i=0;i<t.length;i++)
            {
                let weight = 900, fontSize = .21, font = 'arial';
                context.font = weight+' ' + fontSize + 'px '+font;
                let w = context.measureText(t[i]).width;
                color(hsl([1,.3,.57,.14][(i+o)%4],.9,.5));
                text(t[i],x+w/2,y,fontSize,1,.03,font,undefined,weight);
                text(t[i],x+w/2,y,fontSize,1,0,font,undefined,weight);
                x += w;
            }
        }
    }

    function drawStartSign()
    {
        drawSignBackground(1,.25,WHITE,WHITE,.05,GRAY,.5);
        color(RED);
        lineColor(BLACK);
        text('START',.5,.16,.25,1,.01,undefined,undefined,600);
    }

    function drawCheckpointSign(side=0)
    {
        color(hsl(0,0,.2));
        rect(side,.5,.2,1);
        color(WHITE);
        rect(.5,0,1,.5);
        color(hsl(.3,.7,.5));
        text('CHECK',.5,.16,.27,.95,.01,undefined,undefined,600);
    }
    
    function drawLicensePlate(t='JS-13K')
    {
        color(hsl(0,0,.8))
        rect();
        color(hsl(232/360, .9, .25));
        lineColor(BLACK);
        text(t,.5,.6,1,.9,0,'monospace',undefined,600);
        //color(hsl(33/360, .68, .5))
        //rect(.5,.14,.8,.02);
        //rect(.5,.2,.8,.05);
        //rect(.5,.93,.4,.03);
        //ellipse(.5,.15,.05,.1);
        //color(hsl(349/360, .83, .28))
        //text('CALIFORNIA',.5,.12,.08);
    }
}