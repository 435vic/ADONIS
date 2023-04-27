const int pinJoyY_izq = A0;
const int pinJoyY_der = A1;
const int pinPotCam = A2;
const int pinPotWheel = A3;
const int pin5V = 9;
void setup() {
  pinMode(pin5V, OUTPUT);
  digitalWrite(pin5V, HIGH);
  Serial.begin(9600);
}

void loop() {
  int Yvalue_der = 0;
  int Yvalue_izq = 0;
  int PotValueCam = 0;
  int PotValueWheel = 0;

  //leer valores
  Yvalue_izq = analogRead(pinJoyY_izq)-17;
  Yvalue_der = analogRead(pinJoyY_der)+7;
  PotValueCam = analogRead(pinPotCam);
  PotValueWheel = analogRead(pinPotWheel);
  delay(100);            //es necesaria una pequeña pausa entre lecturas analógicas

  //mostrar valores por serial
  /*
  Y_der: CENTER: 493, UP: 0, DOWN: 1023
  Y_izq: CENTER 517, UP: 0, DOWN: 1023
  X_der: CENTER: 522, LEFT: 0, RIGHT: 1023
  Pulsador: OFF: 1, ON: 0
 */
  /*Serial.print("PotValueCam: ");
  Serial.println(PotValueCam);
  Serial.print("PotValueWheel: ");
  Serial.println(PotValueWheel);*/

  Yvalue_izq = map(Yvalue_izq, -16, 1006 , -100, 100);
  Yvalue_der = map(Yvalue_der, 6, 1030 , -100, 108);
  if(Yvalue_der >= 100){
    Yvalue_der = 100;
  }

  PotValueCam = map(PotValueCam, 0, 1021 , 155, 85);
  PotValueWheel = map(PotValueWheel, 0, 1021 , 10, 180);

  Serial.print("M,");
  Serial.print(Yvalue_izq);
  Serial.print(",");
  Serial.println(Yvalue_der);

  Serial.print("C,");
  Serial.println(PotValueCam);

  Serial.print("W,");
  Serial.println(PotValueWheel);
  /*if(SwithValue == 1){
    Serial.print("C,");
    Serial.println(Xvalue_der);
  }*/

  delay(100);
}