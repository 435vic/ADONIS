const socket = io();

window.onload = () => {
    const ox = 60*8 - 480/2;

    socket.on('connect', () => {
        console.log("Connected")
    });
    socket.on('frame-meta', data => {
        const rects = data.motion
        if (rects.length == 0) return;
        const frames = document.body.getElementsByClassName('stream-annotation');
        // const [x, y, w, h] = rects[0];
        const [x, y, w, h] = [630, 470, 10, 10];
        frames[0].setAttribute('style', `left:calc(0px + ${x/6.4}%);top:${y/4.8}%;width:${w/6.4}%;height:${h/4.8}%`);
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

