import cv2

from time import sleep
from sklearn.cluster import DBSCAN
from camera import Webcam, PiCamera, Camera, raspiEnabled

kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE,(4,4))

def get_bounding_box(x1, y1, x2, y2):
    """
    Converts two pairs of points into a bounding box.

    :return: start point (x, y), width, height
    """
    x = min(x1, x2)
    y = min(y1, y2)
    w = abs(x1 - x2)
    h = abs(y1 - y2)
    return x, y, w, h

class VideoProcessor:
    def __init__(self):
        self.cnt = 0
        self.prev_frame = None

    def process(self, frame):
        out = dict()

        blur = cv2.GaussianBlur(frame, (7,7), 0)
        src = cv2.cvtColor(blur, cv2.COLOR_BGR2GRAY)
        # Motion Detection
        if not self.prev_frame is None:
            # Take the difference between previous and current frame
            diff = cv2.absdiff(self.prev_frame, src)
            # Apply some morphology operations to denoise and make the image clearer
            diff = cv2.morphologyEx(diff, cv2.MORPH_OPEN, kernel)
            # Dilate to make grouping easier
            diff = cv2.dilate(diff, kernel)
            # Take the threshold of the image to binarize it
            _, thresh = cv2.threshold(diff, 20, 255, cv2.THRESH_BINARY)
            # Find contours
            contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            # Skip processing if no contours are found
            if len(contours) > 0:
                contours = sorted(contours, key=cv2.boundingRect)[:min(len(contours), 10)]
                rects = []
                for c in contours:
                    x, y, w, h = cv2.boundingRect(c)
                    rects.append((x, y, w, h))
                pts = [(x + w//2, y + h//2) for x, y, w, h in rects]

                # Clustering
                clustering = DBSCAN(eps=40, min_samples=5).fit(pts)
                # Merge the rectangles within each cluster
                groups = {}
                for i, label in enumerate(clustering.labels_):
                    if label not in groups:
                        groups[label] = rects[i]
                    else:
                        x, y, w, h = rects[i]
                        x1, y1, w1, h1 = groups[label]
                        x_min = min(x, x1)
                        y_min = min(y, y1)
                        x_max = max(x + w, x1 + w1)
                        y_max = max(y + h, y1 + h1)
                        groups[label] = (x_min, y_min, x_max - x_min, y_max - y_min)

                # only show the biggest 2 groups
                rects = sorted(groups.values(), key=lambda r: r[2]*r[3])[:min(len(groups.values()), 4)]
                rect_groups, _ = cv2.groupRectangles(
                    [(x, y, x+w, y+h) for x,y,w,h in rects+rects],
                    1
                )

                for x, y, w, h in rect_groups:
                    cv2.rectangle(frame, (x, y), (w, h), (0, 0, 255), thickness=3)

                out['motion'] = [get_bounding_box(*(int(coord) for coord in rect)) for rect in rect_groups]
            else:
                out['motion'] = []
        
        # TODO: Hazmat label recognition

        self.prev_frame = src
        self.cnt += 1
        return out

if __name__ == '__main__':
    pr = VideoProcessor()
    camera: Camera = Webcam() if not raspiEnabled else PiCamera()
    camera.setup()
    print('Opened video')
    while True:
        ret, frame = camera.get_frame()
        if not ret: continue
        pr.process(frame)
        cv2.imshow('PREVIEW', frame)
        if cv2.waitKey(1) & 0xFF == ord('q'):
            break
        sleep(1 / 12)
