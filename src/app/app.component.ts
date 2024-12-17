import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import {AppRoutingModule} from './app-routing.module';
import {IotDeviceMessageModels} from './models/IotDeviceMessage.models';
import {SignalrService} from './signalr.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, HttpClientModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'] // Corrigez styleUrl en styleUrls
})
export class AppComponent implements OnInit {
  title = 'SMARTHOME';
  public apireturn: any;
  public isLampOn: boolean = false; // État initial de la lampe

  constructor(private http: HttpClient, private signalRService: SignalrService) {}

  ngOnInit(): void {

    // this.fetchData(); // Uncomment if you want to fetch data on initialization
  }

  public fetchData() {
    this.http.get("https://jsonplaceholder.typicode.com/todos/1").subscribe(
      (resp: any) => {
        console.log(resp);
        this.apireturn = resp;

        // Ajoute la classe pour afficher le titre
        setTimeout(() => {
          const titleElement = document.querySelector('h1');
          if (titleElement) {
            titleElement.classList.add('show');
          }
        }, 100); // Petite pause pour s'assurer que l'élément est rendu avant l'ajout de la classe
      }
    );
  }

  public sendEventData() {
    const eventPayload = {
      id: "9aeb0fdf-c01e-0131-0922-9eb54906e209",
      eventType: "recordInserted",
      subject: "/function1",
      eventTime: "2024-10-30T14:15:00Z",
      data: {
        id: 1,
        fullName: "John Doe",
        age: 30,
        email: "john.doe@example.com"
      },
      dataVersion: "1.0"
    };

    const url = "https://testtriggerevent.azurewebsites.net/runtime/webhooks/EventGrid?functionName=Function1&code=AOh_JV5o_a3AgueQIztu66d3sKR14MzQtOYrfu-n2tGUAzFuRrHZag==";

    // Configuration des en-têtes
    const headers = {
      'Content-Type': 'application/json',
      'aeg-event-type': 'Notification'
    };

    this.http.post(url, eventPayload, { headers }).subscribe(
      response => {
        console.log("Event sent successfully:", response);
      },
      error => {
        console.error("Error sending event:", error);
      }
    );
  }

  public toggleLamp() {
    this.isLampOn = !this.isLampOn; // Inverse l'état de la lampe
    //this.apireturn.title = this.isLampOn ? 'The lamp is ON' : 'The lamp is OFF'; // Mise à jour du titre en fonction de l'état
    this.sendEventData();
    this.fetchData();
  }

  /*sendMessage(message: string) {
    var jsonMessage = { DeviceId: "SmartHome", Message: message };
    var lightEndpoint = { id: 0, name:"Light", state: true };
    var socketEndpoint = { id: 1, name:"Socket", state: false };

    var livingRoom = {id: 2, name:"Living Room", devices: [lightEndpoint, socketEndpoint]};
    var kitchen = {id: {timestamp: 123456789, creationTime: "2024-06-14T12:00:00Z"}, name:"Kitchen", devices: [lightEndpoint, socketEndpoint]};

    var rooms = [livingRoom, kitchen]

    var iotDeviceMessage : IotDeviceMessageModels = {Id : 1, DeviceId: "SmartHome", Topic: "team3", Username:"Common", HomeId: "SmartHome", Rooms: rooms}
    var stringMessage = JSON.stringify(iotDeviceMessage);
    this.signalRService.sendMessage(iotDeviceMessage);

  }
*/
}
