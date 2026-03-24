import pickle
import os
import random

from src.preprocess import preprocess

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

model = pickle.load(open(os.path.join(BASE_DIR, 'models', 'nb_model.pkl'), 'rb'))
vectorizer = pickle.load(open(os.path.join(BASE_DIR, 'models', 'vectorizer.pkl'), 'rb'))

context = {}

def get_response(user_input):
    clean = preprocess(user_input)
    vec = vectorizer.transform([clean])
    
    intent = model.predict(vec)[0].lower()

    # Greeting
    if "greet" in intent or "hello" in user_input.lower():
        return random.choice(["Hello!", "Hi there!", "Hey!"])

    # Goodbye
    if "bye" in intent:
        return "Goodbye!"

    # Transfer
    if "transfer" in intent:
        context['last'] = "transfer"
        return "To whom do you want to transfer money?"

    # Amount after transfer
    if context.get('last') == "transfer":
        if user_input.isdigit():
            context['last'] = None
            return f"₹{user_input} transferred successfully (demo)."
        else:
            return "Please enter a valid amount."

    # Balance
    if "balance" in intent:
        return "Your balance is ₹10,000 (demo)."

    # Fallback
    return f"(Detected: {intent}) Sorry, I didn't understand."