#include <Servo.h>
#include <DHT.h>
#include <DHT_U.h>

#define LEFT_FWD 3
#define LEFT_BACK 11
#define RIGHT_FWD 5
#define RIGHT_BACK 6

#define ARM_WHEEL_MOTOR 12

#define SERVO_A 9
#define SERVO_B 10

#define BACK_SERVO_START 10
#define BACK_SERVO_END 180

#define GAS_SENSOR A0
#define DHTPIN 2

DHT_Unified dht(DHTPIN, DHT22);

Servo backServo;
Servo frontServo;

unsigned long lastPollTime = millis();
unsigned long currentTime = millis();

int frontServoSpeed = 90;
int backServoAngle = BACK_SERVO_START;
int leftPower;
int rightPower;

int gasLevel;

bool enableFrontWheel = false;

void setup() {
    Serial.begin(9600);
    backServo.attach(10);
    frontServo.attach(9);

    pinMode(LEFT_FWD, OUTPUT);
    pinMode(LEFT_BACK, OUTPUT);
    pinMode(RIGHT_FWD, OUTPUT);
    pinMode(RIGHT_BACK, OUTPUT);

    pinMode(ARM_WHEEL_MOTOR, OUTPUT);

    pinMode(GAS_SENSOR, INPUT);
    dht.begin();

    frontServo.write(frontServoSpeed);
    backServo.write(backServoAngle);
}

void loop() {
    currentTime = millis();
    String flag;
    int argA, argB;
    if (Serial.available()) {
        String input = Serial.readStringUntil('\n');
        flag = getValue(input, ',', 0);
        argA = getValue(input, ',', 1).toInt();
        argB = getValue(input, ',', 2).toInt();

        if (flag == "M") {
            motor(argA, argB);
        } else if (flag == "W" && argA >= BACK_SERVO_START && argA <= BACK_SERVO_END) {
            backServoAngle = argA;
        } else if (flag == "C") {
            frontServoSpeed = argA;
        } else if (flag == "R") {
            enableFrontWheel = argA == 1;
            digitalWrite(ARM_WHEEL_MOTOR, enableFrontWheel ? HIGH : LOW);
        }
    }

    frontServo.write(frontServoSpeed);
    backServo.write(backServoAngle);
    
    if (currentTime - lastPollTime > 500) {
        sensors_event_t event;
        dht.temperature().getEvent(&event);
        Serial.print("T,");
        Serial.println(event.temperature);
        gasLevel = analogRead(GAS_SENSOR);
        Serial.print("G,");
        Serial.println(gasLevel);
        lastPollTime = currentTime;
    }
}

void motor(int leftPower, int rightPower) {
    int mappedLeft = map(leftPower, -100, 100, -255, 255);
    int mappedRight = map(rightPower, -100, 100, -255, 255);

    if (mappedLeft < 0) {
        analogWrite(LEFT_BACK, abs(mappedLeft));
        analogWrite(LEFT_FWD, 0);
    } else {
        analogWrite(LEFT_FWD, mappedLeft);
        analogWrite(LEFT_BACK, 0);
    }

    if (mappedRight < 0) {
        analogWrite(RIGHT_BACK, abs(mappedLeft));
        analogWrite(RIGHT_FWD, 0);
    } else {
        analogWrite(RIGHT_FWD, mappedLeft);
        analogWrite(RIGHT_BACK, 0);
    }
}

String getValue(String data, char separator, int index) {
    int found = 0;
    int strIndex[] = {0, -1};
    int maxIndex = data.length()-1;

    for(int i=0; i<=maxIndex && found<=index; i++){
        if(data.charAt(i)==separator || i==maxIndex){
            found++;
            strIndex[0] = strIndex[1]+1;
            strIndex[1] = (i == maxIndex) ? i+1 : i;
        }
    }
    return found>index ? data.substring(strIndex[0], strIndex[1]) : "";
}
