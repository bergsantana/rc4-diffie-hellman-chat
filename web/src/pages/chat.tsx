import React, { useState, useEffect } from "react";
import { MakeGenerics, useMatch, useNavigate } from "@tanstack/react-location";
import { io, Socket } from "socket.io-client";
import {
  User,
  Message,
  ServerToClientEvents,
  ClientToServerEvents,
} from "../interfaces/chat.interface";
import { Header } from "../components/header";
import { UserList } from "../components/list";
import { MessageForm } from "../components/message.form";
import { Messages } from "../components/messages";
import { ChatLayout } from "../layouts/chat.layout";
import { unsetRoom, useRoomQuery } from "../lib/rooms";
import { getUser } from "../lib/user";
import { RC4 } from "../RC4/RC4";
import { generateInt, generatePrimeNumber } from "../utils/utils";
import { parse } from "path";

const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io(
  "http://localhost:7000",
  {
    autoConnect: false,
  }
);

export interface PublicNumbers {
  prime: number;
  base: number;
}

const setSessionLocalKey = (key: string) =>
  sessionStorage.setItem("chat-key", key);
const getSessionLocalKey = () =>
  parseInt(sessionStorage.getItem("chat-key") ?? "0");

function Chat() {
  const {
    data: { user, roomName },
  } = useMatch<ChatLocationGenerics>();

  const [isConnected, setIsConnected] = useState(socket.connected);
  const [messages, setMessages] = useState<Message[]>([]);
  const [toggleUserList, setToggleUserList] = useState<boolean>(false);
  const [publicNumbers, setPublicNumbers] = useState<PublicNumbers>({
    base: generateInt(2, 15),
    prime: generatePrimeNumber(2, 50),
  });
  const [publicA, setPublicA] = useState(0);
  const [publicB, setPublicB] = useState(0);

  const [secretInt, setSecretInt] = useState(
    parseInt(sessionStorage.getItem("secretInt") ?? "0")
      ? parseInt(sessionStorage.getItem("secretInt") ?? "0")
      : generateInt(1, 10)
  );
  const [chatKey, setChatKey] = useState(
    getSessionLocalKey().toString() ? getSessionLocalKey().toString() : "0"
  );

  const [diffieHellman, setDiffieHellman] = useState<{
    [key: string]: {
      currentValue: number;
      participants: { user: string; contributed: boolean }[];
    };
  }>({});

  const { data: room } = useRoomQuery(roomName, isConnected);

  const navigate = useNavigate();

  const rc4 = () => new RC4(chatKey);

  const decryptRc4 = (message: string) => new RC4(chatKey).process(message);

  useEffect(() => {
    if (!user || !roomName) {
      navigate({ to: "/", replace: true });
    } else {
      socket.on("connect", () => {
        socket.emit("join_room", {
          roomName,
          user: { socketId: socket.id ?? "", ...user },
          sharedNumbers: publicNumbers,
        });
        setIsConnected(true);
        socket.emit("exchange", {
          user: { socketId: socket.id ?? "", ...user },
          roomName,
          publicNumbers: publicNumbers,
          df: {},
        });
      });

      socket.on("disconnect", () => {
        setIsConnected(false);
      });

      socket.on("chat", (e) => {
        console.log("e received", e);
        console.log("decripted c decrypt?", decryptRc4(e.message));
        console.log(
          "decripted c nova classe?",
          new RC4(chatKey).process(e.message)
        );
        const keyLocal = getSessionLocalKey();
        console.log("chave no session storage", keyLocal);
        console.log(
          "mensagem descriptografada com chave local",
          new RC4(keyLocal.toString()).process(e.message)
        );
        e.message = new RC4(keyLocal.toString()).process(e.message);
        console.log("minha chave de chat", chatKey);
        setMessages((messages) => [e, ...messages]);
      });

      socket.on("exchange", (e) => {
        setDiffieHellman(e.df);

        if (e?.publicNumbers && e?.room) {
          const base = e?.publicNumbers?.base ?? undefined;
          const prime = e?.publicNumbers?.prime ?? undefined;

          // console.log('numeros publicos até aqui', publicNumbers.base, publicNumbers.prime)
          if (base && prime) {
            if (publicNumbers.base !== base || publicNumbers.prime !== prime) {
              setPublicNumbers({ base, prime });
              const localInt = sessionStorage.getItem("secretInt");
              if (!localInt)
                sessionStorage.setItem("secretInt", secretInt.toString());
              if (localInt) setSecretInt(parseInt(localInt));
            }
            if (!e?.df[user.userName]) {
              e.df[user.userName] = {
                currentValue: 0,
                participants: e.room.users
                  .map((participant: any) => {
                    if (participant.userName !== user.userName) {
                      return {
                        user: participant.userName,
                        contributed: false,
                      };
                    }
                  })
                  .filter((i: any) => i !== undefined),
              };
              console.log("Minha inbox nao foi iniciada");

              socket.emit("exchange", e);
              return;
            }
          }
        } else {
          console.log("primeiro check falso");
        }

        // Há usuarios sem troca DF aberta e minha
        if (e?.room?.users.length > 1) {
          // Abra sua caixa de correspondencia individual
          // Aqui todos os participantes da sala, menos eu, farão
          // ( numero base publico  ^^( chaves secretas de cada particapante) modulo do numero primo publico )
          if (!e?.df[user.userName]) {
            e.df[user.userName] = {
              currentValue: 0,
              participants: e.room.users
                .map((participant: any) => {
                  if (participant.userName !== user.userName) {
                    return {
                      user: participant.userName,
                      contributed: false,
                    };
                  }
                })
                .filter((i: any) => i !== undefined),
            };
            socket.emit("exchange", e);
            return;
          }

          // Contribuir (g ^^ a ) mod p //
          if (e.df) {
            const keys = Object.keys(e?.df);
            if (keys.length) {
              let didContribtuion = false
              for (const key of keys) {
                if (key !== user.userName) {
                  // console.log("Atribuindo ", key);
                  const meInParticipants = e.df[key].participants.find(
                    (p: any) => p.user === user.userName
                  );

                  const hasContributed = meInParticipants.contributed;

                  // console.log("Já contribuiu?", hasContributed);
                  if (meInParticipants && !hasContributed) {
                    const value = e.df[key].currentValue
                      ? e.df[key].currentValue ** secretInt
                      : e?.publicNumbers.base ** secretInt;

                    console.log(
                      `Base: ${e?.publicNumbers.base}
                      , Primo: ${e?.publicNumbers.prime}
                      , int secreto: ${secretInt}
                      , valor antes: ${e.df[key].currentValue}
                      , já contribuí? ${hasContributed}
                      , valor acima ${value}
                      `
                    );  
                    e.df[key].currentValue += value % e?.publicNumbers.prime;
                    console.log(`Valor depois: ${e.df[key].currentValue}`);
                    meInParticipants.contributed = true;
                    // socket.emit("exchange", e);
                  }
                }
              }
              if(didContribtuion)socket.emit("exchange", e);
              setDiffieHellman(e.df);
            }
          }
        }

        if (e.df[user.userName]) {
          let everyOneContributed = true;
          const participantsInMyInbox = e.df[user.userName].participants;
          for (const participant of participantsInMyInbox) {
            // console.log('participante na minha inbox', participant)
            if (!participant.contributed) {
              everyOneContributed = false;
            }
          }

          if (everyOneContributed) {
            const newChatKey =
              e.df[user.userName].currentValue ** secretInt %
              e.publicNumbers.prime;
            // console.log('Nova Chave', newChatKey)
            setChatKey(newChatKey.toString());
            setSessionLocalKey(newChatKey.toString());
          }
        }

        // console.log("E");
        // console.log(e);
      });

      socket.connect();

      // setSecretInt(generateInt(1, 10));
    }
    return () => {
      socket.off("connect");
      socket.off("disconnect");
      socket.off("chat");
    };
  }, []);

  const leaveRoom = () => {
    socket.disconnect();
    unsetRoom();
    navigate({ to: "/", replace: true });
  };

  const sendMessage = (message: string) => {
    if (user && socket && roomName) {
      socket.emit("chat", {
        user: {
          userId: user.userId,
          userName: user.userName,
          socketId: socket.id ?? "",
        },
        timeSent: new Date(Date.now()).toLocaleString("en-US"),
        message: rc4().process(message),
        roomName: roomName,
        sharedNumbers: {
          base: publicNumbers.base,
          prime: publicNumbers.prime,
          closed: parseInt(chatKey) ? true : false,
          // A: publicA,
          // B: publicB,
        },
      });
    }
    console.log(`msg antes = ${message}`);
    console.log("mensagem encriptada");
    console.log("minha chave de chat", getSessionLocalKey());
    const encryptedMessage = rc4().process(message);
    console.log(encryptedMessage);
    const descryptedMsg = decryptRc4(encryptedMessage);
    console.log(`Mensagem descriptografada: ${descryptedMsg}`);
  };

  useEffect(() => {
    const localSecretInt = sessionStorage.getItem("secretInt");
    if (localSecretInt) setSecretInt(parseInt(localSecretInt));
  }, []);

  // console.log("Inteiro  secreto", secretInt);
  // console.log("Chave do chat", chatKey);
  return (
    <>
      {user?.userId && roomName && room && (
        <ChatLayout>
          <div className="text-white text-lg flex flex-col bg-slate-500 p-4  rounded break-words">
            <label className="">Base</label>
            <input className="text-black rounded" value={publicNumbers.base} />
            <label>Primo</label>
            <input className="text-black rounded" value={publicNumbers.prime} />
            <label>Chave do chat</label>
            <input className="text-black rounded" value={chatKey} />
            <label>Chave individual</label>
            <input className="text-black rounded" value={secretInt} />

            <button
              className="m-2 p-2 border-2  border-black"
              onClick={() => console.log(diffieHellman)}
            >
              Log Diffie-Hellman
            </button>

            <button
              className="m-2 p-2 border-2  border-black"
              onClick={() => console.log(chatKey)}
            >
              Log Chat Key
            </button>
          </div>

          <Header
            isConnected={isConnected}
            users={room?.users ?? []}
            roomName={roomName}
            handleUsersClick={() =>
              setToggleUserList((toggleUserList) => !toggleUserList)
            }
            handleLeaveRoom={() => leaveRoom()}
          ></Header>
          {toggleUserList ? (
            <UserList room={room}></UserList>
          ) : (
            <Messages user={user} messages={messages}></Messages>
          )}
          <MessageForm sendMessage={sendMessage}></MessageForm>
        </ChatLayout>
      )}
    </>
  );
}

export const loader = async () => {
  const user = getUser();
  return {
    user: user,
    roomName: sessionStorage.getItem("room"),
  };
};

type ChatLocationGenerics = MakeGenerics<{
  LoaderData: {
    user: Pick<User, "userId" | "userName">;
    roomName: string;
  };
}>;

export default Chat;
