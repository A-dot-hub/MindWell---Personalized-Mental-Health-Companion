from pymongo import MongoClient

MONGO_URI = "mongodb+srv://jayeshdhamal03:jayeshdhamal003@cluster01.k7got.mongodb.net/?retryWrites=true&w=majority&appName=Cluster01"

client = MongoClient(MONGO_URI)

db = client["health_app"]

# Existing
users_collection = db["users"]

# ADD THESE TWO LINES
sessions_collection = db["sessions"]

# Messages Collection Schema (Logical)
# {
#   "session_id": str (required, indexed),
#   "user_id": str (required),
#   "sender": "user" | "bot" (required),
#   "text": str (required),
#   "sentiment": str (optional),
#   "timestamp": datetime (required)
# }
messages_collection = db["messages"]
# Ensure indexes for faster queries
messages_collection.create_index([("session_id", 1), ("timestamp", 1)])

# NEW COLLECTIONS
journals_collection = db["journals"]
moods_collection = db["moods"]
tasks_collection = db["tasks"]
meditation_collection = db["meditation_sessions"]
sleep_collection = db["sleep_records"]
community_collection = db["community_posts"]
goals_collection = db["goals"]