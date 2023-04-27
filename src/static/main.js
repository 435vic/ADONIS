let stream, streamContainer;
// stream dimensions
let streamWidth, streamHeight, containerWidth, containerHeight, streamOriginX, streamOriginY;
let _settings;
// Socket
const socket = io();

$(document).ready(() => {
    stream = $('#main-stream');
    streamContainer = $('.main-stream-container');
    getStreamDimensions();

    createControls();

    socket.on('connect', () => {
        console.log("Connected")
    });

    socket.on('ping', callback => {
        callback('pong')
    });

    socket.on('frame-meta', processFrameMeta);
});

function getStreamDimensions() {
    streamWidth = stream.get(0).naturalWidth;
    streamHeight= stream.get(0).naturalHeight;
    containerWidth = streamContainer.width();
    containerHeight = streamContainer.height();
    streamOriginX = (containerWidth - streamWidth)/2;
    streamOriginY = (containerHeight - streamHeight)/2;
}


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
    for (let groupName of config.controls.groups) {
        const group = $('<div>', {
            id: `control-group-${groupName}`,
            'class': 'control-group'
        });
        group.appendTo('.controls-container');
    }

    for (let action of config.controls.actions) {
        const tag = action.html?.tag ? action.html.tag : 'button'
        const $element = $(`<${tag}>`, {
            id: `control-${action.id}`,
            'class': action.group ? `control control-group-${action.group}` : 'control',
            ...(action.html?.attributes ? action.html.attributes : {})
        });
        $element.appendTo(`#control-group-${action.group}`);
        if (action.text) $element.text(action.name);
        if (action.click) {
            $element.on('mousedown', onAction);
            $element.on('mouseup', onAction);
        }
    }
    $(document).on('keyup', processKey);
    $(document).on('keydown', processKey);

    const $circle = $('<div>', {
        id: 'joystick-indicator'
    });
    $circle.appendTo('#control-group-move');

    const $cl = $('<div>', {
        'class': 'motor-indicator-container',
        id: 'motor-indicator-container-left'
    });
    const $cr = $('<div>', {
        'class': 'motor-indicator-container',
        id: 'motor-indicator-container-right'
    });

    const $motorleft = $('<div>', {
        id: 'motor-indicator-left',
        'class': 'motor-indicator'
    });

    const $motorright = $('<div>', {
        id: 'motor-indicator-right',
        'class': 'motor-indicator'
    });

    $motorright.appendTo($cr);
    $motorleft.appendTo($cl);
    $cr.appendTo('#control-group-move');
    $cl.appendTo('#control-group-move');
}

function onAction(event) {
    console.log(event.type, event.target)
    socket.emit('control', event.target.id, {
        type: event.type
    });
}

function processFrameMeta(data) {
    if (!streamWidth || !streamHeight) {
        getStreamDimensions();
    }
    const rects = data.motion;
    let rectIndex = 0;
    for (rectIndex = 0; rectIndex < rects.length; rectIndex++) {
        let [x, y, w, h] =  rects[rectIndex];
        x = scale(x, 0, streamWidth, 0, 100);
        y = scale(y, 0, streamHeight, 0, 100);
        w = scale(w, 0, streamWidth, 0, 100);
        h = scale(h, 0, streamHeight, 0, 100);
        let frame = $(`#stream-annotation-${rectIndex}`);
        // create frames if they don't exist
        if (!frame.length) {
            let newFrame = $('<div>', {
                id: `stream-annotation-${rectIndex}`,
                'class': 'stream-annotation'
            });
            $('.stream-container').append(newFrame);
        }
        frame.removeAttr('style');
        frame.css({
            'left': `${x}%`,
            'top': `${y}%`,
            'width': `${w}%`,
            'height': `${h}%`,
        });
    }
    const nFrames = $('.stream-annotation').length;
    for (let i = rectIndex; i < nFrames; i++) {
        $(`#stream-annotation-${i}`).css('display', 'none');
    }
}

async function processKey(event) {
    if (event.originalEvent.repeat) return;
    const config = await getSettings().catch(() => {
        console.log(`Failed to get config: ${err}`);
        return;
    });

    for (let action of config.controls.actions) {
        if (!(action.key == event.key || action.key?.includes(event.key))) continue;
        const button = $(`#control-${action.id}`);
        if (event.type == 'keyup') {
            button.removeClass('pressed');
        } else {
            button.addClass('pressed');
        }
        button.trigger({
            type: (event.type == 'keyup') ? 'mouseup' : 'mousedown'
        });
    }
}

function onCamSliderChange() {
    if (!navigator.getGamepads()?.length) return;
}

function onLegSliderChange() {
    // possibly change illustration or something
    if (!navigator.getGamepads()?.length) return;
}

function onProcessRestartRequest() {
    socket.emit('console-command', 'python-restart')
    $btn = $('#button-restart-python');
    $btn.text('Restarting...');
    $btn.attr('disabled', true);
    socket.once('process-restarted', () => {
        $btn.text('Successfully restarted!');
        setTimeout(() => {
            $btn.text('Waiting for camera...');
            socket.once('camera-start', () => {
                window.location.reload(false);
            });
        }, 1000);
    });
}

function onShutdownRequest() {
    const confirmShutdown = confirm('Are you sure? :/');
    if (!confirmShutdown) return;
    socket.emit('console-command', 'quit');
}

function scale (number, inMin, inMax, outMin, outMax) {
    return (number - inMin) * (outMax - outMin) / (inMax - inMin) + outMin;
}