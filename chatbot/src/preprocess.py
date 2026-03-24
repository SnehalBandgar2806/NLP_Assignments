import re
from nltk.stem import WordNetLemmatizer

# Initialize lemmatizer
lemmatizer = WordNetLemmatizer()

def preprocess(text):
    # Convert to lowercase
    text = text.lower()
    
    # Remove special characters and numbers
    text = re.sub(r'[^a-zA-Z]', ' ', text)
    
    # Simple tokenization (no NLTK punkt)
    words = text.split()
    
    # Lemmatization
    words = [lemmatizer.lemmatize(word) for word in words]
    
    # Join words back
    return " ".join(words)