from channels.generic.websocket import WebsocketConsumer

import socket
import threading


class ChatConsumer(WebsocketConsumer):

    def connect(self):
        self.accept()
        self.sckt = ""

    def disconnect(self, close_code):
        if self.sckt:
            self.sckt.send("04".encode('utf-8'))
            self.sckt.close()

    def receive(self, content):
        if content[0:2] == "01":
            self.user_name = content[2:]
            self.initalize_socket()
        if self.sckt:
            self.sckt.send(content.encode('utf-8'))

    def initalize_socket(self):
        self.buffer_int = 256
        self.ip = '127.0.0.1'
        port_reciver = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        port_reciver.connect((self.ip, 65535))
        port_reciver.send(("03" + self.user_name).encode('utf-8'))
        self.port = port_reciver.recv(self.buffer_int).decode('utf-8')
        port_reciver.close()
        self.sckt = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        self.sckt.connect((self.ip, self.port))

    def listen_for_incoming_messages_in_a_thread(self):
        thread = threading.Thread(target=self.receive_message_from_server, args=(self.sckt,))
        thread.start()

    def receive_message_from_server(self, so):
        while True:
            buffer = so.recv(self.buffer_int)
            if not buffer:
                break
            message = buffer.decode('utf-8')
            self.send(message)
        so.close()
