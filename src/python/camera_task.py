import cv2
import argparse
import socketio
from threading import Event, Thread
from camera import Webcam, PiCamera, Camera, raspiEnabled
from processor import VideoProcessor
from time import sleep

class CameraManager(Thread):
    def __init__(self, socket, framerate=15):
        super().__init__()
        self.socket = socket
        self.framerate = 15
        if raspiEnabled: print('Running in Raspi Mode')
        self.camera = Webcam() if not raspiEnabled else PiCamera()
        self.stop_flag = Event()
        
    def run(self):
        processor = VideoProcessor()
        self.camera.setup()
        while not self.stop_flag.is_set():
            cv2.waitKey(1)
            ret, frame = self.camera.get_frame()
            if not ret: continue
            _, img = cv2.imencode('.jpg', frame)
            if self.socket.connected:
                pf, data = processor.process(frame)
                cv2.imshow('Preview', pf)
                self.socket.emit('frame', (img.tobytes(), data), namespace='/camera')
            if int(self.framerate) < 30:
                sleep(1/self.framerate)
        print('Camera task stopped.')
    
    def stop(self):
        self.stop_flag.set()
        

# parser = argparse.ArgumentParser(description='Manage a webcam and process with OpenCV.')
# parser.add_argument('-f', '--framerate', nargs='?', default=30)
# parser.add_argument('-p', '--port', nargs='?', default=8085)
# args = parser.parse_args()

# sio = socketio.Client()

# if raspiEnabled: print('Running in RasPi mode')
# camera: Camera = Webcam() if not raspiEnabled else PiCamera()

# stop_flag = Event()
# def camera_task():
    # processor = VideoProcessor()
    # camera.setup()
    # while not stop_flag.is_set():
        # cv2.waitKey(1)
        # ret, frame = camera.get_frame()
        # if not ret: continue
        # _, img = cv2.imencode('.jpg', frame)
        # if sio.connected:
            # pf, data = processor.process(frame)
            # cv2.imshow('Preview', pf)
            # sio.emit('frame', (img.tobytes(), data), namespace='/camera')
        # if int(args.framerate) < 30:
            # sio.sleep(1 / int(args.framerate))

    # print('Camera task stopped')

# @sio.event
# def connect():
    # print(f'Connected on port {args.port}')
    # print('sid:', sio.get_sid("/hwmgr"))

# @sio.event
# def connect_error(data):
    # print(f'Connection failed: \n{data}')

# @sio.on('disconnect-replaced', namespace='/hwmgr')
# def on_replace():
    # print('Client has been replaced. Stopping camera task...')
    # stop_flag.set()
    # raise Exception('Client has been replaced. Did you start another instance of this script?')

# if __name__ == '__main__':
#     sio.connect(f'http://localhost:{args.port}', namespaces='/hwmgr')
#     camera_worker = sio.start_background_task(camera_task)
#     input()
#     stop_flag.set()
#     sio.disconnect()
#     camera_worker.join()
