import { logger } from "./logger";

export function getMockResponse(message: any) {
  const userMsg = message['parts']?.[0]?.text || message.content || '';

  logger.info(`Getting the mock response for the user query ${userMsg}`);

    const response1 = "Enter the manual pairing interface.Start OnePlus Health App, register your account and log in. Grant relevant authorities to the app by following the prompts displayed in the pop-up box.Tap Manage and then tap the scan icon in the upper right corner. The app automatically searches for and list the Bluetooth device name of the watch. Tap the Bluetooth name of the watch";

    const response2 = "After the watch is paired with a mobile phone, start OnePlus Health App, and tap the Manage tab to go to the Watch faces page. Tap All faces, select a desired watch face on the Watch faces page, and then tap Add face..";

    const response3 = "When the connection between the watch and the mobile phone is normal and there is a call received by the mobile phone, the watch will ring and vibrate to remind you and display the caller's number or name. You can choose to answer or reject the call.";

    const response4 = "Wear the watch comfortably without doing sports.Tap the Up key to go to the app list and select Heart rate to measure your current heart rate";

    let mockResponse = null;


    if(userMsg == 'How can i connect to mobile phone') {
        mockResponse = response1;
    }
    else if (userMsg == 'How to add a watch face') {
        mockResponse = response2;
    }
    else if (userMsg == 'How to answer & make calls using my watch') {
        mockResponse = response3;
    }
    else if (userMsg == 'How to check the Heart rate') {
        mockResponse = response4;
    }
    else {
        mockResponse = 'Copyright @ OnePlus Technology (Shenzhen) Co., Ltd. All rights reserved';
    }

  logger.info(`Sending the mock response ${mockResponse}`);

  return mockResponse;
}