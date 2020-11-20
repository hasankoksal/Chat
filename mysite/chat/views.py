from django.shortcuts import render
import getname


def index(request):
    return render(request, "chat/index.html", {'username': getname.random_name('superhero')})


def how_to_play(request):
    return render(request, "chat/howtoplay.html")
