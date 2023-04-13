function onKeyDown(event) {
    
}

function onKeyUp(event) {

}

function onControlSignal(event) {
    console.log(event.type, event.target)
}

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
}

