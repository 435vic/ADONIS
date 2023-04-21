import serial
import traceback
from serial.threaded import LineReader, ReaderThread
import time

SERIAL_PORT = '/dev/ttyACM0'

class SerialManager(LineReader):
    def connection_made(self, transport):
        super(SerialManager, self).connection_made(transport)
        print('serial port opened')
    
    def handle_line(self, data):
        print(f'received line: {repr(data)}')

    def connection_lost(self, exc):
        if exc:
            traceback.print_exc(exc)
        print('port closed')

if __name__ == '__main__':
    ser = serial.Serial(SERIAL_PORT)
    conn = ReaderThread(ser, SerialManager)
    conn.connect()
    time.sleep(5)
    conn.close()
