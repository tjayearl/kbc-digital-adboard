import firebase_admin
from firebase_admin import credentials, firestore, auth
import os

def initialize_firebase():
    if not firebase_admin._apps:
        cred_path = os.getenv("FIREBASE_CREDENTIALS_PATH")
        if not cred_path:
            if os.path.exists("/etc/secrets/serviceAccountKey.json"):
                cred_path = "/etc/secrets/serviceAccountKey.json"
            else:
                cred_path = "serviceAccountKey.json"
        cred = credentials.Certificate(cred_path)
        firebase_admin.initialize_app(cred)

initialize_firebase()

db = firestore.client()
firebase_auth = auth