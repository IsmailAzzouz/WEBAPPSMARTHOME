import {Injectable} from '@angular/core';
import {HubConnection, HubConnectionBuilder, LogLevel} from '@microsoft/signalr';
import {Subject} from 'rxjs';
import {Device} from './device.model';
import {IotDeviceMessageModels} from './models/IotDeviceMessage.models';

@Injectable({
  providedIn: 'root'
})
export class SignalrService {
  private hubConnection!: HubConnection;
  private deviceStateChangedSource = new Subject<{ roomId: string; device: Device; deviceId: string ,state:boolean}>();
  deviceStateChanged$ = this.deviceStateChangedSource.asObservable();
  private accessToken: string = '';
  constructor() {}
  public startConnection(): void {
    this.hubConnection = new HubConnectionBuilder()
      .withUrl('https://team3signalr.service.signalr.net/client/?hub=devicehub', {
        accessTokenFactory: async () => {
          try {
            const response = await fetch('https://testtriggerevent.azurewebsites.net/api/negotiate', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
            });

            if (!response.ok) {
              console.error('Failed to negotiate. Status:', response.status, await response.text());
              throw new Error('Failed to negotiate SignalR connection.');
            }
            const data = await response.json();
            this.accessToken = data.accessToken;
            return data.accessToken;
          } catch (error) {
            console.error('Error during negotiate request:', error);
            throw error;
          }
        }
      })
      .configureLogging(LogLevel.Debug)
      .build();

    this.hubConnection
      .start()
      .then(() => {
        console.log('SignalR Connected');
      })
      .catch(err => console.error('Error while connecting to SignalR:', err));
  }

  addMessageListener(callback: (message: string) => void) {
    this.hubConnection.on('ReceiveMessage', callback);
  }

  sendMessage(iotDeviceMessage: IotDeviceMessageModels) {
    fetch('https://testtriggerevent.azurewebsites.net/api/SendToDevice?code=AOh_JV5o_a3AgueQIztu66d3sKR14MzQtOYrfu-n2tGUAzFuRrHZag%3D%3D', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'aeg-event-type': 'Notification'
      },
      body: JSON.stringify(iotDeviceMessage)
    })
      .then(response => {console.log("Response:", response.text())})
      .then(result => {console.log("Command sent:", result)})
      .catch(err => { console.log("Error:", err) })
  }

  public sendDeviceStateUpdate(roomId: string, device: Device, deviceId: string, state:boolean): void {
    if (this.hubConnection) {
      console.log("Sending device state update...");

      // Récupérez l'objet device existant pour obtenir son nom et son ID
      console.log(this.hubConnection);
      console.log(this.accessToken);
      console.log(device);
      this.hubConnection.invoke('SendDeviceStateUpdate', device, roomId,deviceId,state)
        .catch(err => console.error('Error sending device state update: ' + err));
    }
  }

  // Méthode pour envoyer l'état du dispositif à une Azure Function
  private async sendDeviceStateToAzureFunction(device: Device, roomId: string, deviceId: string, state: boolean): Promise<void> {
    // const url = 'testtriggerevent.azurewebsites.net/runtime/webhooks/EventGrid?functionName=Function1&code=AOh_JV5o_a3AgueQIztu66d3sKR14MzQtOYrfu-n2tGUAzFuRrHZag==';  // URL de l'Azure Function
    // const payload = { device, roomId, deviceId, state };

    // try {
    //   const response = await axios.post(url, payload, {
    //     headers: {
    //       'Content-Type': 'application/json'
    //     }
    //   });

    //   console.log('Device state successfully sent to Azure Function:', response.data);
    // } catch (err) {
    //   console.error('Error sending device state to Azure Function:', err);
    // }
    // Construire le payload avec la structure attendue
  //   const payload = {
  //     device: {
  //       id: {
  //         creationTime: "2024-11-28T12:06:04Z",
  //         timestamp: Math.floor(new Date().getTime() / 1000)
  //       },
  //       name: device.name,
  //       state: state
  //     }
  //   };
  //   console.log("test : ", JSON.stringify(payload));

  //   fetch('https://TestTriggerEvent.azurewebsites.net/api/Function1/code=iNjXAkGFh6sG3Nl19DJyH6UIe0flwXVkliaIQ70kbwkgAzFuEBG7NA==',{
  //     method: 'POST',
  //     headers: {'Content-Type' : 'application/json'},
  //     body: JSON.stringify(payload)
  //   })
  //   .then(response => {console.log("Response: ", response.text())})
  //   .then(result => console.log("Command send : ", result))
  //   .catch(error => console.error("Error sending command : ", error))
    const payload = {
      topic: "/subscriptions/e7c7ec94-2d1c-4399-aae0-65b42a0bd4b4/resourceGroups/rs-helb-team3/providers/Microsoft.EventGrid/topics/functionsub",
      subject: "DeviceStateUpdate",
      eventType: "DeviceStateUpdate",
      eventTime: "2024-12-09T00:00:00Z",
      id: "unique-event-id",
      data: {
        device
      },
      dataVersion: "1.0",
      metadataVersion: "1"
    };
  console.log("Sending to Azure Function: ", JSON.stringify(payload));

  const url = 'https://testtriggerevent.azurewebsites.net/runtime/webhooks/EventGrid?functionName=Function1&code=AOh_JV5o_a3AgueQIztu66d3sKR14MzQtOYrfu-n2tGUAzFuRrHZag==';  // Correction ici
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'aeg-event-type':'Notification' },
      body: JSON.stringify(payload)
    });

    if (response.ok) {
      console.log("Device state successfully sent to Azure Function:", await response.text());
    } else {
      console.error("Failed to send device state. Status:", response.status, await response.text());
    }
  } catch (error) {
    console.error("Error sending device state to Azure Function:", error);
  }
  }
  public addDeviceStateChangedListener(callback: () => void): void {
    if (this.hubConnection) {
      this.hubConnection.on('devicestatechanged', (roomId: string, device: Device, deviceId: string, state: boolean) => {
        console.log('Device state changed:', { roomId, device, deviceId, state });

        // Exécuter le callback pour rafraîchir les rooms
        callback();
      });
    } else {
      console.error('HubConnection is not initialized.');
    }
  }


  public addRoomsUpdatedListener(callback: () => void): void {
    this.hubConnection.on('roomsUpdated', () => {
      console.log('Rooms updated event received');
      callback(); // Appel du callback pour notifier le composant
    });
  }

}
