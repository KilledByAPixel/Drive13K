'use strict';

const gamepadsEnable = enhancedMode;
const inputWASDEmulateDirection = enhancedMode;
const allowTouch = enhancedMode;
const isTouchDevice = allowTouch && window.ontouchstart !== undefined;
const touchGamepadEnable = enhancedMode;
const touchGamepadAlpha = .3;

///////////////////////////////////////////////////////////////////////////////
// Input user functions

const keyIsDown      = (key) => inputData[key] & 1; 
const keyWasPressed  = (key) => inputData[key] & 2 ? 1 : 0;
const keyWasReleased = (key) => inputData[key] & 4 ? 1 : 0;
const clearInput = () => inputData = [];

let mousePos = vec3();
const mouseIsDown      = keyIsDown;
const mouseWasPressed  = keyWasPressed;
const mouseWasReleased = keyWasReleased;

let isUsingGamepad;
const gamepadIsDown      = (key, gamepad=0) => !!(gamepadData[gamepad][key] & 1); 
const gamepadWasPressed  = (key, gamepad=0) => !!(gamepadData[gamepad][key] & 2); 
const gamepadWasReleased = (key, gamepad=0) => !!(gamepadData[gamepad][key] & 4); 
const gamepadStick       = (stick, gamepad=0) =>
    gamepadStickData[gamepad] ? gamepadStickData[gamepad][stick] || vec3() : vec3();
const gamepadGetValue    = (key, gamepad=0) => gamepadDataValues[gamepad][key]; 

///////////////////////////////////////////////////////////////////////////////
// Input event handlers

let inputData = []; // track what keys are down

function inputInit()
{
    if (gamepadsEnable)
    {
        gamepadData = [];
        gamepadStickData = [];
        gamepadDataValues = [];
        gamepadData[0] = [];
        gamepadDataValues[0] = [];
    }

    onkeydown = (e)=>
    {
        isUsingGamepad = 0;
        if (!e.repeat)
        {
            inputData[e.code] = 3;
            if (inputWASDEmulateDirection)
                inputData[remapKey(e.code)] = 3;
        }
    }

    onkeyup = (e)=>
    {
        inputData[e.code] = 4;
        if (inputWASDEmulateDirection)
            inputData[remapKey(e.code)] = 4;
    }
    
    // mouse event handlers
    onmousedown   = (e)=>
    {
        isUsingGamepad = 0;
        inputData[e.button] = 3; 
        mousePos = mouseToScreen(vec3(e.x,e.y)); 
    }
    onmouseup     = (e)=> inputData[e.button] = inputData[e.button] & 2 | 4;
    onmousemove   = (e)=>
    {
        mousePos = mouseToScreen(vec3(e.x,e.y));
        if (freeCamMode)
        {
            mouseDelta.x += e.movementX/mainCanvasSize.x;
            mouseDelta.y += e.movementY/mainCanvasSize.y;
        }
    }
    oncontextmenu = (e)=> false; // prevent right click menu

    // handle remapping wasd keys to directions
    const remapKey = (c) => inputWASDEmulateDirection ? 
        c == 'KeyW' ? 'ArrowUp' : 
        c == 'KeyS' ? 'ArrowDown' : 
        c == 'KeyA' ? 'ArrowLeft' : 
        c == 'KeyD' ? 'ArrowRight' : c : c;

    // init touch input
    isTouchDevice && touchInputInit();
}

function inputUpdate()
{
    // clear input when lost focus (prevent stuck keys)
    isTouchDevice || document.hasFocus() || clearInput();
    gamepadsEnable && gamepadsUpdate();
}

function inputUpdatePost()
{
    // clear input to prepare for next frame
    for (const i in inputData)
        inputData[i] &= 1;
}
    
// convert a mouse position to screen space
const mouseToScreen = (mousePos) =>
{
    if (!clampAspectRatios)
    {
        // canvas always takes up full screen
        return vec3(mousePos.x/mainCanvasSize.x,mousePos.y/mainCanvasSize.y);
    }
    else
    {
        const rect = mainCanvas.getBoundingClientRect();
        return vec3(percent(mousePos.x, rect.left, rect.right), percent(mousePos.y, rect.top, rect.bottom));
    }
}

///////////////////////////////////////////////////////////////////////////////
// gamepad input

// gamepad internal variables
let gamepadData, gamepadStickData, gamepadDataValues;

