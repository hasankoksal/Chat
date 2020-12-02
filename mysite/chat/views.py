from django.shortcuts import render
from django.views.decorators.clickjacking import xframe_options_exempt
import getname


@xframe_options_exempt
def index(request):
    return render(request, "chat/index.html", {'username': getname.random_name('superhero')})
