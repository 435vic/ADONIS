import cv2

raspiEnabled = False
try:
    from picamera2 import Picamera2
    print('Picam library detected.')
    raspiEnabled = True
except ImportError:
    print('Error importing Picam library, Raspberry Pi camera source is disabled.')

class Camera:
    def setup(self):
        pass

    def get_frame(self):
        pass

class PiCamera(Camera):
    def setup(self):
        if raspiEnabled:
            self.camera = Picamera2()
            self.camera.configure(
                self.camera.create_preview_configuration(main={"format": 'XRGB8888', "size": (640, 480)})
            )
            self.camera.start()

    def get_frame(self):
        if raspiEnabled:
            return (True, self.camera.capture_array())
        return False, None
    
class Webcam(Camera):
    def setup(self):
        self.cap = cv2.VideoCapture(0)
    
    def get_frame(self):
        return self.cap.read()
