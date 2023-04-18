import cv2
import argparse
import socketio
from threading import Event
from camera import Webcam, PiCamera, Camera

parser = argparse.ArgumentParser(description='Manage a webcam and process with OpenCV.')

parser.add_argument('-f', '--framerate', nargs='?', default=30)
parser.add_argument('-p', '--port', nargs='?', default=8085)
parser.add_argument('--raspi', action='store_true')

args = parser.parse_args()

sio = socketio.Client()

camera: Camera = Webcam() if not args.raspi else PiCamera()

stop_flag = Event()
def camera_task():
    camera.setup()
    while not stop_flag.is_set():
        cv2.waitKey(1)
        ret, frame = camera.get_frame()
        if not ret: continue
        cv2.imshow('Preview', frame)
        _, img = cv2.imencode('.jpg', frame)
        sio.emit('frame', (img.tobytes(), {'hello': 'world'}), namespace='/camera')
        sio.sleep(1 / int(args.framerate))

    print('Camera task stopped')

@sio.event
def connect():
    print(f'Connected on port {args.port}')
    print('sid:', sio.get_sid("/camera"))

@sio.event
def connect_error(data):
    print(f'Connection failed: \n{data}')

@sio.on('disconnect-replaced', namespace='/camera')
def on_replace():
    print('Client has been replaced. Stopping camera task...')
    stop_flag.set()
    raise Exception('Client has been replaced. Did you start another instance of this script?')


sio.connect(f'http://localhost:{args.port}', namespaces='/camera')
camera_worker = sio.start_background_task(camera_task)
print('Press enter to quit... ')
input()
stop_flag.set()
sio.disconnect()
camera_worker.join()
