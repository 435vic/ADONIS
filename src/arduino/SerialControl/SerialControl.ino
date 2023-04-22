
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


void setup() {
  // put your setup code here, to run once:
  Serial.begin(9600);
  pinMode(L_EN, OUTPUT);
  pinMode(L_F, OUTPUT);
  pinMode(L_B, OUTPUT);
  pinMode(R_EN, OUTPUT);
  pinMode(R_F, OUTPUT);
  pinMode(R_B, OUTPUT);

  digitalWrite(L_EN, HIGH);
  digitalWrite(R_EN, HIGH);
}

void loop() {
  // put your main code here, to run repeatedly:
if (Serial.available()) {
    //Reads a line with the data sent by the rasp
    String input = Serial.readStringUntil('\n');
    int values[2]; //Amount of values sent from the rasp
    int index = 0;
    //Splits the string into the differentn values and stores them in an array
    for (int i = 0; i < input.length(); i++) {
      if (input.charAt(i) == ',') {
        values[index++] = atoi(input.substring(0, i).c_str());
        input = input.substring(i + 1);
        i = 0;
      }
    }
    values[index] = atoi(input.c_str());
    
    // Do something with the parsed values
    Move(values[0], values[1]);

    float dist1 = us1.ping_cm(); // Send ping, get distance in centimeters.
    float dist2 = us2.ping_cm(); // Send ping, get distance in centimeters.
    float dist3 = us3.ping_cm(); // Send ping, get distance in centimeters.
    
    //Sents values back to the rasp
    Serial.print(dist1);
    Serial.print(",");
    Serial.print(dist2);
    Serial.print(",");
    Serial.println(dist3);

    
  }
  delay(50);
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
