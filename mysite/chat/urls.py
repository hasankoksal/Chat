from django.urls import path
from . import views

urlpatterns = [
    path("", views.index, name="index"),
    path("howtoplay/", views.how_to_play, name="howtoplay"),
]
