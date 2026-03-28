from pymongo import MongoClient

MONGO_URI = "mongodb+srv://jayeshdhamal03:jayeshdhamal003@cluster01.k7got.mongodb.net/?retryWrites=true&w=majority&appName=Cluster01"

client = MongoClient(MONGO_URI)

db = client["health_app"]

# Existing
users_collection = db["users"]

# ADD THESE TWO LINES
sessions_collection = db["sessions"]
messages_collection = db["messages"]