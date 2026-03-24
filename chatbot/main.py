from src.chatbot import get_response

print("Chatbot Started (type 'exit' to stop)\n")

while True:
    user = input("You: ")
    
    if user.lower() == "exit":
        print("Bot: Goodbye!")
        break
    
    response = get_response(user)
    print("Bot:", response)