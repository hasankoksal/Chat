import socket
import json
import threading
import time
import random
import getname

with open("server_open.txt", "w") as f:
    f.write("True")


class Room():

    def __init__(self, server):
        # Server nesnesi
        self.server = server
        # Kullanıcı socketlerinin tutulduğu dict {socket:username}
        self.users = {}
        # Botların tutulduğu liste [Bot]
        self.bots = []
        # Bot ve socketlerin usernamelerinin birleştirildiği liste [Bot, socket]
        self.all_users = []
        # Bot ve socketlerin idlerini tutan liste [id]
        self.ids = []
        # Toplam oyuncu sayısı
        self.max_user = 3
        # Tekrar soru isteyen kullanıcılar
        self.continued_users = []

        # Odaya kullanıcı girmesini kontrol eden değişken
        self.open = True
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

        self.time_list = [500, 450, 400, 360, 320, 300,
                          300, 300, 300, 300, 280, 280, 280, 270, 270, 270,
                          260, 260, 260, 250, 250, 250, 240, 240, 240, 230,
                          230, 230, 220, 220, 220, 210, 210, 210, 200, 200,
                          200, 190, 190, 190, 180, 180, 180, 170, 170, 170,
                          160, 160, 160, 150, 150, 150, 145, 145, 140, 140,
                          135, 135, 130, 130, 125, 125, 120, 120, 115, 115,
                          110, 110, 105, 105, 100, 100]
        self.time_number = 0

        threading.Thread(target=self.close_room_with_time).start()

    def join_room(self, sckt, username):
        self.users[sckt] = username
        self.all_users.append(username)
        self.ids.append(id(sckt))
        if len(self.users) == self.max_user:
            self.close_room()

    def close_room(self):
        self.open = False
        for sckt in self.users:
            sckt.sendall(json.dumps({
                'type': 'start',
                'usernames': self.all_users,
                'ids': self.ids,
            }).encode('utf-8'))
        self.send_question()

    def close_room_with_time(self):
        time.sleep(4)
        if len(self.users) == 0:
            self.delete()
        try:
            if self.open:
                self.create_bots()
                self.close_room()
        except UnboundLocalError:
            pass

    def create_bots(self):
        while len(self.all_users) < self.max_user:
            bot = Bot()
            self.bots.append(bot)
            self.all_users.append(bot.name)
            self.ids.append(id(bot))

    def control_winner(self):
        delete_bots = []
        if len(self.continued_users) == len(self.users.keys()):
            for i in range(len(self.bots)):
                time.sleep(0.1)
                if not (self.bots[i].answer_question()):
                    for scket in self.users.keys():
                        bot_id = id(self.bots[i])
                        scket.sendall(json.dumps({
                            'type': 'lose_another',
                            'id': bot_id,
                        }).encode('utf-8'))
                    delete_bots.append(i)
            delete_bots.sort(reverse=True)
            for i in delete_bots:
                del self.bots[i]
            if (len(self.bots) == 0) and (len(self.users.keys()) == 1):
                time.sleep(0.1)
                list(self.users.keys())[0].sendall(json.dumps({
                    'type': 'win',
                }).encode('utf-8'))
            elif len(self.users.keys()) == 0:
                self.delete()
            else:
                self.send_question()
                self.continued_users = []

    def correct_answer(self, sckt):
        self.continued_users.append(sckt)
        self.control_winner()

    def wrong_answer(self, sckt):
        del self.users[sckt]
        for scket in self.users.keys():
            scket.sendall(json.dumps({
                'type': 'lose_another',
                'id': str(id(scket)),
            }).encode('utf-8'))
        self.control_winner()

    def send_question(self):
        random_question_number = random.randrange(len(self.questions))
        try:
            time_int = self.time_list[self.time_number]
        except IndexError:
            time_int = 100
        question_json = {
            'type': 'question',
            'question': self.questions[random_question_number][0],
            'answer': self.questions[random_question_number][1],
            'time': time_int//2,
        }
        for sckt in self.users.keys():
            sckt.sendall(json.dumps(question_json).encode('utf-8'))

    def leave_user(self, sckt):
        if self.open:
            del self.users[sckt]
            for i in range(len(self.all_users)):
                if id(sckt) == self.ids[i]:
                    del self.ids[i]
                    del self.all_users[i]
            if len(self.users.keys()) == 0:
                del self
        else:
            self.wrong_answer(sckt)

    def delete(self):
        for i in range(len(self.server.room_list)):
            if self == self.server.room_list[i]:
                del self.server.room_list[i]
                break
        del self


class Bot():

    def __init__(self, ):
        self.name = getname.random_name('superhero')
        self.correct_rate = 90

    def answer_question(self):
        random_number = random.randint(0, 100)
        if random_number > self.correct_rate:
            return False
        else:
            return True


class Server():

    def __init__(self):
        # Oluşturulmuş odaların listesi [Room]
        self.room_list = []
        # Kullanıcının bulunduğu oda {socket:Room}
        self.user_to_room = {}
        # Serverdaki kullanıcılar [socket]
        self.all_users = []
        self.create_listening_server()

    def join_or_create_room(self, sckt, username):
        room = False
        for i in self.room_list:
            if i.open:
                room = i
                break

        if room:
            room.join_room(sckt, username)
            self.user_to_room[sckt] = room

        else:
            new_room = Room(self)
            self.room_list.append(new_room)

            self.join_or_create_room(sckt, username)

    def create_listening_server(self):
        """
        socket oluştur ve dinlemeye başla
        """
        self.server_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        self.server_socket.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        # Nereye bağlanacağını ayarla
        self.server_socket.bind(('127.0.0.1', 65535))
        # Kaç kişinin(500) bağlanacağını belirle
        self.server_socket.listen(500)
        while True:
            sckt, (ip, port) = self.server_socket.accept()
            self.all_users.append(sckt)
            t = threading.Thread(target=self.receive_messages, args=(sckt,))
            t.start()

    def receive_messages(self, sckt):
        """
        Mesaj gelmesini bekler
        """
        try:
            while sckt in self.all_users:
                incoming_buffer = sckt.recv(256)
                if not incoming_buffer:
                    break
                last_received_message = json.loads(incoming_buffer.decode('utf-8'))
                self.control_messages(last_received_message, sckt)
        except ConnectionResetError:
            pass
        sckt.close()

    def control_messages(self, message, sckt):

        if message['type'] == 'search_room':
            # Kullanıcı oda sorduysa ona oda bul
            self.join_or_create_room(sckt, message['message'])
        if message['type'] == 'leave':
            for i in range(len(self.all_users)):
                if sckt == self.all_users[i]:
                    del self.all_users[i]
                    break
            try:
                room = self.user_to_room[sckt]
                del self.user_to_room[sckt]
                room.leave_user(sckt)
            except KeyError:
                pass
        if message['type'] == 'correct':
            self.user_to_room[sckt].correct_answer(sckt)
        if message['type'] == 'lose':
            self.user_to_room[sckt].wrong_answer(sckt)


if __name__ == "__main__":
    Server()
