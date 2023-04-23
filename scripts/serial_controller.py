import serial
import serial.tools.list_ports
import re
import socketio

ADDRESS = '192.168.137.157:8085'
sio = socketio.Client()
sio.connect(f'http://{ADDRESS}')

# ports = serial.tools.list_ports.comports()
# for port in ports:
#     m = re.findall('VID:PID=([A-F0-9]{4}):([A-F0-9]{4})', port.hwid)
#     if not m: continue
#     m = m[0]
#     print(*m)

ARDUINO_VIDS = ['2341', '2A03', '1A86']

SERIAL_PORT = ''
for p in serial.tools.list_ports.comports():
    m = re.findall('VID:PID=([A-F0-9]{4}):([A-F0-9]{4})', p.hwid)
    if not m: continue
    device_ids = m[0]
    if device_ids[0].upper() in ARDUINO_VIDS or 'arduino' in p.description.lower():
        print(f'found arduino on port {p.name}')
        SERIAL_PORT = p.name
if SERIAL_PORT == '':
    print('Could not find arduino board. Defaulting to COM5...')
    SERIAL_PORT = 'COM5'

ser = serial.Serial(SERIAL_PORT)
while True:
    try:
        line = ser.readline().strip()
        print(line)
        sio.emit('serial-tx', line.decode('utf-8'))
    except Exception: break