// gamepads are updated by engine every frame automatically
function gamepadsUpdate()
{
    const applyDeadZones = (v)=>
    {
        const min=.3, max=.8;
        const deadZone = (v)=> 
            v >  min ?  percent( v, min, max) : 
            v < -min ? -percent(-v, min, max) : 0;
        return vec3(deadZone(v.x), deadZone(-v.y)).clampLength();
    }

    // update touch gamepad if enabled
    isTouchDevice && touchGamepadUpdate();

    // return if gamepads are disabled or not supported
    if (!navigator || !navigator.getGamepads)
        return;

    // only poll gamepads when focused or in debug mode (allow playing when not focused in debug)
    if (!devMode && !document.hasFocus())
        return;

    // poll gamepads
    const gamepads = navigator.getGamepads();
    for (let i = gamepads.length; i--;)
    {
        // get or create gamepad data
        const gamepad = gamepads[i];
        const data = gamepadData[i] || (gamepadData[i] = []);
        const dataValue = gamepadDataValues[i] || (gamepadDataValues[i] = []);
        const sticks = gamepadStickData[i] || (gamepadStickData[i] = []);

        if (gamepad)
        {
            // read analog sticks
            for (let j = 0; j < gamepad.axes.length-1; j+=2)
                sticks[j>>1] = applyDeadZones(vec3(gamepad.axes[j],gamepad.axes[j+1]));
            
            // read buttons
            for (let j = gamepad.buttons.length; j--;)
            {
                const button = gamepad.buttons[j];
                const wasDown = gamepadIsDown(j,i);
                data[j] = button.pressed ? wasDown ? 1 : 3 : wasDown ? 4 : 0;
                dataValue[j] = percent(button.value||0,.1,.9); // apply deadzone
                isUsingGamepad ||= !i && button.pressed;
            }

            const gamepadDirectionEmulateStick = 1;
            if (gamepadDirectionEmulateStick)
            {
                // copy dpad to left analog stick when pressed
                const dpad = vec3(
                    (gamepadIsDown(15,i)&&1) - (gamepadIsDown(14,i)&&1), 
                    (gamepadIsDown(12,i)&&1) - (gamepadIsDown(13,i)&&1));
                if (dpad.lengthSquared())
                    sticks[0] = dpad.clampLength();
            }
        }
    }
}

///////////////////////////////////////////////////////////////////////////////
// touch input

// try to enable touch mouse
function touchInputInit()
{
    // add non passive touch event listeners
    let handleTouch = handleTouchDefault;
    if (touchGamepadEnable)
    {
        // touch input internal variables
        handleTouch = handleTouchGamepad;
        touchGamepadButtons = [];
        touchGamepadStick = vec3();
    }
    document.addEventListener('touchstart', (e) => handleTouch(e), { passive: false });
    document.addEventListener('touchmove',  (e) => handleTouch(e), { passive: false });
    document.addEventListener('touchend',   (e) => handleTouch(e), { passive: false });

    // override mouse events
    onmousedown = onmouseup = ()=> 0;

    // handle all touch events the same way
    let wasTouching;
    function handleTouchDefault(e)
    {
        // fix stalled audio requiring user interaction
        if (soundEnable && !audioContext)
            audioContext = new AudioContext; // create audio context
        //if (soundEnable && audioContext && audioContext.state != 'running')
        //    sound_bump.play(); // play sound to fix audio

        // check if touching and pass to mouse events
        const touching = e.touches.length;
        const button = 0; // all touches are left mouse button
        if (touching)
        {
            // average all touch positions
            const p = vec3();
            for (let touch of e.touches)
            {
                p.x += touch.clientX/e.touches.length;
                p.y += touch.clientY/e.touches.length;
            }

            mousePos = mouseToScreen(p);
            wasTouching ? 0 : inputData[button] = 3;
        }
        else if (wasTouching)
            inputData[button] = inputData[button] & 2 | 4;

        // set was touching
        wasTouching = touching;

        // prevent default handling like copy and magnifier lens
        if (document.hasFocus()) // allow document to get focus
            e.preventDefault();
        
        // must return true so the document will get focus
        return true;
    }
}

///////////////////////////////////////////////////////////////////////////////
// touch gamepad

// touch gamepad internal variables
let touchGamepadTimer = new Timer, touchGamepadButtons, touchGamepadStick, touchGamepadSize;

