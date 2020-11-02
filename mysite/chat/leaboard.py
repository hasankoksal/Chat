import socket
import threading
import json
import time
import operator


class Leaboard_Server():
    def __init__(self):
        # [socket]
        self.sckets = []
        # {socket: str}
        self.usernames = {}
        # {socket: int}
        self.moneys = {}
        threading.Thread(target=self.create_sender_leaboard).start()
        self.create_listening_server()

    def find_first_five(self):
        first_five = []
        self.moneys = dict(sorted(self.moneys.items(), key=operator.itemgetter(1), reverse=True))
        lenght_leaboard = 5 if len(self.moneys) >= 5 else len(self.moneys)
        for i in list(self.moneys.keys())[:lenght_leaboard]:
            first_five.append([self.usernames[i], self.moneys[i]])
        return first_five

    def create_sender_leaboard(self):
        while True:
            time.sleep(1)
            self.send_leaboard()

    def list_first_or_second(self, first_list, x):
        last_list = []
        for i in range(len(first_list)):
            last_list.append(first_list[i][x])
        return last_list

    def send_leaboard(self):
        if len(self.moneys):
            first_five = self.find_first_five()
            ids = {}
            for i in list(self.moneys.keys())[:5]:
                ids[i] = id(i)
            for sckt in self.sckets:
                if sckt in list(self.moneys.keys())[:5]:
                    user_id = ids[sckt]
                    sckt.sendall(json.dumps({
                        'type': 'leaboard',
                        'usernames': self.list_first_or_second(first_five, 0),
                        'moneys': self.list_first_or_second(first_five, 1),
                        'ids': list(ids.values()),
                        'id': user_id
                    }).encode("utf-8"))
                else:
                    sckt.sendall(json.dumps({
                        'type': 'leaboard',
                        'usernames': self.list_first_or_second(first_five, 0),
                        'moneys': self.list_first_or_second(first_five, 1),
                        'ids': list(ids.values()),
                        'id': "",
                    }).encode("utf-8"))

    def control_messages(self, message, sckt):
        if message['type'] == "join":
            self.moneys[sckt] = message["money"]
            self.usernames[sckt] = "Nameless"
        if message['type'] == "change_money":
            self.moneys[sckt] = message["money"]
        if message['type'] == "change_username":
            self.usernames[sckt] = message["username"]
        if message['type'] == "leave":
            for i in range(len(self.sckets)):
                if self.sckets[i] == sckt:
                    del self.sckets[i]
                    break
            del self.moneys[sckt]
            del self.usernames[sckt]

    def create_listening_server(self):
        """
        socket oluştur ve dinlemeye başla
        """
        self.server_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        self.server_socket.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        # Nereye bağlanacağını ayarla
        self.server_socket.bind(('127.0.0.1', 65534))
        # Kaç kişinin(500) bağlanacağını belirle
        self.server_socket.listen(500)
        while True:
            sckt, (ip, port) = self.server_socket.accept()
            self.sckets.append(sckt)
            t = threading.Thread(target=self.receive_messages, args=(sckt,))
            t.start()

    def receive_messages(self, sckt):
        """
        Mesaj gelmesini bekler
        """
        while sckt in self.sckets:
            incoming_buffer = sckt.recv(256)
            if not incoming_buffer:
                break
            last_received_message = json.loads(incoming_buffer.decode('utf-8'))
            self.control_messages(last_received_message, sckt)
        sckt.close()


if __name__ == "__main__":
    Leaboard_Server()
