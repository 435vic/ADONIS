const GAMEPAD_FPS = 15;

let gamepadWorker;

window.addEventListener('gamepadconnected', (event) => {
    console.log('Gamepad connected.');
    gamepadWorker = setInterval(processGamepad, 1000 / GAMEPAD_FPS);
});

window.addEventListener('gamepaddisconnected', (event) => {
    console.log('Gamepad disconnected.');
    if (gamepadWorker) clearInterval(gamepadWorker);
});

function processGamepad() {
    const gamepads = navigator.getGamepads();
    if (!gamepads.length && gamepads[0]) return;
    const pad = gamepads[0];
    const $dot = $('#joystick-indicator');
    $dot.css({
        'top': `calc(${mapAxis(pad.axes[1])}% - 2.5px)`,
        'left': `calc(${mapAxis(pad.axes[0])}% - 2.5px)`
    });
    const $mleft = $('#motor-indicator-left');
    const $mright = $('#motor-indicator-right');
    const throttle = pad.buttons[7].value/2-pad.buttons[6].value/2;
    if (throttle >= 0) {
        $mleft.addClass('bottom')
        $mleft.removeClass('top')

        $mright.addClass('bottom')
        $mright.removeClass('top')
    } else {
        $mleft.addClass('top')
        $mleft.removeClass('bottom')

        $mright.addClass('top')
        $mright.removeClass('bottom')
    }

    $mleft.css({
        'height': `${Math.abs(throttle)*100}%`
    });
    $mright.css({
        'height': `${Math.abs(throttle)*100}%`
    });
    const $campan = $('#control-camera-pan')
    $campan.val(mapAxis(pad.axes[2]));

    const $leg = $('#control-support-leg');
    const legUp = pad.buttons[4];
    const legDown = pad.buttons[5];
    // 50n = 1s; 1n = 0.02s
    // 1s = 50n
    // 1/FPS s = ?n
    const adjRate = (1/GAMEPAD_FPS) * 100;
    const val = parseInt($leg.val());
    if (legUp.pressed && !legDown.pressed) {
        $leg.val(val+adjRate);
    } else if (legDown.pressed && !legUp.pressed) {
        $leg.val(val-adjRate);
    }

    const data = {
        joystick: [Math.floor(pad.axes[0]*100), Math.floor(pad.axes[1]*100)],
        throttle: Math.floor(throttle*200),
        campan: Math.floor($campan.val()),
        leg: parseInt($leg.val())
    };
    if (pad.buttons[0].pressed) console.log(data);

    if (socket.connected) {
        socket.emit('controller', data);
    }
}

function mapAxis(axis, deadzone = 10, cap = 100) {
    const n = axis*100;
    if (Math.abs(n) < deadzone) return 50;
    return parseInt(scale(n, -100, 100, 100-cap, cap));
}
