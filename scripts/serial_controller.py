import serial
import serial.tools.list_ports
import socketio

ADDRESS = '192.168.137.45:8085'
sio = socketio.Client()
sio.connect(f'http://{ADDRESS}')

ports = serial.tools.list_ports.comports()
ser = serial.Serial(ports[-1].name)
while True:
    try:
        line = ser.readline().strip()
        print(line)
        sio.emit('serial-tx', line.decode('utf-8'))
    except KeyboardInterrupt: break
