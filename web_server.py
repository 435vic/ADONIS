import io

from camera import FrameBuffer
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

stream_headers = {
    'Age': 0,
    'Cache-Control': 'no-cache, private',
    'Pragma': 'no-cache',
    'Content-Type': 'multipart/x-mixed-replace; boundary=FRAME'
}

class WebServerHandler(SimpleHTTPRequestHandler):
    def __init__(self, buffer: FrameBuffer, *args, directory=None):
        self.buffer = buffer
        super().__init__(*args, directory=directory)

    def do_GET(self) -> None:
        # stream code; read from buffer and
        # send to client as MJPEG stream
        if self.path == '/stream':
            self.send_response(200)
            for key, val in stream_headers.items():
                self.send_header(key, val)
            self.end_headers()
            try:
                while True:
                    frame = self.buffer.read()
                    self.wfile.write(b'--FRAME\r\n')
                    self.send_header('Content-Type', 'image/jpeg')
                    self.end_headers()
                    self.wfile.write(frame)
                    self.wfile.write(b'\r\n')
            except Exception as e:
                print(f'Ran into exception while serving webpage: {e}')
        else:
            # Serve static files
            super().do_GET()