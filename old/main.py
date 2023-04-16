import threading

from camera import FrameBuffer, VideoWorker
from web_server import WebServerHandler, WebServer
from http.server import ThreadingHTTPServer


frame_buffer = FrameBuffer()

SERVER_ROOT = 'static/'
WEBSERVER_IP = '0.0.0.0'
WEBSERVER_PORT = 8085

web_server = WebServer(frame_buffer, WEBSERVER_IP, WEBSERVER_PORT)

web_server_worker = threading.Thread(target=web_server.start)
camera_worker = VideoWorker(frame_buffer)

print(f'Starting camera worker')
camera_worker.start()
print(f'Starting web server at {WEBSERVER_IP}:{WEBSERVER_PORT}')
web_server_worker.start()
print(f'Running...')

try:
    input()
finally:
    print(f'Shutting down camera worker')
    camera_worker.stop()
    camera_worker.join()
    print(f'Shutting down webserver')
    web_server.stop()
    web_server_worker.join()
    print(f'Stopped.')
    print(*(t.name for t in threading.enumerate()), sep=', ')
