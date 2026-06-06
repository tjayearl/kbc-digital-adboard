from app.core.firebase import db
from datetime import datetime
from firebase_admin import firestore

async def generate_dab_ref() -> str:
    year = datetime.now().year
    counter_ref = db.collection("counters").document(f"dab_{year}")

    @firestore.transactional
    def increment(transaction, ref):
        snapshot = ref.get(transaction=transaction)
        if snapshot.exists:
            new_count = snapshot.get("count") + 1
        else:
            new_count = 1
        transaction.set(ref, {"count": new_count})
        return new_count

    transaction = db.transaction()
    count = increment(transaction, counter_ref)
    return f"DAB-{year}-{str(count).zfill(5)}"

async def generate_dab_co_ref(parent_dab_ref: str) -> str:
    year = datetime.now().year
    counter_ref = db.collection("counters").document(f"dab_co_{year}")

    @firestore.transactional
    def increment(transaction, ref):
        snapshot = ref.get(transaction=transaction)
        if snapshot.exists:
            new_count = snapshot.get("count") + 1
        else:
            new_count = 1
        transaction.set(ref, {"count": new_count})
        return new_count

    transaction = db.transaction()
    count = increment(transaction, counter_ref)
    return f"DAB-CO-{year}-{str(count).zfill(5)}"