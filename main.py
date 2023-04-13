from camera import FrameBuffer, VideoWorker
from web_server import WebServerHandler
from http.server import ThreadingHTTPServer

from threading import Thread

frame_buffer = FrameBuffer()

SERVER_ROOT = 'static/'
WEBSERVER_IP = '0.0.0.0'
WEBSERVER_PORT = 8085

web_server = ThreadingHTTPServer(
    (WEBSERVER_IP, WEBSERVER_PORT),
    lambda *args:
        WebServerHandler(frame_buffer, *args, directory=SERVER_ROOT)
)

web_server_worker = Thread(target=web_server.serve_forever)
camera_worker = VideoWorker(frame_buffer)

print(f'Starting camera worker')
camera_worker.start()
print(f'Starting web server at {WEBSERVER_IP}:{WEBSERVER_PORT}')
web_server_worker.start()
print(f'Running...')
try:
    input()
finally:
    print(f'Shutting down webserver')
    web_server.shutdown()
    web_server_worker.join()
    print(f'Shutting down camera worker')
    camera_worker.stop()
    camera_worker.join()
