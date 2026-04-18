from fastapi import FastAPI
from astrapy import DataAPIClient
from fastapi.middleware.cors import CORSMiddleware
import os

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

client = DataAPIClient()
db = client.get_database(os.getenv("ASTRA_CLIENT_DB"), token=os.getenv("ASTRA_CLIENT_TOKEN"))

@app.post("/workout-goal")
def get_workout_goal():
    users = db.get_table("users")
    userData = users.find_one({"name": "John Doe"})
    return {
        "curr_weekly_hours": userData["curr_weekly_hours"],
        "goal_weekly_hours": userData["goal_weekly_hours"],
    }

if __name__ == "__get_workout_goal__":
    get_workout_goal()