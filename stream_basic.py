import io
import cv2 as cv

from threading import Condition, Thread
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

# https://www.codeinsideout.com/blog/pi/stream-picamera-mjpeg/#synchronize-between-threads
class FrameBuffer():
    JPEG_MAGIC = b'\xff\xd8'

    def __init__(self):
        self.current_frame = None
        self._buffer = io.BytesIO()
        self.frame_available = Condition()

    def write(self, buf):
        if buf.startswith(FrameBuffer.JPEG_MAGIC):
            # Acquire lock; no other thread can access the current frame.
            with self.frame_available:
                self._buffer.seek(0)
                self._buffer.write(buf)
                self._buffer.truncate()
                self.current_frame = self._buffer.getvalue()
                self.frame_available.notify_all()


class StreamingHandler(SimpleHTTPRequestHandler):
        def __init__(self, buffer: FrameBuffer, request, client_address, server, directory=None):
            self.buffer = buffer
            super().__init__(request, client_address, server, directory=directory)

        def do_GET(self):
            if self.path == '/stream':
                # response
                self.send_response(200)
                # header
                self.send_header('Age', 0)
                self.send_header('Cache-Control', 'no-cache, private')
                self.send_header('Pragma', 'no-cache')
                self.send_header('Content-Type', 'multipart/x-mixed-replace; boundary=FRAME')
                self.end_headers()
                try:
                    while True:
                        with self.buffer.frame_available:
                            self.buffer.frame_available.wait()
                            frame = self.buffer.current_frame

                            self.wfile.write(b'--FRAME\r\n')
                            self.send_header('Content-Type', 'image/jpeg')
                            self.send_header('Content-Length', len(frame))
                            self.end_headers()
                            self.wfile.write(frame)
                            self.wfile.write(b'\r\n')
                except Exception as e:
                    print(f'EXCEPTION: {e}')
            else:
                super().do_GET()

frame_buffer = FrameBuffer()
MAIN_WINDOW_NAME = 'Main'
SERVER_ROOT = 'static/'
server = ThreadingHTTPServer(
    ('127.0.0.1', 8085),
    lambda *args: StreamingHandler(frame_buffer, *args, directory=SERVER_ROOT)
)
cap = cv.VideoCapture(0)
server_worker = Thread(target=server.serve_forever, daemon=True)
print('Started HTTP server')

try:
    server_worker.start()
    while True:
        if cv.waitKey(1) & 0xFF == ord('q'):
            break

        ret, frame = cap.read()
        if not ret: continue
        _, img = cv.imencode('.jpg', frame)
        frame_buffer.write(img.tobytes())
        cv.imshow(MAIN_WINDOW_NAME, frame)
except Exception as e:
    print(f'Ran into exception: {e}')
finally:
    print('Shutting down...')
    server.shutdown()
    cap.release()
    cv.destroyAllWindows()
