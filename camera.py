import io
import time
import cv2 as cv
from threading import Condition, Thread, Event

# https://www.codeinsideout.com/blog/pi/stream-picamera-mjpeg/#synchronize-between-threads
class FrameBuffer():
    """Thread-safe data stream for JPEG frames. Write to it using write(), and read individual
    frames using read() (will block until frame is available). Will not conserve unread data."""
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
    
    def read(self):
        with self.frame_available:
            self.frame_available.wait()
        return self.current_frame

class VideoWorker(Thread):
    def __init__(self, output_buffer):
        super().__init__()
        self.stop_flag = Event()
        self.cap = cv.VideoCapture(0)
        self.output_buffer = output_buffer

    def run(self):
        try:
            while not self.stop_flag.is_set():
                cv.waitKey(1)
                ret, frame = self.cap.read()
                if not ret:
                    # log message
                    print('Error while getting capture')
                    break
                cv.imshow('Preview', frame)
                # Encode frame for web stream
                _, img = cv.imencode('.jpg', frame)
                self.output_buffer.write(img.tobytes())

        except Exception as e:
            print(f'Ran into exception: {e}')
        finally:
            self.cap.release()
            cv.destroyAllWindows()
        # clean up

    def stop(self):
        self.stop_flag.set()
