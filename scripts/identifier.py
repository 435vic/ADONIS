from PIL import Image, ImageOps
import pytesseract
import cv2
import os
import numpy as np
from haishoku.haishoku import Haishoku

def get_main_color(file):
    img = Image.open(file)
    colors = img.getcolors(256) #put a higher value if there are many colors in your image (256)
    max_occurence, most_present = 0, 0
    try:
        for c in colors:
            if c[0] > max_occurence:
                (max_occurence, most_present) = c
        return most_present
    except TypeError:
        raise Exception("Too many colors in the image")
def get_main_text(file):
    try:
        pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'
        most_text = pytesseract.image_to_string(Image.open(file))
        return most_text
    except TypeError:
        raise Exception("Not able to recognize text")
def get_main_number(file):
    try:
        with Image.open(file) as img:
            img.load()
        #cut_image = img.crop((753, 1281, 921, 1517))
        #thresh = 200
        #fn = lambda x : 255 if x > thresh else 0
        #cut_image = cut_image.convert('L').point(fn, mode='1')
        #cut_image = ImageOps.invert(cut_image)
        #cut_image = cut_image.convert('1').show()
        custom_config = r'--oem 3 --psm 6'
        pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'
        most_num = pytesseract.image_to_string(img,  config=custom_config)
        return most_num
    except TypeError:
        raise Exception("Not able to recognize number")
def save_frame_camera_key(device_num, dir_path, basename, ext='jpg', delay=1, window_name='frame'):
    cap = cv2.VideoCapture(device_num)

    if not cap.isOpened():
        print('could not open cam')
        return

    os.makedirs(dir_path, exist_ok=True)
    base_path = os.path.join(dir_path, basename)

    n = 0
    while True:
        ret, frame = cap.read()
        cv2.imshow(window_name, frame)
        key = cv2.waitKey(delay) & 0xFF
        if key == ord('c'):
            #div = 64
            #frame = frame // div*div+div//2
            cv2.imwrite('{}_{}.{}'.format(base_path, n, ext), frame)
            color = Haishoku.getDominant('data/temp/camera_capture_0.jpg')
            text = get_main_text('data/temp/camera_capture_0.jpg')
            number = get_main_number('data/temp/camera_capture_0.jpg')
            print(color, text, number, sep=' | ')
            #Haishoku.showDominant('data/temp/camera_capture_0.jpg')
        elif key == ord('q'):
            break

    cv2.destroyWindow(window_name)


IP = '192.168.0.196'

save_frame_camera_key(f'http://{IP}:8085/stream', 'data/temp', 'camera_capture')

#color = Haishoku.getDominant('data/temp/camera_capture_0.jpg')
#text = get_main_text('data/temp/camera_capture_0.jpg')
#number = get_main_number('data/temp/camera_capture_0.jpg')
#print(color, text, number)

