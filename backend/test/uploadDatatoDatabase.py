from astrapy import DataAPIClient

# Initialize the client
client = DataAPIClient()
db = client.get_database(
  "https://d6257452-c098-4673-bb3c-291dac209755-us-east-2.apps.astra.datastax.com",
  token="YOUR_TOKEN"
)

print(f"Connected to Astra DB: {db.list_collection_names()}")

