import serial
import serial.tools.list_ports
import re
import socketio

# ADDRESS = '192.168.137.157:8085'
# sio = socketio.Client()
# sio.connect(f'http://{ADDRESS}')

ports = serial.tools.list_ports.comports()
for port in ports:
    m = re.findall('VID:PID=([A-F0-9]{4}):([A-F0-9]{4})', port.hwid)
    if not m: continue
    m = m[0]
    print(*m)
# ser = serial.Serial('COM5')
# while True:
#     try:
#         line = ser.readline().strip()
#         print(line)
#         sio.emit('serial-tx', line.decode('utf-8'))
#     except KeyboardInterrupt: break
