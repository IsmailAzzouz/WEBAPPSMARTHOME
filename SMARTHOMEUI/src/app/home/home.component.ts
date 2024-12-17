import {Component, ElementRef, OnInit} from '@angular/core';
import { Router } from '@angular/router';
import { UserService } from '../user.service';
import {HttpClient, HttpClientModule} from '@angular/common/http';
import { User } from '../user.model';
import { Room } from '../room.model';
import { Device } from '../device.model';
import {CommonModule, NgFor, NgIf} from '@angular/common';
import {FormsModule} from '@angular/forms';
import { SignalrService } from '../signalr.service';
import { Subscription } from 'rxjs';
import {IotDeviceMessageModels} from '../models/IotDeviceMessage.models';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [NgIf, NgFor, CommonModule, HttpClientModule, FormsModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  user: User | null = null;
  rooms: Room[] = [];
  isRoomModalOpen: boolean = false;
  isDeviceModalOpen: boolean = false;
  newRoomName: string = '';
  newDeviceName: string = '';
  selectedRoomId: string | null = null;
  isUpdateDeviceModalOpen = false;
  UpdatedDeviceName = '';
  isUpdateRoomModalOpen: boolean = false;

  updatedRoomName: string = '';
  updatedDeviceName: string = '';
  imagepath: string ="";
  selectedDeviceId: string | null = null;

  private deviceStateSubscription: Subscription | null = null;


  constructor(
    private router: Router,
    private userService: UserService,
    private http: HttpClient,private elementRef: ElementRef,
    private signalRService: SignalrService
  ) {

  }



  private updateDeviceStateLocally(roomId: string, device: Device, deviceId:string, state:boolean): void {
    const room = this.rooms.find(r => r.id === +roomId);

    if (room) {
      const targetDevice = room.devices.find(d => d.id.toString() === deviceId);

      if (targetDevice) {
        targetDevice.state = state; // Update the device's state
        targetDevice.name = device.name;
      }
    }
  }

  ngOnInit(): void {
    this.user = this.userService.getUser();
    if (!this.user) {
      this.router.navigate(["/login"]);
    } else {
      this.signalRService.startConnection();

      // Écouter les changements d'état d'appareil pour actualiser les rooms
      this.signalRService.addDeviceStateChangedListener(() => {
        console.log("fecth");
        this.fetchUserRooms(); // Actualiser toutes les rooms
      });

      this.signalRService.addMessageListener((message: string) => {

        this.handleArduinoMessage(message);
      });

      this.deviceStateSubscription = this.signalRService.deviceStateChanged$.subscribe(
        (update) => {
          this.updateDeviceStateLocally(update.roomId, update.device, update.deviceId, update.state);
        }
      );

      this.fetchUserRooms(); // Chargement initial
    }
  }

  /*handleArduinoMessage(jsonMessage: string): void {
    const parsedMessage = JSON.parse(jsonMessage);
    if(!this.user?.username){
      return;
    }
    if(!(parsedMessage.username==this.user.username)){
      return;
    }
    parsedMessage.rooms.forEach((incomingRoom: any) => {
      // Chercher la room existante
      const existingRoom = this.rooms.find(r => r.id === incomingRoom.id);

      if (existingRoom) {
        // Mettre à jour les devices de la room
        incomingRoom.devices.forEach((incomingDevice: any) => {
          const existingDevice = existingRoom.devices.find(d => d.id === incomingDevice.id);

          if (existingDevice) {


              existingDevice.state = incomingDevice?.isOn;
              //this.toggleDeviceStateArduino(existingRoom.id,existingDevice);
            const batchUpdate = parsedMessage.rooms.flatMap(room =>
              room.devices.map(device => ({
                roomId: room.id,
                deviceId: device.id,
                state: device.isOn
              }))
            );




            //this.updateDeviceOnMongo(existingRoom.id.toString(), existingDevice.id.toString(), existingDevice.name, existingDevice.state);
          } else {
            // Ajouter un nouveau device si non existant
            existingRoom.devices.push({
              id: incomingDevice.id,
              name: incomingDevice.name,
              state: incomingDevice.isOn
            });
          }
        });
      } else {

        this.createRoomOnMongo(incomingRoom);


        // Ajouter une nouvelle room si elle n'existe pas
       this.rooms.push({
          id: incomingRoom.id,
          name: incomingRoom.name,
          devices: incomingRoom.devices.map((device: any) => ({
            id: device.id,
            name: device.name,
            state: device.isOn
          }))
        });


      }
    });

    console.log("Rooms updated:ARDUINO MESSAGE ", this.rooms);
  }
*/
  async handleArduinoMessage(jsonMessage: string): Promise<void> {
    const parsedMessage = JSON.parse(jsonMessage);

    if (!this.user?.username || parsedMessage.username !== this.user.username) {
      return;
    }

    // Préparation des mises à jour par batch
    const batchUpdate = [];

    for (const incomingRoom of parsedMessage.rooms) {
      const existingRoom = this.rooms.find(r => r.id === incomingRoom.id);

      if (existingRoom) {
        for (const incomingDevice of incomingRoom.devices) {
          const existingDevice = existingRoom.devices.find(d => d.id === incomingDevice.id);

          if (existingDevice && existingDevice.state !== incomingDevice.isOn) {
            // Mise à jour de l'état local
            existingDevice.state = incomingDevice.isOn;

            // Ajouter au batch
            batchUpdate.push({
              roomId: existingRoom.id,
              deviceId: existingDevice.id,
              state: incomingDevice.isOn
            });
          } else if (!existingDevice) {
            // Ajouter le nouveau device localement
            existingRoom.devices.push({
              id: incomingDevice.id,
              name: incomingDevice.name,
              state: incomingDevice.isOn
            });

            // Ajouter au batch
            batchUpdate.push({
              roomId: existingRoom.id,
              deviceId: incomingDevice.id,
              state: incomingDevice.isOn
            });
          }
        }
      } else {
        // Nouvelle room : ajoute les devices
        this.rooms.push({
          id: incomingRoom.id,
          name: incomingRoom.name,
          devices: incomingRoom.devices.map((device: any) => ({
            id: device.id,
            name: device.name,
            state: device.isOn
          }))
        });

        // Ajouter toute la room au batch
        incomingRoom.devices.forEach((device: any) => {
          batchUpdate.push({
            roomId: incomingRoom.id,
            deviceId: device.id,
            state: device.isOn
          });
        });
        this.createRoomOnMongo(incomingRoom);
      }
    }

    // Envoi des mises à jour en batch au backend
    if (batchUpdate.length > 0) {
      await this.http.post(
        `https://smarthomebackend-c9hacbgkd6d6fxhx.westeurope-01.azurewebsites.net/api/Devices/${this.user?.id}/batchUpdate`,
        batchUpdate
      ).toPromise();
    }

    console.log("Rooms updated (Batch):", this.rooms);
  }




  createRoomOnMongo(room: any): void {
    const roomDto = {
      id:room.id,
      name: room.name,
      devices: room.devices.map((device: any) => ({
        id:device.id,
        name: device.name,
        state: device.isOn
      }))
    };

    this.http.post(`https://smarthomebackend-c9hacbgkd6d6fxhx.westeurope-01.azurewebsites.net/api/Rooms/users/${this.user?.id}/rooms`, roomDto)
      .subscribe({
        next: (response) => {
          console.log('Room created in MongoDB:', response);
        },
        error: (error) => {
          console.error('Error creating room in MongoDB:', error);
        }
      });
  }


  ngAfterViewInit() {
    this.elementRef.nativeElement.ownerDocument
      .body.style.backgroundColor = '#1a1a1a';
  }

  // Fetch rooms for the current user
  public fetchUserRooms(): void {
    if (this.user) {
      const url = "https://smarthomebackend-c9hacbgkd6d6fxhx.westeurope-01.azurewebsites.net/api/Rooms/users/" + this.user.id + "/rooms"
      this.http.get<Room[]>(url)
        .subscribe({
          next: (rooms) => {
            this.rooms = rooms;
          },
          error: (error) => {
            console.error('Error fetching rooms:', error);
          }
        });
    }
  }

  // Room Management
  openRoomModal(): void {
    this.isRoomModalOpen = true;
  }

  closeRoomModal(): void {
    this.isRoomModalOpen = false;
    this.newRoomName = '';
  }

  createRoom(): void {
    const roomDto = {
      name: this.newRoomName,
      devices: [
        {
          id:0,
          name:"Default Device",
          state:false
        }
      ]
    };
    if (this.user && this.newRoomName) {
      const body= {
        userId: this.user.id,
        roomDto
      }


      this.http.post<any>(`https://smarthomebackend-c9hacbgkd6d6fxhx.westeurope-01.azurewebsites.net/api/Rooms/users/${this.user.id}/rooms`, roomDto)
        .subscribe({
          next: (response) => {
            this.rooms.push(response.room);
            this.closeRoomModal();
          },
          error: (error) => {
            console.error('Error creating room:', error);
          }
        });
    }
  }

  deleteRoom(roomId: number): void {
    this.http.delete(`https://smarthomebackend-c9hacbgkd6d6fxhx.westeurope-01.azurewebsites.net/api/Rooms/${roomId}`)
      .subscribe({
        next: () => {
          this.rooms = this.rooms.filter(room => room.id !== +roomId);
        },
        error: (error) => {
          console.error('Error deleting room:', error);
        }
      });
  }

  // Device Management
  openDeviceModal(roomId: string): void {
    this.selectedRoomId = roomId;
    this.isDeviceModalOpen = true;

  }

  closeDeviceModal(): void {
    this.isDeviceModalOpen = false;
    this.newDeviceName = '';
    this.selectedRoomId = null;
  }

  createDevice(): void {
    if (this.selectedRoomId && this.newDeviceName) {
      const deviceDto = {
        name: this.newDeviceName,
        state: false
      };

      this.http.post<any>(`https://smarthomebackend-c9hacbgkd6d6fxhx.westeurope-01.azurewebsites.net/api/Devices/${this.user?.id}/rooms/${this.selectedRoomId}/devices`, deviceDto)
        .subscribe({
          next: (response) => {

            const room = this.rooms.find(r => r.id === Number(this.selectedRoomId));

            if (room) {
              room.devices = room.devices || [];
              room.devices.push(response.device);

            }
            this.closeDeviceModal();
          },
          error: (error) => {
            console.error('Error creating device:', error);
          }
        });
    }
  }


  deleteDevice(roomId: string, deviceId: string): void {
    this.http.delete(`https://smarthomebackend-c9hacbgkd6d6fxhx.westeurope-01.azurewebsites.net/api/Devices/${this.user?.id}/${roomId}/${deviceId}`)
      .subscribe({
        next: () => {
          const room = this.rooms.find(r => r.id === +roomId);
          if (room) {
            room.devices = room.devices.filter(device => device.id !== +deviceId);
          }
        },
        error: (error) => {
          console.error('Error deleting device:', error);
        }
      });
  }

  // Update device state
  toggleDeviceState(roomId: string, device: Device): void {
    const deviceDto = {
      name: device.name,
      state: !device.state
    };

    this.http.put(`https://smarthomebackend-c9hacbgkd6d6fxhx.westeurope-01.azurewebsites.net/api/Devices/${this.user?.id}/${roomId}/${device.id}`, deviceDto)
      .subscribe({
        next: () => {
          console.log('Device state updated TOGGLE DEVICE STATE');
          var iotDeviceMessage : IotDeviceMessageModels = {Id : 1, DeviceId: "SmartHome", Topic: "team3", Username:"JohnDoe", HomeId: "SmartHome", Rooms: this.rooms}

          this.signalRService.sendMessage(iotDeviceMessage);

          const room = this.rooms.find(r => r.id === +roomId);
          if (room) {
            const deviceToUpdate = room.devices.find(d => d.id === device.id);
            if (deviceToUpdate) {
              deviceToUpdate.state = deviceDto.state;
            }
          }
        },
        error: (error) => {
          console.error('Error updating device state:', error);
        }
      });
  }

    toggleDeviceStateArduino(roomId: number, device: Device): void {
    const deviceDto = {
      id:device.id,
      name: device.name,
      state: device.state
    };

    this.http.put(`https://smarthomebackend-c9hacbgkd6d6fxhx.westeurope-01.azurewebsites.net/api/Devices/${this.user?.id}/${roomId}/${device.id}`, deviceDto)
      .subscribe({
        next: () => {

         var iotDeviceMessage : IotDeviceMessageModels = {Id : 1, DeviceId: "SmartHome", Topic: "team3", Username:"JohnDoe", HomeId: "SmartHome", Rooms: this.rooms}

          this.signalRService.sendMessage(iotDeviceMessage);

          const room = this.rooms.find(r => r.id === +roomId);
          if (room) {
            const deviceToUpdate = room.devices.find(d => d.id === device.id);
            if (deviceToUpdate) {
              deviceToUpdate.state = deviceDto.state;
            }
          }
        },
        error: (error) => {
          console.error('Error updating device state:', error);
        }
      });
  }

  disconnect(): void {
    this.userService.logout();
    this.router.navigate(['/login']);
  }

  // Ouvrir le modal pour mettre à jour une room
  openUpdateRoomModal(roomId: string, currentRoomName: string): void {
    this.selectedRoomId = roomId;
    this.updatedRoomName = currentRoomName; // Pré-remplir avec le nom actuel
    this.isUpdateRoomModalOpen = true;

  }

// Fermer le modal de mise à jour de la room
  closeUpdateRoomModal(): void {
    this.isUpdateRoomModalOpen = false;
    this.updatedRoomName = '';
    this.selectedRoomId = null;
  }

// Mettre à jour le nom d'une room
// In the updateRoom method
  updateRoom(): void {
    if (this.selectedRoomId === null) {
      return;
    }


    const roomId = this.selectedRoomId; // Create a non-null variable
    if (this.updatedRoomName) {
      var roomUpdate = this.rooms.find(r => r.id === +roomId);
      if (!roomUpdate) {
        return;
      }

      roomUpdate.name = this.updatedRoomName;
      this.http.patch(`https://smarthomebackend-c9hacbgkd6d6fxhx.westeurope-01.azurewebsites.net/api/Rooms/${roomId}`, roomUpdate)
        .subscribe({
          next: () => {
            const room = this.rooms.find(r => r.id === +roomId);
            if (room) {
              room.name = this.updatedRoomName; // Mettre à jour localement
              this.closeUpdateRoomModal();
            }
          },
          error: (error) => {
            console.error('Error updating room:', error);
          }
        });
    }
  }

// In the updateDevice method
  updateDevice(): void {
    console.log("updateDEVICE");

    if (this.selectedRoomId && this.selectedDeviceId && this.UpdatedDeviceName) {
      const roomId = this.selectedRoomId;
      const deviceId = this.selectedDeviceId;
      const room = this.rooms.find(r => r.id === +roomId);
      if(!room){
        return;
      }
      if (!room.devices) {
        return;
      }
      var device = room.devices.find(d => d.id === +deviceId);
      if(!device?.name){
        return;
      }
      device.name = this.UpdatedDeviceName;
      const deviceDto = {
        name: this.UpdatedDeviceName,
        state: device.state
      };

      this.http.put(`https://smarthomebackend-c9hacbgkd6d6fxhx.westeurope-01.azurewebsites.net/api/Devices/${this.user?.id}/${roomId}/${deviceId}`, deviceDto)
        .subscribe({
          next: () => {
            const room = this.rooms.find(r => r.id === +roomId);
            if (room) {
              const device = room.devices.find(d => d.id === +deviceId);
              if (device) {
                device.name = this.UpdatedDeviceName; // Mettre à jour localement
                var iotDeviceMessage : IotDeviceMessageModels = {Id : 1, DeviceId: "SmartHome", Topic: "team3", Username:"Common", HomeId: "SmartHome", Rooms: this.rooms}

                this.signalRService.sendMessage(iotDeviceMessage);
              }
              this.closeUpdateDeviceModal();
            }
          },
          error: (error) => {
            console.error('Error updating device:', error);
          }
        });
    }
  }
// Ouvrir le modal pour mettre à jour un device
  openUpdateDeviceModal(roomId: string, deviceId: string, currentDeviceName: string): void {
    this.selectedRoomId = roomId;
    this.selectedDeviceId = deviceId;
    this.UpdatedDeviceName = currentDeviceName; // Pré-remplir avec le nom actuel
    this.isUpdateDeviceModalOpen = true;
  }

// Fermer le modal de mise à jour du device
  closeUpdateDeviceModal(): void {
    this.isUpdateDeviceModalOpen = false;
    this.updatedDeviceName = '';
    this.selectedRoomId = null;
    this.selectedDeviceId = null;
  }

// Mettre à jour le nom d'un device
}




