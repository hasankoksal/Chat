from django.shortcuts import render
import getname


def index(request):
    return render(request, "chat/index.html", {'username': getname.random_name('superhero')})

