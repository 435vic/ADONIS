const socket = io();

window.onload = () => {
    // Origin of video on the X axis
    const ox = (60*16-640)/2;
    const streamContainer = document.body.getElementsByClassName('main-stream-container')[0];

    socket.on('connect', () => {
        console.log("Connected")
    });
    socket.on('ping', callback => {
        callback('pong')
    });
    socket.on('frame-meta', data => {
        const rects = data.motion
        let rectIndex = 0;
        for (rectIndex = 0; rectIndex < rects.length; rectIndex++) {
            let [x, y, w, h] = rects[rectIndex];
            x = scale(x, 0, 640, ox/9.6, 100-ox/9.6);
            let frame = document.getElementById(`stream-annotation-${rectIndex}`);
            if (!frame) {
                newFrame = document.createElement('div');
                newFrame.id = `stream-annotation-${rectIndex}`;
                newFrame.classList.add('stream-annotation');
                streamContainer.append(newFrame);
                frame = document.getElementById(`stream-annotation-${rectIndex}`);
            }
            frame.setAttribute('style', `left:${x}%;top:${y/4.8}%;width:${w/9.6}%;height:${h/4.8}%`);
        }
        const nFrames = document.getElementsByClassName('stream-annotation').length;
        for (let i = rectIndex; i < nFrames; i++) {
            let frame = document.getElementById(`stream-annotation-${i}`);
            frame.setAttribute('style', 'display:none');
        }
    });
    document.addEventListener('keydown', onKeyDown)
    document.addEventListener('keyup', onKeyUp)
    const controls = document.body
        .getElementsByClassName('controls-container')[0]
        .getElementsByClassName('control')
    for (let control of controls) {
        control.addEventListener('mousedown', onControlSignal)
        control.addEventListener('mouseup', onControlSignal)
    }

    console.log("Connecting")
}

function onKeyDown(event) {
    
}

function onKeyUp(event) {

}

function onControlSignal(event) {
    console.log(event.type, event.target)
    socket.emit('control', event.target.id, {
        type: event.type
    });
}

function scale (number, inMin, inMax, outMin, outMax) {
    return (number - inMin) * (outMax - outMin) / (inMax - inMin) + outMin;
}
