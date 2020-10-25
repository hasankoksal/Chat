import socket
import threading
import random
import sched
import time

import getname


class ChatServer():

    port_list = {}

    last_received_message = ""

    def __init__(self, port=65535):
        self.clients_users = {}
        self.bots = []
        self.server_socket = None
        self.port = port
        self.max_user = 5
        self.user_number = 0
        self.buffer_int = 256
        self.create_listening_server()
        self.question_number = 0
        self.question_send_int = 0
        self.sended_question_int = 0
        self.scheduler = sched.scheduler(time.time, time.sleep)
        self.delay_time = 5
        self.scheduler_bool = True
        self.time_list = [500, 450, 400, 360, 320, 300,
                          300, 300, 300, 300, 280, 280, 280, 270, 270, 270,
                          260, 260, 260, 250, 250, 250, 240, 240, 240, 230,
                          230, 230, 220, 220, 220, 210, 210, 210, 200, 200,
                          200, 190, 190, 190, 180, 180, 180, 170, 170, 170,
                          160, 160, 160, 150, 150, 150, 145, 145, 140, 140,
                          135, 135, 130, 130, 125, 125, 120, 120, 115, 115,
                          110, 110, 105, 105, 100, 100]

        self.questions = [
            ["UP", "W"],
            ["DOWN", "S"],
            ["LEFT", "A"],
            ["RIGHT", "D"],
            ["VERTİCAL", "WS"],
            ["HORİZONTAL", "AD"],
            ["REVERSE OF RIGHT", "A"],
            ["REVERSE OF LEFT", "D"],
            ["REVERSE OF UP", "S"],
            ["REVERSE OF DOWN", "W"],
            ["UP OR LEFT", "WA"],
            ["UP OR RIGHT", "WD"],
            ["DOWN OR RIGHT", "SD"],
            ["DOWN OR LEFT", "SA"],
        ]
        if self.port != 65535:
            def schedule():
                self.scheduler.enter(self.delay_time, 1, self.close_entering_client)
                self.scheduler.run()
            threading.Thread(target=schedule).start()

    def close_entering_client(self):
        if self.scheduler_bool:
            self.scheduler_bool = False
            users_id = []
            users_name = []
            self.port_list[self] = False

            while self.user_number != self.max_user:
                self.create_bot()

            for i in self.clients_users.keys():
                users_id.append(id(i))
                users_name.append(self.clients_users[i])
            for i in self.bots:
                users_id.append(id(i))
                users_name.append(i.name)
            for i in users_id:
                self.broadcast_to_all_clients("10"+i)
                time.sleep(0.02)
            for i in users_name:
                self.broadcast_to_all_clients("11"+i)
                time.sleep(0.02)
            self.broadcast_to_all_clients("02")

    def create_bot(self):
        bot = Bot()
        self.bots.append(bot)
        self.user_number += 1

    def create_listening_server(self):
        self.server_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        local_ip = '127.0.0.1'
        local_port = self.port
        self.server_socket.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        self.server_socket.bind((local_ip, local_port))
        self.server_socket.listen(self.max_user)
        self.receive_messages_in_a_new_thread()

    def receive_messages(self, so):
        while True:
            incoming_buffer = so.recv(self.buffer_int)
            if not incoming_buffer:
                break
            self.last_received_message = incoming_buffer.decode('utf-8')
            self.control_messages(self.last_received_message, so)
        so.close()

    def control_messages(self, message, so):
        if message[0:2] == "03":
            self.send_port(so)
        if message[0:2] == "04":
            self.leave_port(so)
        if message[0:2] == "05":
            self.last_received_message = "06" + id(so)
            del self.clients_users[so]
            self.broadcast_to_all_clients()
        if message[0:2] == "01":
            self.clients_users[so] = message[2:]
            if len(self.clients_users) == self.max_user:
                self.scheduler_bool = False
                self.close_entering_client()
        if message[0:2] == "07":
            self.send_question(so)

    def send_port(self, so):
        new_port_bool = True
        for i in self.port_list.items():
            if i:
                new_port_bool = False
        if new_port_bool:
            new_port_number = str(self.choose_random_port())
            new_port = ChatServer(new_port_number)
            so.sendall(new_port_number.encode("utf-8"))
            self.port_list[new_port] = True
            new_port.user_number += 1
        else:
            for port in self.port_list.keys():
                if self.port_list[port]:
                    so.sendall(json.dumps({
                        'type': 'send_port',
                        'message': port,
                    }))
                    port.user_number += 1

    def choose_random_port(self):
        new_port_number = random.randrange(65535)
        for port_object in self.port_list.keys():
            if new_port_number == port_object.port:
                self.choose_random_port()
        else:
            return new_port_number

    def broadcast_to_all_clients(self, message=""):
        if not bool(message):
            message = self.last_received_message
        for so in self.clients_users.keys():
            so.sendall(json.dumps(message).encode('utf-8'))
        if message['type'] == "message":
            if message["message"] == "lose_another":
                if (self.clients_users.keys()) == 1 and (self.bots == 0):
                    so.sendall(json.dumps({
                        'type': 'message',
                        'message': 'win',
                    }))

    def receive_messages_in_a_new_thread(self):
        while True:
            so, (ip, port) = self.server_socket.accept()
            t = threading.Thread(target=self.receive_messages, args=(so,))
            t.start()

    def leave_port(self, so):
        del self.clients_users[so]
        self.user_number -= 1
        if len(self.clients_users.keys()) == 0:
            if self.port != 65535:
                self.server_socket.close()
                del self

    def send_question(self, so):
        self.question_send_int += 1
        if self.sended_question_int > len(self.time_list):
            time = 100
        else:
            time = self.time_list[self.sended_question_int]
        if self.question_send_int == len(self.clients_users.items()):
            for bot in self.bots:
                if not bot.answer_question:
                    for i in range(self.bots):
                        if i is bot:
                            del self.bots[i]
                            self.last_received_message = {
                                'type': 'message',
                                'message': 'lose_another',
                                'id': id(i)
                            }
        so.sendall(json.dumps({
            'type': "question",
            'question': self.questions[self.question_number][0],
            'answer': self.questions[self.question_number][1],
            'time': time
        }))

        self.sended_question_int += 1

        if self.question_send_int == len(self.clients_users.items()):
            self.choose_question()

    def choose_question(self):
        self.question_send_int = 0
        self.question_number = random.randrange(len(self.questions))


class Bot():

    def __init__(self, ):
        self.name = getname.random_name('superhero')
        self.correct_rate = 97

    def answer_question(self):
        random_number = random.randint(0, 100)
        if random_number > self.correct_rate:
            return False
        else:
            return True


if __name__ == "__main__":
    ChatServer()
