import io
import logging

from threading import Event
import socketio.server
import wsgiserver
from camera import FrameBuffer, VideoWorker
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

stream_headers = {
    'Age': '0',
    'Cache-Control': 'no-cache, private',
    'Pragma': 'no-cache',
    'Content-Type': 'multipart/x-mixed-replace; boundary=FRAME'
}

class WebServer():
    def __init__(self, buffer, host='127.0.0.1', port=8085):
        self.frame_buffer = buffer
        self.port = port
        self.host = host
        self.sio = socketio.server.Server(async_mode='threading', monitor_clients=False)
        self.stop_flag = Event()
        
        sio_app = socketio.WSGIApp(self.sio, static_files={
            '/': 'static/index.html',
            '/style.css': 'static/style.css',
            '/main.js': 'static/main.js',
            '/res': 'static/res',
            '/lib': 'static/lib'
        })
        self.app = wsgiserver.WSGIPathInfoDispatcher({
            '/': sio_app,
            '/stream': self.WSGIStream()
        })
        self.server = wsgiserver.WSGIServer(self.app, host=self.host, port=self.port, shutdown_timeout=0.1)
        self.register_events()

    def start(self):
        self.server.start()
    
    def stop(self):
        self.stop_flag.set()  
        self.server.stop()

    def register_events(self):
        print('Registering events')

        @self.sio.on('ping')
        def asfasf(sid, data=None):
            print('PING COMMAND from ', sid)

    def WSGIStream(self):
        """Creates a WSGI app to stream contents from the server's frame buffer."""
        def app(environ, start_response): 
            headers = [(key, val) for key, val in stream_headers.items()]
            start_response('200 OK', headers)
            return generate_frames(self.frame_buffer, self.stop_flag)
        return app

def generate_frames(buffer, stop_flag):
    """Generator function that constantly returns JPEG data for an MJPEG stream."""
    while not stop_flag.is_set():
        frame = buffer.read()
        yield (
            b'--FRAME\r\n'
            b'Content-Type: image/jpeg\r\n' +
            f'Content-Length: {len(frame)}\r\n\r\n'.encode() +
            frame + b'\r\n'
        )
    print('Stopping WSGI camera stream app')
    return b'\r\n'

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
        elif 'socket.io' in self.path:
            pass
        else:
            # Serve static files
            super().do_GET()