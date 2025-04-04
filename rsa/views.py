from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import json
from rsa.models import User, Chat, Message
from django.shortcuts import render, get_object_or_404

def home(request):
    return render(request, 'index.html') #this takes you to the home page url

def chat_page(request, chat_id):
    return render(request, "chat.html", {"chat_id": chat_id})  #guide the requests for the chat's page to the chat url

@csrf_exempt
def register_user(request):
    if request.method == "POST":
        try:
            #this is the interface for the POST method called when one wants to get a chat Id
            data = json.loads(request.body) #data is the body of data sent from the user interface
            name = data.get("name")
            email = data.get("email")
            friend_name = data.get("friend_name")
            friend_email = data.get("friend_email")

            # chatId is the hash of these supposedly unique fields, I divide by this number because the number was too big for the database table
            chat_id = abs(int(hash((name, email, friend_name, friend_email)) / 100000000))
            # save a user in the database with the information you have
            user = User(name=name, email=email)
            user.save()

            # save a user instance for hte friend
            friend = User(name=friend_name, email=friend_email)
            friend.save()

            # save the chat, this is going to be a foreign key for the messages that belong to the specific chat room
            chat = Chat(chatId=chat_id)
            chat.save()

            # This is the collection of data that's being sent back to the webpage
            return JsonResponse({
                "success": True,
                "chat_id": chat_id,
                "message": "Users and chat successfully created"
            })
            #chatGPT has helped a little bit with the structure of the requests and responses, but all the structure and architecture is mine
        except Exception as e:
            return JsonResponse({"success": False, "error": str(e)}, status=400)
    return JsonResponse({"success": False, "error": "Invalid request"}, status=400)


from django.http import JsonResponse
from .models import Message

def post_message(request, chat_id):
    if request.method == 'POST':
        # once again we are reading the data from the send message request, text and tag
        data = json.loads(request.body)
        text = data.get('text')
        tag = data.get('tag')
        if not text or not tag:
            return JsonResponse({'success': False, 'error': 'Message or tag not provided.'}, status=400)


        # we create an entry on the database for the message texts, they are going to be
        #numbers with the "-" delimiter in the end, because the database stores the ciphertexts
        message = Message.objects.create(
            chat_id=chat_id,
            text=text,
            tag=tag,
        )

        return JsonResponse({'success': True, 'message': 'Message sent successfully.'})
    #exception handling was in part written by chat gpt
    return JsonResponse({'success': False, 'error': 'Invalid method.'}, status=405)


def get_messages(request, chat_id):
    #this function as has been mentioned is greedy in the sense that it takes back to the user all of the messages from the database even&
    #&if there are no new texts sent. Moreover
    #&it is called periodically every 5secs.
    try:
        chat = Chat.objects.get(chatId=chat_id)
        messages = Message.objects.filter(chat=chat).order_by('timestamp')  # this order_by is a
        #sql command that lists them by the attribute passed as parameter in the message
        messages_data = [{"text": msg.text, "timestamp": msg.timestamp.strftime("%Y-%m-%d %H:%M:%S"), "tag": msg.tag} for msg in messages]
        #usual sql date format manipulation and ofcourse we are printing the tag next to each text
        return JsonResponse({"success": True, "messages": messages_data})
#this is basically the senders tag
    except Chat.DoesNotExist:
        return JsonResponse({"success": False, "error": "Chat not found."}, status=404)

