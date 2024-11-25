import { useQuery } from "@tanstack/react-query";
import axios, { AxiosResponse } from "axios";
import { Room } from "../interfaces/chat.interface";

export const useRoomQuery = (
  roomName: string | undefined,
  isConnected: boolean | undefined
) => {
  const query = useQuery({
    queryKey: ["rooms", roomName],
    queryFn: (): Promise<Room> =>
      axios
        .get(`http://localhost:7000/api/rooms/${roomName}`)
        .then((response: AxiosResponse<any>) => {
          return response.data;
        })
        .catch((e) => console.log(`Error ao enviar requisitar sala - ${e}`)),
    refetchInterval: 60000,
    enabled: isConnected,
  });
  return query;
};

export const useRoomsQuery = () => {
  const query = useQuery({
    queryKey: ["select_rooms"],
    queryFn: (): Promise<Room[]> =>
      axios
        .get(`http://localhost:7000/api/rooms`)
        .then((response: AxiosResponse<any>) => response.data),
  });
  return query;
};

export const unsetRoom = () => {
  sessionStorage.removeItem("room");
};
