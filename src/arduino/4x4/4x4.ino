#include <Servo.h>
#include <NewPing.h>

//Motor drivers pins
#define L_EN 4
#define L_F 3
#define L_B 11

#define R_EN 7
#define R_F 5
#define R_B 6

//Ultrasonic sensor pins
#define TRIG1  9  // Arduino pin tied to trigger pin on the ultrasonic sensor.
#define ECHO1  10  // Arduino pin tied to echo pin on the ultrasonic sensor.
#define TRIG2  12  // Arduino pin tied to trigger pin on the ultrasonic sensor.
#define ECHO2  13  // Arduino pin tied to echo pin on the ultrasonic sensor.
#define TRIG3  A0  // Arduino pin tied to trigger pin on the ultrasonic sensor.
#define ECHO3  A1  // Arduino pin tied to echo pin on the ultrasonic sensor.
#define MAX_DISTANCE 200 // Maximum distance we want to ping for (in centimeters). Maximum sensor distance is rated at 400-500cm.

NewPing us1(TRIG1, ECHO1, MAX_DISTANCE); // NewPing setup of pins and maximum distance.
NewPing us2(TRIG2, ECHO2, MAX_DISTANCE); 
NewPing us3(TRIG3, ECHO3, MAX_DISTANCE); 

int MR;
int ML;
String Flag;
unsigned long previousTimeSample = millis();
long timeIntervalSample = 1000;

unsigned long previousTimeMotor = millis();
long timeIntervalMotor = 25;
int angle1 = 120;
int angle2 = 10;

Servo servoCam;
Servo servoWheel;
void setup() {
  // put your setup code here, to run once:
  Serial.begin(9600);
  servoCam.attach(9);
  servoWheel.attach(10);
  pinMode(L_EN, OUTPUT);
  pinMode(L_F, OUTPUT);
  pinMode(L_B, OUTPUT);
  pinMode(R_EN, OUTPUT);
  pinMode(R_F, OUTPUT);
  pinMode(R_B, OUTPUT);

  digitalWrite(L_EN, HIGH);
  digitalWrite(R_EN, HIGH);
  servoCam.write(angle1);
  servoWheel.write(angle2);
}

void loop() {
  unsigned long currentTime = millis();
  // put your main code here, to run repeatedly:
  if (Serial.available()) {
    //Reads a line with the data sent by the rasp
    String input = Serial.readStringUntil('\n');
    int i1 = input.indexOf(',');
    int i2 = input.indexOf(',', i1+1);
    String MsgFlag = input.substring(0, i1);
    int ValueA = input.substring(i1 + 1, i2).toInt();
    int ValueB = input.substring(i2 + 1).toInt();
    //Serial.print(MsgFlag == "M");
    if(MsgFlag == "M"){
      Flag = "M";
      MR = ValueA;
      ML = ValueB;
    }
    else if(MsgFlag == "S"){
      Flag = "S";
      MR = 0;
      ML = 0;
    }
    /*servoMotor.write(ValueA); 
    delay(25);
    Serial.println(input);
    Serial.println(ValueA);*/
    if(/*currentTime - previousTimeMotor > timeIntervalMotor &&*/ MsgFlag == "C" && ValueA > 84 && ValueA < 156 && ValueA != angle1) {
      servoCam.write(ValueA);
      delay(25);
      angle1 = ValueA;
    }
    if(/*currentTime - previousTimeMotor > timeIntervalMotor &&*/ MsgFlag == "W" && ValueA > 9 && ValueA < 181 && ValueA != angle2) {
      servoWheel.write(ValueA);
      angle2 = ValueA;
      delay(25);
    }
  }//85, 115, 155
  if(Flag == "M" || Flag == "S"){
      /*Serial.print("MR:");
      Serial.print(MR);
      Serial.println();
      Serial.print(" ML:");
      Serial.print(ML);
      Serial.println();*/
      Move(ML, MR);
  }
    // Do something with the parsed values
  if(currentTime - previousTimeSample > timeIntervalSample) {
    previousTimeSample = currentTime;
    float dist1 = us1.ping_cm(); // Send ping, get distance in centimeters.
    float dist2 = us2.ping_cm(); // Send ping, get distance in centimeters.
    float dist3 = us3.ping_cm(); // Send ping, get distance in centimeters.
    //Sents values back to the rasp

    /*Serial.print("US");
    Serial.print(",");
    Serial.print(dist1);
    Serial.print(",");
    Serial.print(dist2);
    Serial.print(",");
    Serial.println(dist3);*/
  }
}


void Move(int L, int R){
  int Lp = map(L, -100, 100, -255, 255);
  int Rp = map(R, -100, 100, -255, 255);

  if (L>0 && R>0) {
    analogWrite(L_F, Lp);
    analogWrite(R_F, Rp);
    analogWrite(L_B, 0);
    analogWrite(R_B, 0);
  }
  else if (L<0 && R<0) {
    analogWrite(L_B, abs(Lp));
    analogWrite(R_B, abs(Rp));
    analogWrite(L_F, 0);
    analogWrite(R_F, 0);
  }
  else if (L<0 && R>0) {
    analogWrite(L_B, abs(Lp));
    analogWrite(R_F, Rp);
    analogWrite(L_F, 0);
    analogWrite(R_B, 0);
  }
  else if (L>0 && R<0) {
    analogWrite(L_F, Lp);
    analogWrite(R_B, abs(Rp));
    analogWrite(L_B, 0);
    analogWrite(R_F, 0);
  }
  else {
    analogWrite(L_F, 0);
    analogWrite(L_B, 0);
    analogWrite(R_F, 0);
    analogWrite(R_B, 0); 
  }
}