function detectCodes() {
    console.log('looking for qr codes...')
    $img = $('#main-stream');
    const canvas = document.createElement('canvas');
    canvas.setAttribute('width', streamWidth);
    canvas.setAttribute('height', streamHeight);
    const ctx = canvas.getContext('2d');
    ctx.drawImage($img.get(0),0,0);
    const data = ctx.getImageData(0, 0, streamWidth, streamHeight);
    const code = jsQR(data.data, streamWidth, streamHeight);

    if (code) {
        console.log("Found QR code", code);
        $('#last-qr-code').text(code.data);
    }
}
