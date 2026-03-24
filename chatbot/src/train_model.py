import json
import pandas as pd
import os
import pickle

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.naive_bayes import MultinomialNB

from src.preprocess import preprocess

# ✅ Get base directory (project root)
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# ✅ Load dataset
data_path = os.path.join(BASE_DIR, 'data', 'data_full.json')

with open(data_path) as f:
    data = json.load(f)

# Convert to DataFrame
train_data = data['train']
test_data = data['test']

train_df = pd.DataFrame(train_data, columns=['text', 'intent'])
test_df = pd.DataFrame(test_data, columns=['text', 'intent'])

# ✅ Preprocess
train_df['clean_text'] = train_df['text'].apply(preprocess)
test_df['clean_text'] = test_df['text'].apply(preprocess)

# ✅ TF-IDF Vectorization
vectorizer = TfidfVectorizer()

X_train = vectorizer.fit_transform(train_df['clean_text'])
X_test = vectorizer.transform(test_df['clean_text'])

y_train = train_df['intent']
y_test = test_df['intent']

# ✅ Train Naive Bayes Model
model = MultinomialNB()
model.fit(X_train, y_train)

# ✅ Save model
model_dir = os.path.join(BASE_DIR, 'models')
os.makedirs(model_dir, exist_ok=True)

pickle.dump(model, open(os.path.join(model_dir, 'nb_model.pkl'), 'wb'))
pickle.dump(vectorizer, open(os.path.join(model_dir, 'vectorizer.pkl'), 'wb'))

print("✅ Model trained and saved successfully!")