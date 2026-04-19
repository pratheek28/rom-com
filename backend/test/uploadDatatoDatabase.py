from astrapy import DataAPIClient
import os
import uuid
from datetime import datetime, timezone


client = DataAPIClient()
db = client.get_database(
  os.getenv("ASTRA_CLIENT_DB"),
  token=os.getenv("ASTRA_CLIENT_TOKEN")
)

print(f"Connected to Astra DB: {db.list_collection_names()}")

data = {
    "user_id": str(uuid.uuid4()),
    "name": "John Doe",
    "curr_weekly_hours": 10,
    "goal_weekly_hours": 30,
    "height": 302.26,
    "routine": ["Bench Press", "Squats", "Deadlifts"],
    "sex": "Male",
    "streak": 4,
    "timestamp": datetime.now(timezone.utc),
    "user_weight": 10123,
}

collection = db.get_collection("users")
collection.insert_one(data)
print(f"Data uploaded to Astra DB: {data}")