// special handling for virtual gamepad mode
function handleTouchGamepad(e)
{
    if (soundEnable)
    {
        if (!audioContext)
            audioContext = new AudioContext; // create audio context
            
        // fix stalled audio
        if (audioContext.state != 'running')
            audioContext.resume();
    }

    // clear touch gamepad input
    touchGamepadStick = vec3();
    touchGamepadButtons = [];
    isUsingGamepad = true;
        
    const touching = e.touches.length;
    if (touching)
    {
        touchGamepadTimer.set();
        if (paused || titleScreenMode || gameOverTimer.isSet())
        {
            // touch anywhere to press start
            touchGamepadButtons[9] = 1;
            return;
        }
    }

    // get center of left and right sides
    const stickCenter = vec3(touchGamepadSize, mainCanvasSize.y-touchGamepadSize);
    const buttonCenter = mainCanvasSize.subtract(vec3(touchGamepadSize, touchGamepadSize));
    const startCenter = mainCanvasSize.scale(.5);

    // check each touch point
    for (const touch of e.touches)
    {
        let touchPos = mouseToScreen(vec3(touch.clientX, touch.clientY));
        touchPos = touchPos.multiply(mainCanvasSize);
        if (touchPos.distance(stickCenter) < touchGamepadSize)
        {
            // virtual analog stick
            touchGamepadStick = touchPos.subtract(stickCenter).scale(2/touchGamepadSize);
            //touchGamepadStick = touchGamepadStick.clampLength(); // circular clamp
            touchGamepadStick.x = clamp(touchGamepadStick.x,-1,1);
            touchGamepadStick.y = clamp(touchGamepadStick.y,-1,1);
        }
        else if (touchPos.distance(buttonCenter) < touchGamepadSize)
        {
            // virtual face buttons
            const button = touchPos.y > buttonCenter.y ? 1 : 0;
            touchGamepadButtons[button] = 1;
        }
        else if (touchPos.distance(startCenter) < touchGamepadSize)
        {
            // hidden virtual start button in center
            touchGamepadButtons[9] = 1;
        }
    }

    // call default touch handler so normal touch events still work
    //handleTouchDefault(e);

    // prevent default handling like copy and magnifier lens
    if (document.hasFocus()) // allow document to get focus
        e.preventDefault();
    
    // must return true so the document will get focus
    return true;
}

// update the touch gamepad, called automatically by the engine
function touchGamepadUpdate()
{
    if (!touchGamepadEnable)
        return;

    // adjust for thin canvas
    touchGamepadSize = clamp(mainCanvasSize.y/8, 99, mainCanvasSize.x/2);

    ASSERT(touchGamepadButtons, 'set touchGamepadEnable before calling init!');
    if (!touchGamepadTimer.isSet())
        return;
    
    // read virtual analog stick
    const sticks = gamepadStickData[0] || (gamepadStickData[0] = []);
    sticks[0] = touchGamepadStick.copy();

    // read virtual gamepad buttons
    const data = gamepadData[0];
    for (let i=10; i--;)
    {
        const wasDown = gamepadIsDown(i,0);
        data[i] = touchGamepadButtons[i] ? wasDown ? 1 : 3 : wasDown ? 4 : 0;
    }
}

// render the touch gamepad, called automatically by the engine
function touchGamepadRender()
{
    if (!touchGamepadEnable || !touchGamepadTimer.isSet())
        return;
    
    // fade off when not touching or paused
    const alpha = percent(touchGamepadTimer.get(), 4, 3);
    if (!alpha || paused)
        return;

    // setup the canvas
    const context = mainContext;
    context.save();
    context.globalAlpha = alpha*touchGamepadAlpha;
    context.strokeStyle = '#fff';
    context.lineWidth = 3;

    // draw left analog stick
    context.fillStyle = touchGamepadStick.lengthSquared() > 0 ? '#fff' : '#000';
    context.beginPath();

    // draw circle shaped gamepad
    const leftCenter = vec3(touchGamepadSize, mainCanvasSize.y-touchGamepadSize);
    context.arc(leftCenter.x, leftCenter.y, touchGamepadSize/2, 0, 9);
    context.fill();
    context.stroke();

    // draw right face buttons
    const rightCenter = vec3(mainCanvasSize.x-touchGamepadSize, mainCanvasSize.y-touchGamepadSize);
    for (let i=2; i--;)
    {
        const pos = rightCenter.add(vec3(0,(i?1:-1)*touchGamepadSize/2));
        context.fillStyle = touchGamepadButtons[i] ? '#fff' : '#000';
        context.beginPath();
        context.arc(pos.x, pos.y, touchGamepadSize/3, 0, 9);
        context.fill();
        context.stroke();
    }

    // set canvas back to normal
    context.restore();
}