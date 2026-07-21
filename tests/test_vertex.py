from google import genai

client = genai.Client(
    vertexai=True,
    project="devops-champ",
    location="us-central1",
)

print("Before")

response = client.models.generate_content(
    model="gemini-2.5-flash",
    contents="Say hello.",
)

print("After")
print(response.text)