import socketio
import argparse
from serial_task import SerialManager
from camera_task import CameraManager

parser = argparse.ArgumentParser(description='Manage a webcam and process with OpenCV.')
parser.add_argument('-f', '--framerate', nargs='?', default=30)
parser.add_argument('-p', '--port', nargs='?', default=8085)
args = parser.parse_args()

sio = socketio.Client()
camera_worker = CameraManager(sio, framerate=args.framerate)
serial_manager = SerialManager(sio)

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
    camera_worker.stop()
    raise Exception('Client has been replaced. Did you start another instance of this script?')
    
@sio.on('serial-tx', namespace='/serial')
def on_serial_tx(data):
	serial_manager.write(data)

sio.connect(f'http://localhost:{args.port}', namespaces=['/camera', '/serial'])
camera_worker.start()
serial_manager.start()
print('Serial manager started')
input()
serial_manager.stop()
sio.disconnect()
camera_worker.stop()
camera_worker.join()
