from fastapi import FastAPI
from astrapy import DataAPIClient
from fastapi.middleware.cors import CORSMiddleware
import os
from pydantic import BaseModel

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


class WorkoutGoal(BaseModel):
    name: str
@app.post("/workout-goal")
def get_workout_goal(workoutGoal: WorkoutGoal):
    if not workoutGoal.name:
        return {"error": "Name is required"}
    users = db.get_table("users")
    userData = users.find_one({"name": workoutGoal.name})
    print("Got here!! - Render Debug")
    return {
        "curr_weekly_hours": userData["curr_weekly_hours"],
        "goal_weekly_hours": userData["goal_weekly_hours"],
    }

class UserData(BaseModel):
    name: str
@app.post("/get-user-data")
def get_user_data(userData: UserData):
    users = db.get_table("users")
    userData = users.find_one({"name": userData.name})
    return {
        "sex": userData["sex"],
        "height": userData["height"],
        "user_weight": userData["user_weight"],
    }