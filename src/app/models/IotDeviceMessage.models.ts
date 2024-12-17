import { Room } from "../room.model"

export interface IotDeviceMessageModels {
  Id: number;
  DeviceId: string;
  Topic: string;
  Username: string;
  HomeId: string;
  Rooms: Room[];
}
