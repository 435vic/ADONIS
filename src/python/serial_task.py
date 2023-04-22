import serial
import traceback
from serial.threaded import LineReader, ReaderThread
import time

# TODO: serial port detector and error handling
SERIAL_PORT = '/dev/ttyACM0'

class AsyncSerialHandler(LineReader):
    def __init__(self, socket):
        super().__init__()
        self.socket = socket
    
    def connection_made(self, transport):
        super(AsyncSerialHandler, self).connection_made(transport)
        print('serial port opened')
    
    def handle_line(self, data):
        self.socket.emit('serial-rx', data, namespace='/serial')

    def connection_lost(self, exc):
        if exc:
            traceback.print_exc(exc)
        print('serial port closed')
        
    @staticmethod
    def factory_from_socket(socket):
        return lambda: AsyncSerialHandler(socket)
        

class SerialManager:
    def __init__(self, socket, serial_port=SERIAL_PORT, baud_rate=9600):
        self.port = serial_port
        self.socket = socket
        self.ser = serial.Serial()
        self.ser.port = self.port
        self.ser.baudrate = baud_rate
        self.alive = False
        self.reader_thread = None
        self.proto = None
    
    def start(self):
        try:
            self.ser.open()
        except Exception as e:
            print('EXCEPTION while opening serial port')
            raise e
            # TODO: error handling
        self.ser.reset_input_buffer()
        self.reader_thread = ReaderThread(
            self.ser,
            AsyncSerialHandler.factory_from_socket(self.socket)
        )
        self.reader_thread.start()
        self.proto = self.reader_thread.connect()[1]
        self.alive = True
    
    def write(self, data):
        self.proto.write_line(data);
    
    def stop(self):
        self.reader_thread.close()
        self.alive = False

if __name__ == '__main__':
    manager = SerialManager(None)
    manager.start()
    time.sleep(5)
    manager.stop()
    # ser = serial.Serial(SERIAL_PORT)
    # ser.reset_input_buffer()
    # conn = ReaderThread(ser, AsyncSerialHandler)
    # conn.start()
    # proto = conn.connect()
    # time.sleep(5)
    # conn.close()

