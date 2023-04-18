from picamera2 import Picamera2
import cv2

class Camera:
    def setup(self):
        pass

    def get_frame(self):
        pass

class PiCamera(Camera):
    def setup(self):
        self.camera = Picamera2()
        self.camera.configure(
            self.camera.create_preview_configuration(main={"format": 'XRGB8888', "size": (640, 480)})
        )
        self.camera.start()
        pass

    def get_frame(self):
        return (True, self.camera.capture_array())
        return False, None
    
class Webcam(Camera):
    def setup(self):
        self.cap = cv2.VideoCapture(0)
    
    def get_frame(self):
        return self.cap.read()
