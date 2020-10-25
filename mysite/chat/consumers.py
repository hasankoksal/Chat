from channels.generic.websocket import WebsocketConsumer
import socket
import threading
import json


class ChatConsumer(WebsocketConsumer):

    def connect(self):
        self.accept()
        # Server a bağlan
        self.socket_work = True
        self.create_socket()

    def receive(self, text_data):
        """
        Mesaj gelirse dokunmadan servera yolla
        """
        self.sckt.sendall((text_data).encode('utf-8'))

    def disconnect(self, error):
        self.sckt.sendall(json.dumps({
            'type': 'leave',
        }).encode('utf-8'))
        self.socket_work = False

    def create_socket(self):
        """
        Socket oluştur ve gelen mesajları dinlet.
        """
        self.sckt = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        self.sckt.connect(("127.0.0.1", 65535))
        thread = threading.Thread(target=self.receive_message_from_server)
        thread.start()

    def receive_message_from_server(self):
        """
        Serverdan mesaj gelmesini bekle
        Gelirse dokunmadan kullanıcıya yolla.
        """
        while self.socket_work:
            buffer = self.sckt.recv(256)
            if not buffer:
                break
            message = buffer.decode('utf-8')
            self.send(message)
        self.sckt.close()
