from django.urls import path
from django.conf import settings
from django.conf.urls.static import static
from . import views


urlpatterns = [
    path("", views.home, name="home"),
    path("register/", views.register_user, name="register_user"),
    path('chat/<int:chat_id>/', views.chat_page, name='chat_page'),
    path('chat/<int:chat_id>/post_message/', views.post_message, name='post_message'),
    path('chat/<int:chat_id>/get_messages/', views.get_messages, name='get_messages'),
]