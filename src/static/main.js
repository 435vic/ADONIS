const socket = io();

socket.on("connect", () => {
    console.log("Connected")
    socket.emit('ping', res => {
        console.log(`Got response from ping: ${res}`)
    });
});

window.onload = () => {
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

