#include <SPI.h>
#include <MFRC522.h>
#include <FirebaseESP8266.h>
#include <ESP8266WiFi.h>
#include <SoftwareSerial.h>
#include <TinyGPS++.h>

#define SS_PIN D4 // SS pin for RC522 module, connected to D4
#define RST_PIN D3 // RST pin for RC522 module, connected to D3

#define FIREBASE_HOST "testgps-fd49c-default-rtdb.firebaseio.com" //key from Firebase
#define FIREBASE_AUTH "gY9yjjo7ruPKXeYxe4aZeWwXe03Uu9X0Za2yRKKw"
#define WIFI_SSID "p3" //Wifi name
#define WIFI_PASSWORD "twilight6011" //Wifi password

FirebaseData firebaseData;
FirebaseJson json;

MFRC522 mfrc522(SS_PIN, RST_PIN); // Create MFRC522 instance

const int RXPin = 4, TXPin = 5;
SoftwareSerial neo6m(RXPin, TXPin);
TinyGPSPlus gps;

void setup() {
  Serial.begin(115200);
  neo6m.begin(9600);
  SPI.begin(); // Init SPI bus
  mfrc522.PCD_Init(); // Init RC522
  wifiConnect();
  Firebase.begin(FIREBASE_HOST, FIREBASE_AUTH);
  Firebase.reconnectWiFi(true);
}

void loop() {
  smartdelay_gps(1000);
  readRFID();
}

void smartdelay_gps(unsigned long ms) {
  unsigned long start = millis();
  do {
    while (neo6m.available())
      gps.encode(neo6m.read());
  } while (millis() - start < ms);

  if (gps.location.isValid()) {
    float latitude = gps.location.lat();
    float longitude = gps.location.lng();

    if (
        Firebase.setFloat(firebaseData, "/GPS/device2/latitude", latitude) &&
        Firebase.setFloat(firebaseData, "/GPS/device2/longitude", longitude)
        ) {
      print_ok();
    } else {
      print_fail();
    }
  }
}

void readRFID() {
  if (mfrc522.PICC_IsNewCardPresent() && mfrc522.PICC_ReadCardSerial()) {
    String rfidData = "";
    for (byte i = 0; i < mfrc522.uid.size; i++) {
      rfidData += String(mfrc522.uid.uidByte[i], HEX);
    }
    if (Firebase.setString(firebaseData, "/RFID/device2/rfid_data", rfidData)) {
      print_ok();
    } else {
      print_fail();
    }
    delay(1000); // Wait a bit before scanning for another card
  }
}

void wifiConnect() {
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("Connecting to Wi-Fi");
  while (WiFi.status() != WL_CONNECTED) {
    Serial.print(".");
    delay(300);
  }
  Serial.println();
  Serial.print("Connected with IP: ");
  Serial.println(WiFi.localIP());
  Serial.println();
}

void print_ok() {
  Serial.println("------------------------------------");
  Serial.println("OK");
  Serial.println("PATH: " + firebaseData.dataPath());
  Serial.println("TYPE: " + firebaseData.dataType());
  Serial.println("ETag: " + firebaseData.ETag());
  Serial.println("------------------------------------");
  Serial.println();
}

void print_fail() {
  Serial.println("------------------------------------");
  Serial.println("FAILED");
  Serial.println("REASON: " + firebaseData.errorReason());
  Serial.println("------------------------------------");
  Serial.println();
}

void firebaseReconnect() {
  Serial.println("Trying to reconnect");
  Firebase.begin(FIREBASE_HOST, FIREBASE_AUTH);
}
