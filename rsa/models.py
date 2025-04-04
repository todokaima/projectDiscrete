from django.db import models
from django.utils import timezone

class User(models.Model):
    name = models.CharField(max_length=100)
    email = models.EmailField(unique=True)  # We are making sure emails are unique, although we could do with out that since one
    #&could initiate various chatrooms.
    created_at = models.DateTimeField(default=timezone.now)
    def __str__(self):
        return self.name

class Chat(models.Model):
    chatId = models.BigIntegerField(primary_key=True)  # in this program we see the value of having primary and foreign keys
    #in this program the chat Id is going to be a primary key here, and a foreign for the messages.
    def __str__(self):
        return f"Chat {self.chatId}"

class Message(models.Model):
    chat = models.ForeignKey(Chat, on_delete=models.CASCADE)  # So by having this as foreign key we are
    #able to call all the messages that belong to the chatroom back in the most efficient way possible.
    text = models.TextField()
    timestamp = models.DateTimeField(default=timezone.now)  # passing the date at which the message was created
    tag = models.CharField(max_length=1, choices=[('A', 'Alice'), ('B', 'Bob')], null=True, blank=True)
    def __str__(self):
        return f"Message in Chat {self.chat.id} by {self.tag} at {self.timestamp}"
    #we have not set the timezone configuration to UTC+2 AS IT should in the settings file, so that may be needed