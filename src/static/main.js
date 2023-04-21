// Origin of video on the X axis
let stream, streamContainer;

// stream dimensions
let streamWidth, streamHeight, containerWidth, containerHeight, streamOriginX, streamOriginY;

let _settings = null;

$(document).ready(() => {
    stream = $('#main-stream');
    streamContainer = $('.main-stream-container');

    streamWidth = stream.width();
    streamHeight= stream.height();
    containerWidth = streamContainer.width();
    containerHeight = streamContainer.height();
    streamOriginX = (containerWidth - streamWidth)/2;
    streamOriginY = (containerHeight - streamHeight)/2;

    createControls();
    // Socket
    const socket = io();

    socket.on('connect', () => {
        console.log("Connected")
    });

    socket.on('ping', callback => {
        callback('pong')
    });

    socket.on('frame-meta', processFrameMeta);
});


async function getSettings() {
    if (!_settings) {
        _settings = await new Promise((resolve, reject) => $.getJSON('res/settings.json').done(resolve).fail(reject));
        return _settings;
    }
    return _settings;
}

async function createControls() {
    // Generate control DOM elements
    const config = await getSettings().catch(err => {
        console.log(`Failed to get config: ${err}`);
        return;
    });
    for (let action of config.controls.actions) {
        const button = $('<button>', {
            id: `control-${action.id}`,
            'class': 'control'
        });
        button.appendTo('.controls-container');
        button.text(action.name);
        button.on('mousedown', onAction);
        button.on('mouseup', onAction);
    }
    $(document).on('keyup', processKey);
    $(document).on('keydown', processKey);
}

function onAction(event) {
    console.log(event.type, event.target)
    socket.emit('control', event.target.id, {
        type: event.type
    });
}

function processFrameMeta(data) {
    const rects = data.motion;
    let rectIndex = 0;
    for (rectIndex = 0; rectIndex < rects.length; rectIndex++) {
        let [x, y, w, h] =  rects[rectIndex];
        let xOffset = streamOriginX/containerWidth;
        let yOffset = streamOriginY/containerHeight;
        x = scale(x, 0, streamWidth, xOffset*100, 100 - (xOffset*100));
        y = scale(y, 0, streamHeight, yOffset*100, 100 - (yOffset*100));
        let frame = $(`#stream-annotation-${rectIndex}`);
        // create frames if they don't exist
        if (!frame.length) {
            let newFrame = $('<div>', {
                id: `stream-annotation-${rectIndex}`,
                'class': 'stream-annotation'
            });
            streamContainer.append(newFrame);
        }
        frame.removeAttr('style');
        frame.css({
            'left': `${x}%`,
            'top': `${y}%`,
            'width': `${w/(containerWidth/100)}%`,
            'height': `${h/(containerHeight/100)}%`,
        });
    }
    const nFrames = $('.stream-annotation').length;
    for (let i = rectIndex; i < nFrames; i++) {
        $(`#stream-annotation-${i}`).css('display', 'none');
    }
}

async function processKey(event) {
    const config = await getSettings().catch(() => {
        console.log(`Failed to get config: ${err}`);
        return;
    });

    for (let action of config.controls.actions) {
        if (!(action.key == event.key || action.key.includes(event.key))) continue;
        $(`#control-${action.id}`).trigger({
            type: (event.type == 'keyup') ? 'mouseup' : 'mousedown'
        });
    }
}

// socket.on('frame-meta', data => {
//     const rects = data.motion
//     let rectIndex = 0;
//     for (rectIndex = 0; rectIndex < rects.length; rectIndex++) {
//         let [x, y, w, h] = rects[rectIndex];
//         x = scale(x, 0, 640, ox/9.6, 100-ox/9.6);
//         let frame = document.getElementById(`stream-annotation-${rectIndex}`);
//         if (!frame) {
//             let newFrame = document.createElement('div');
//             newFrame.id = `stream-annotation-${rectIndex}`;
//             newFrame.classList.add('stream-annotation');
//             streamContainer.append(newFrame);
//             frame = document.getElementById(`stream-annotation-${rectIndex}`);
//         }
//         frame.setAttribute('style', `left:${x}%;top:${y/4.8}%;width:${w/9.6}%;height:${h/4.8}%`);
//     }
//     const nFrames = document.getElementsByClassName('stream-annotation').length;
//     for (let i = rectIndex; i < nFrames; i++) {
//         let frame = document.getElementById(`stream-annotation-${i}`);
//         frame.setAttribute('style', 'display:none');
//     }
// });
// document.addEventListener('keydown', onKeyDown)
// document.addEventListener('keyup', onKeyUp)
// const controls = document.body
//     .getElementsByClassName('controls-container')[0]
//     .getElementsByClassName('control')
// for (let control of controls) {
//     const id = control.id.match(/control-(([a-z]+-)*[a-z]+-?)/)[0];
//     controls[id] = control;
//     control.addEventListener('mousedown', onControlSignal);
//     control.addEventListener('mouseup', onControlSignal);
// }

// console.log("Connecting")

// function onKeyDown(event) {
//     if (event.repeat) return;

// }

// function onKeyUp(event) {
//     console.log(event);
// }

// function onControlSignal(event) {
//     console.log(event.type, event.target)
//     socket.emit('control', event.target.id, {
//         type: event.type
//     });
// }

function scale (number, inMin, inMax, outMin, outMax) {
    return (number - inMin) * (outMax - outMin) / (inMax - inMin) + outMin;
}