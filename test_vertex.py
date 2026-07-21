from google import genai

client = genai.Client(
    vertexai=True,
    project="devops-champ",
    location="us-central1",
)

print("Before generate_content")

response = client.models.generate_content(
    model="gemini-2.5-flash",
    contents="Say hello in one sentence.",
)

print("After generate_content")
print(response.text)